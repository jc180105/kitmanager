const OpenAI = require('openai');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Inicializar OpenAI (se houver chave)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
}) : null;

// const { generateRulesPDF } = require('./pdfService'); // Removed in favor of text message
const { createCalendarEvent, checkAvailability, getFreeSlotsForDay } = require('./calendarService');
// const { isConnected, notifyAdmin } = require('./whatsapp'); // circular dependency removed

// Definição das Ferramentas (Tools)
const tools = [
    {
        type: "function",
        function: {
            name: "register_lead",
            description: "Registra ou atualiza um lead (cliente interessado) no sistema. Use isso quando o usuário demonstrar interesse em alugar ou fornecer seu nome/informações.",
            parameters: {
                type: "object",
                properties: {
                    nome: {
                        type: "string",
                        description: "Nome do cliente, se fornecido. Se não souber, use null ou 'Desconhecido'."
                    },
                    pessoas_familia: {
                        type: "string",
                        description: "Quantas pessoas vão morar (ex: '2 adultos', 'eu e esposa', '3')."
                    },
                    renda: {
                        type: "string",
                        description: "Descrição da renda ou profissão (ex: 'sou pedreiro', 'aposentado', 'trabalho CLT')."
                    },
                    interesse: {
                        type: "string",
                        enum: ["novo", "visita"],
                        description: "Nível de interesse. 'novo' para interesse geral/perguntas, 'visita' se pedir para agendar visita."
                    }
                },
                required: ["interesse"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "send_rules_text",
            description: "Envia o texto com todas as regras, valores e detalhes atualizados. Use proativamente no início da conversa ou quando o cliente pedir 'valores', 'regras', 'como funciona'.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "send_tour_video",
            description: "Envia um vídeo tour mostrando a kitnet por dentro. Use quando o cliente pedir 'video', 'tour', 'filme' ou quiser ver como é por dentro.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "schedule_visit",
            description: "Agendar uma visita para o cliente. Use quando o cliente disser uma data/hora específica para visitar.",
            parameters: {
                type: "object",
                properties: {
                    data_horario: {
                        type: "string",
                        description: "Data e hora da visita (formato ISO ou legível, ex: '2023-10-27 14:00' ou 'amanhã as 14h'). A IA deve tentar normalizar para algo compreensível."
                    }
                },
                required: ["data_horario"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_free_slots",
            description: "Consulta quais horários estão livres no Google Calendar para uma data específica. Use isso SEMPRE que o cliente perguntar 'quais horários tem' ou mencionar um dia para visita.",
            parameters: {
                type: "object",
                properties: {
                    data: {
                        type: "string",
                        description: "Data para consulta (formato YYYY-MM-DD, ex: '2023-10-27' ou 'amanhã'). A IA deve converter datas relativas como 'amanhã' para a data real baseada na 'Data Atual' do sistema."
                    }
                },
                required: ["data"]
            }
        }
    },

    ,
    {
        type: "function",
        function: {
            name: "request_human",
            description: "Chama um atendente humano. Use APENAS se o cliente pedir explicitamente para falar com 'humano', 'pessoa', 'atendente' ou se estiver muito irritado/confuso.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    }
];

/**
 * Transcreve áudio usando OpenAI Whisper
 * @param {Buffer} audioBuffer - Buffer do áudio recebido do WhatsApp
 */
async function transcreverAudio(audioBuffer) {
    if (!openai) {
        console.error('OpenAI não inicializada. Não é possível transcrever.');
        return null;
    }

    const tempFilePath = path.join(os.tmpdir(), `audio_${Date.now()}.ogg`);

    try {
        console.log('🎤 Iniciando transcrição de áudio...');
        fs.writeFileSync(tempFilePath, audioBuffer);

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: "whisper-1",
        });

        console.log(`📝 Texto transcrito: "${transcription.text}"`);
        return transcription.text;

    } catch (error) {
        console.error('❌ Erro na transcrição:', error);
        return null;
    } finally {
        // Limpar arquivo temporário
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
    }
}

/**
 * Busca histórico recente
 */
async function getHistory(telefone) {
    try {
        const result = await pool.query(`
            SELECT role, content 
            FROM whatsapp_messages 
            WHERE telefone = $1 
            ORDER BY created_at DESC 
            LIMIT 10
        `, [telefone]);

        // Retorna na ordem cronológica (mais antigo primeiro) para a API entender
        return result.rows.reverse().map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    } catch (error) {
        // Se a tabela não existir, retorna vazio (será criada no saveMessage)
        return [];
    }
}

/**
 * Salva mensagem no histórico
 */
async function saveMessage(telefone, role, content) {
    try {
        // Garantir que a tabela existe com tamanho correto
        await pool.query(`
            CREATE TABLE IF NOT EXISTS whatsapp_messages (
                id SERIAL PRIMARY KEY,
                telefone VARCHAR(60),
                role VARCHAR(20),
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // Índice para deixar buscas rápidas
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_telefone ON whatsapp_messages(telefone)`);

        await pool.query(
            'INSERT INTO whatsapp_messages (telefone, role, content) VALUES ($1, $2, $3)',
            [telefone, role, content]
        );
    } catch (error) {
        console.error('Erro ao salvar mensagem (tentativa 1):', error);

        // Auto-fix: Se o erro for de tamanho de coluna (22001), tenta aumentar a coluna
        if (error.code === '22001') {
            try {
                console.log('🔧 (Auto-fix) Tentando aumentar tamanho da coluna telefone...');
                await pool.query('ALTER TABLE whatsapp_messages ALTER COLUMN telefone TYPE VARCHAR(60)');
                console.log('✅ Coluna alterada com sucesso! Tentando salvar novamente...');

                // Tenta salvar de novo
                await pool.query(
                    'INSERT INTO whatsapp_messages (telefone, role, content) VALUES ($1, $2, $3)',
                    [telefone, role, content]
                );
                console.log('✅ Mensagem salva (Recovered)!');
            } catch (err2) {
                console.error('❌ Falha crítica ao salvar mensagem após tentativa de correção:', err2);
            }
        }
    }
}

/**
 * Busca regras dinâmicas do banco
 */
async function getRules() {
    try {
        const result = await pool.query('SELECT chave, valor FROM rules');
        const rules = {};
        // Convert array to object { key: value }
        result.rows.forEach(row => {
            rules[row.chave] = row.valor;
        });

        // Default fallbacks if db is empty
        return {
            base_price: rules.base_price || '850.00',
            deposit_value: rules.deposit_value || '450.00',
            ...rules
        };
    } catch (error) {
        console.error('Erro ao buscar regras:', error);
        return {
            base_price: '850.00',
            deposit_value: '450.00',
            contract_months: '6',
            wifi_included: 'Não',
            water_included: 'Sim',
            light_included: 'Sim',
            garage_rules: 'Apenas Moto',
            pet_rules: 'Não aceita pets',
            capacity_rules: 'Máximo 2 pessoas. Sem crianças.',
            furniture_rules: 'Mobiliada',
            laundry_rules: 'Com lavanderia'
        };
    }
}

/**
 * Busca kitnets disponíveis no banco de dados
 */
async function getKitnetsDisponiveis() {
    try {
        const result = await pool.query(`
            SELECT numero, valor, descricao, status
            FROM kitnets 
            WHERE LOWER(status) = 'livre' 
            ORDER BY numero
        `);
        console.log(`🏠 Kitnets livres encontradas: ${result.rows.length}`);
        return result.rows;
    } catch (error) {
        console.error('Erro ao buscar kitnets:', error);
        return [];
    }
}

/**
 * Busca informações de uma kitnet específica
 */
async function getKitnetInfo(numero) {
    try {
        const result = await pool.query(
            'SELECT numero, valor, descricao, status FROM kitnets WHERE numero = $1',
            [numero]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Erro ao buscar kitnet:', error);
        return null;
    }
}

/**
 * Registra um lead interessado
 */
async function registrarLead(nome, telefone, kitnetInteresse = null, pessoasFamilia = null, renda = null) {
    try {
        console.log(`📝 Registrando Lead: ${nome || 'Nome não inf.'} - ${telefone}`);

        // Ensure table exists with new columns
        await pool.query(`
            CREATE TABLE IF NOT EXISTS leads (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100),
                telefone VARCHAR(60) UNIQUE,
                kitnet_interesse INTEGER,
                data_contato TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'novo',
                pessoas_familia VARCHAR(100),
                renda VARCHAR(200)
            )
        `);

        // Migration: Attempt to add columns if they don't exist (for existing tables)
        try {
            await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS pessoas_familia VARCHAR(100)`);
            await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS renda VARCHAR(200)`);
        } catch (migErr) {
            // Ignore if columns exist or other harmless error
            console.log('Migration check passed or skipped');
        }

        // Verifica se o lead já existe para não sobrescrever nome existente com null
        const existingLead = await getLeadByPhone(telefone);
        let nomeFinal = nome;

        if (existingLead && existingLead.nome && !nome) {
            // Mantém o nome antigo se o novo for nulo
            nomeFinal = existingLead.nome;
        }

        await pool.query(`
            INSERT INTO leads (nome, telefone, kitnet_interesse, pessoas_familia, renda)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (telefone) 
            DO UPDATE SET 
                data_contato = CURRENT_TIMESTAMP, 
                kitnet_interesse = COALESCE($3, leads.kitnet_interesse),
                nome = COALESCE($1, leads.nome),
                pessoas_familia = COALESCE($4, leads.pessoas_familia),
                renda = COALESCE($5, leads.renda)
        `, [nomeFinal, telefone, kitnetInteresse, pessoasFamilia, renda]);

        return true;
    } catch (error) {
        console.error('Erro ao registrar lead:', error);
        return false;
    }
}

/**
 * Agenda uma visita
 */
async function agendarVisita(telefone, dataHorario) {
    try {
        console.log(`📅 Agendando visita para ${telefone} em ${dataHorario}`);

        // Simples inserção para MVP. Ideal seria validar colisão de horários.
        // A IA já deve enviar uma string de data mais ou menos formatada.
        // Se o banco falhar por formato inválido, a IA vai receber erro e pedir de novo.
        // Convertendo para timestamp do Postgres
        // Tenta criar um objeto Date
        // Se falhar o insert vai dar erro e pegamos no catch

        // Normalização básica de data
        // Vamos confiar que o PostgreSQL aceite formatos flexíveis ou que a OpenAI formate bem
        // O ideal é a OpenAI enviar ISO 8601

        await pool.query(`
            INSERT INTO visitas (telefone, data_visita)
            VALUES ($1, $2::timestamp)
        `, [telefone, dataHorario]); // $2::timestamp tenta forçar cast

        return true;
    } catch (error) {
        console.error('Erro ao agendar visita:', error);
        return false;
    }
}



/**
 * Gera resposta usando OpenAI + contexto do banco + Tools
 */
async function gerarResposta(mensagemUsuario, telefoneUsuario, sendMediaCallback = null, notifyAdminCallback = null, pushName = '') {
    try {
        // Buscar informações do usuário (Lead)
        const lead = await getLeadByPhone(telefoneUsuario);
        let nomeUsuario = lead ? lead.nome : 'Desconhecido';

        // Se não tem no banco mas tem no WhatsApp Profile, usa o do Profile
        if (nomeUsuario === 'Desconhecido' && pushName) {
            nomeUsuario = pushName;
        }

        // Buscar contexto do banco
        const kitnetsLivres = await getKitnetsDisponiveis();
        const rules = await getRules();

        // Lógica de Preço Dinâmico: 
        // 1. Tenta pegar o valor de uma kitnet livre
        // 2. Senão, tenta o getPrecoReferencia (qualquer kitnet)
        // 3. Por fim, usa o base_price das rules
        const precoReferencia = kitnetsLivres.length > 0 ? kitnetsLivres[0].valor : await getPrecoReferencia();
        const precoReal = (precoReferencia && precoReferencia > 0) ? precoReferencia : rules.base_price;
        const precoFormatado = Number(precoReal).toFixed(2);

        // Sincronizar precoFormatado de volta no rules para a IA usar o valor real nas regras
        rules.base_price = precoFormatado;

        // Montar contexto para a IA
        let contexto = `Você é um assistente virtual de aluguel de kitnets.
        
📍 DADOS DO SISTEMA:
- Data Atual: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
- Unidades livres agora:
${kitnetsLivres.length > 0 ? kitnetsLivres.map(k => `  • Unidade ${k.numero}: R$ ${Number(k.valor).toFixed(2)} (${k.descricao || 'Sem descrição'})`).join('\n') : '  • NENHUMA DISPONÍVEL'}
- Cliente atual: ${nomeUsuario} (${telefoneUsuario})
- Endereço: R. Porto Reis, 125 - Praia de Fora, Palhoça (https://maps.app.goo.gl/wYwVUsGdTAFPSoS79)

🤖 SUAS INSTRUÇÕES:
1. Seu objetivo é tirar dúvidas e **REGISTRAR O INTERESSE** do cliente.
2. **PROATIVIDADE (Início):** Logo no início da conversa (após o 'Olá'), se o cliente ainda não viu, ofereça:
   - "Gostaria que eu te mandasse um **vídeo tour** da kitnet e a **lista de valores e regras** por escrito?"
   - Se ele disser "sim", use as tools 'send_tour_video' e 'send_rules_text'.
3. Use a ferramenta 'register_lead' quando o cliente disser o nome ou fornecer as infos de qualificação (pessoas/renda).
4. **LOCALIZAÇÃO:** No início ou final da conversa, SEMPRE ofereça/mostre a localização e Maps.
5. **FLUXO DE AGENDAMENTO (RIGOROSO):**
   - Se o cliente quiser visitar, você DEVE obter 2 informações antes: **Quantas pessoas?** e **Qual o trabalho?**.
   - Se ele responder isso (ou já tiver falado no início), REGISTRE com 'register_lead'.
   - **ASSIM QUE ELE RESPONDER ESTAS DUAS INFOS**, se ele já falou o dia, use IMEDIATAMENTE a tool 'get_free_slots' para esse dia.
   - Se ele NÃO falou o dia, peça o dia. Assim que ele der o dia, use 'get_free_slots'.
   - **NUNCA** mostre uma lista genérica de horários. Mostre APENAS os horários que a tool 'get_free_slots' retornar como livres.
   - Se a tool retornar vazio, diga que o dia está lotado e ofereça outro.
   - Após o cliente escolher um dos horários confirmados como livres, use 'schedule_visit'.

6. Se o nome parecer um apelido ou emoji, PERGUNTE o nome real antes de agendar.
7. Não invente kitnets. Se não tem livres, diga que não tem.
8. Seja curto, amigável e use emojis 🏠.
9. **NUNCA USE A PALAVRA 'FOLDER'**. Use "lista de regras", "valores por escrito", etc.
`;

        // Chamar OpenAI
        if (!openai) {
            throw new Error('OpenAI API Key não configurada');
        }

        // --- MEMÓRIA DA CONVERSA ---
        // 1. Salvar mensagem do usuário
        await saveMessage(telefoneUsuario, 'user', mensagemUsuario);

        // 2. Buscar histórico recente (últimas 10 mensagens)
        const history = await getHistory(telefoneUsuario);

        // 3. Montar mensagens para a API
        const messages = [
            { role: 'system', content: contexto },
            ...history
        ];

        // 1ª Chamada: O modelo decide se usa texto ou tool
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
            tools: tools,
            tool_choice: "auto",
            max_tokens: 300,
            temperature: 0.7
        });

        const responseMessage = completion.choices[0].message;
        let finalResponseText = responseMessage.content || '';

        // Verifica se a IA quer chamar alguma ferramenta
        if (responseMessage.tool_calls) {
            messages.push(responseMessage); // Adiciona a intenção da tool ao histórico

            // Executa cada ferramenta solicitada
            for (const toolCall of responseMessage.tool_calls) {
                if (toolCall.function.name === 'register_lead') {
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log(`🔨 Tool Call: register_lead`, args);

                    const sucesso = await registrarLead(args.nome, telefoneUsuario, null, args.pessoas_familia, args.renda);

                    // FIX: Atualizar contexto IMEDIATAMENTE para a próxima geração não perguntar o nome de novo
                    if (args.nome && args.nome !== 'Desconhecido') {
                        contexto = contexto.replace(`Cliente atual: ${nomeUsuario}`, `Cliente atual: ${args.nome}`);
                        messages[0].content = contexto; // Atualiza a mensagem de sistema no histórico local
                    }

                    messages.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: "register_lead",
                        content: sucesso ? "Lead registrado com sucesso. Agradeça o cliente." : "Erro ao registrar lead."
                    });
                } else if (toolCall.function.name === 'send_rules_text') {
                    console.log(`🔨 Tool Call: send_rules_text`);

                    // Re-buscar para ter os dados mais frescos das kitnets
                    const r = await getRules();
                    const kLivres = await getKitnetsDisponiveis();

                    // Se houver kitnets livres, usa o preço da primeira encontrada como base. 
                    // Se não houver, cai no base_price das rules.
                    let valorAluguel = r.base_price;
                    if (kLivres.length > 0) {
                        valorAluguel = Number(kLivres[0].valor).toFixed(2);
                    }

                    const folderText = `📄 *VALORES E REGRAS - KITNETS PRAIA DE FORA* 📄

📍 *Endereço:* R. Porto Reis, 125 - Praia de Fora, Palhoça
💰 *Aluguel:* R$ ${valorAluguel} / mês
✅ *Incluso:* Água e Luz
🚫 *Internet:* ${r.wifi_included}

🛏️ *Mobília:* ${r.furniture_rules}
🏍️ *Garagem:* ${r.garage_rules}
🧺 *Lavanderia:* ${r.laundry_rules}
👤 *Capacidade:* ${r.capacity_rules}
🐕 *Pets:* ${r.pet_rules}

📝 *Contrato:* Tempo mínimo ${r.contract_months} meses
💵 *Caução:* R$ ${r.deposit_value}

🕙 *Visitas:* Seg-Sex das 10h às 17h
Agende sua visita aqui no chat!`;

                    messages.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: "send_rules_text",
                        content: folderText
                    });
                } else if (toolCall.function.name === 'send_tour_video') {
                    console.log(`🔨 Tool Call: send_tour_video`);

                    try {
                        // Get video path (for now, static or from first kitnet)
                        // In real app, we would get specific kitnet video
                        const kitnets = await getKitnetsDisponiveis();
                        let videoPath = kitnets.length > 0 ? kitnets[0].video : null;

                        // Fallback if null in DB but file exists known
                        if (!videoPath) {
                            // Use relative path for Docker compatibility
                            videoPath = path.join(__dirname, '../assets/tour_video.mp4');
                        }

                        if (sendMediaCallback && videoPath && fs.existsSync(videoPath)) {
                            await sendMediaCallback(telefoneUsuario, videoPath, 'video/mp4', 'tour_kitnet.mp4', '🎥 Aqui está um vídeo mostrando a kitnet por dentro!');

                            messages.push({
                                tool_call_id: toolCall.id,
                                role: "tool",
                                name: "send_tour_video",
                                content: "Vídeo enviado com sucesso."
                            });
                        } else {
                            messages.push({
                                tool_call_id: toolCall.id,
                                role: "tool",
                                name: "send_tour_video",
                                content: "Erro: Vídeo não encontrado no sistema."
                            });
                        }
                    } catch (error) {
                        console.error('Erro ao enviar vídeo:', error);
                        messages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: "send_tour_video",
                            content: "Erro técnico ao enviar vídeo."
                        });
                    }

                } else if (toolCall.function.name === 'schedule_visit') {
                    console.log(`🔨 Tool Call: schedule_visit`);
                    const args = JSON.parse(toolCall.function.arguments);

                    try {
                        // 1. Verificar disponibilidade no Google Calendar
                        const isAvailable = await checkAvailability(args.data_horario);

                        if (!isAvailable) {
                            messages.push({
                                tool_call_id: toolCall.id,
                                role: "tool",
                                name: "schedule_visit",
                                content: "❌ Horário indisponível (conflito de agenda). Peça para o cliente escolher outro horário."
                            });
                            continue; // Pula para o próximo tool call ou encerra este
                        }

                        // 2. Se livre, prossegue com agendamento local
                        const agendado = await agendarVisita(telefoneUsuario, args.data_horario);

                        if (agendado) {
                            // Tentar agendar no Google Calendar
                            const calendarLink = await createCalendarEvent(telefoneUsuario, args.data_horario);
                            let msgConfirmacao = `Visita agendada com sucesso para ${args.data_horario}. Confirme com o cliente.`;

                            if (calendarLink) {
                                msgConfirmacao += ` (Adicionado ao Google Calendar: ${calendarLink})`;
                            } else {
                                msgConfirmacao += ` (Salvo apenas localmente, erro na sincronização com Google Calendar - verifique logs).`;
                            }

                            // Notificar Admin
                            const lead = await getLeadByPhone(telefoneUsuario);
                            const infoCliente = lead ? `${lead.nome} (${lead.pessoas_familia || '?'}, ${lead.renda || '?'})` : telefoneUsuario;
                            if (notifyAdminCallback) {
                                notifyAdminCallback(`📅 *NOVA VISITA AGENDADA*\n\n👤 Cliente: ${infoCliente}\n📞 Telefone: ${telefoneUsuario}\n🗓️ Data: ${args.data_horario}`);
                            }


                            messages.push({
                                tool_call_id: toolCall.id,
                                role: "tool",
                                name: "schedule_visit",
                                content: msgConfirmacao
                            });
                        } else {
                            messages.push({
                                tool_call_id: toolCall.id,
                                role: "tool",
                                name: "schedule_visit",
                                content: "Erro ao agendar. Talvez horário indisponível ou formato inválido."
                            });
                        }
                    } catch (error) {
                        console.error('Erro ao agendar visita:', error);
                        messages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: "schedule_visit",
                            content: "Erro técnico ao agendar visita."
                        });
                    }

                } else if (toolCall.function.name === 'get_free_slots') {
                    console.log(`🔨 Tool Call: get_free_slots`);
                    const args = JSON.parse(toolCall.function.arguments);

                    try {
                        const slotsLibres = await getFreeSlotsForDay(args.data);

                        messages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: "get_free_slots",
                            content: slotsLibres.length > 0
                                ? `Horários disponíveis para ${args.data}: ${slotsLibres.join(', ')}. Mostre estes horários para o cliente.`
                                : `Não há horários disponíveis para ${args.data}. Sugira outro dia.`
                        });
                    } catch (error) {
                        console.error('Erro ao buscar slots livres:', error);
                        messages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: "get_free_slots",
                            content: "Erro técnico ao consultar agenda."
                        });
                    }

                } else if (toolCall.function.name === 'request_human') {
                    console.log(`🔨 Tool Call: request_human`);

                    // Update lead status? Send notification?
                    // For now, just confirm to AI that human was requested
                    // The AI will then reply "Um atendente humano vai..."

                    // In a real scenario we would notify the admin here
                    console.log(`🚨 HUMAN HANDOFF REQUESTED FOR ${telefoneUsuario}`);

                    if (notifyAdminCallback) {
                        notifyAdminCallback(`🚨 *SOLICITAÇÃO DE AJUDA HUMANA*\n\nO cliente ${telefoneUsuario} pediu para falar com um atendente.\nVerifique o chat!`);
                    }

                    messages.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: "request_human",
                        content: "Solicitação recebida. Avise o cliente que um humano vai entrar em contato em breve."
                    });
                }
            }

            const secondResponse = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: messages
            });

            finalResponseText = secondResponse.choices[0].message.content;
        }

        // --- SALVAR RESPOSTA ---
        if (finalResponseText) {
            await saveMessage(telefoneUsuario, 'assistant', finalResponseText);
        }

        return finalResponseText;

    } catch (error) {
        console.error('Erro ao gerar resposta IA:', error.message);

        // Fallback Rápido
        const kitnetsLivres = await getKitnetsDisponiveis();
        const preco = kitnetsLivres.length > 0 ? kitnetsLivres[0].valor : (await getPrecoReferencia());
        if (kitnetsLivres.length > 0) {
            return `Olá! Temos unidades por R$ ${Number(preco).toFixed(2)}/mês. Gostaria de visitar?`;
        }
        return 'Olá! No momento estamos sem vagas. Deseja entrar na lista de espera?';
    }
}

/**
 * Busca lead pelo telefone
 */
async function getLeadByPhone(telefone) {
    try {
        const result = await pool.query('SELECT * FROM leads WHERE telefone = $1', [telefone]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Erro ao buscar lead:', error);
        return null;
    }
}

/**
 * Busca preço de referência (primeira kitnet encontrada)
 */
async function getPrecoReferencia() {
    try {
        const result = await pool.query('SELECT valor FROM kitnets LIMIT 1');
        return result.rows[0]?.valor || 0;
    } catch (error) {
        console.error('Erro ao buscar preço referência:', error);
        return 0;
    }
}

module.exports = {
    gerarResposta,
    transcreverAudio,
    getKitnetsDisponiveis,
    getKitnetInfo,
    registrarLead,
    agendarVisita
};
