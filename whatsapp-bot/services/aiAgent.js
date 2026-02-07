const OpenAI = require('openai');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Inicializar OpenAI (se houver chave)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
}) : null;

const { generateRulesPDF } = require('./pdfService');
const { createCalendarEvent } = require('./calendarService');
const { isConnected } = require('./whatsapp'); // Will need to export sendMedia from here too

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
            name: "send_info_folder",
            description: "Envia um folder/PDF bonito com todas as regras, preços e detalhes das kitnets. Use quando o cliente pedir 'mais informações', 'folder', 'arquivo' ou 'regras por escrito'.",
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
    }

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
                console.log('🔧 Tentando aumentar tamanho da coluna telefone...');
                await pool.query('ALTER TABLE whatsapp_messages ALTER COLUMN telefone TYPE VARCHAR(60)');
                // Tenta salvar de novo
                await pool.query(
                    'INSERT INTO whatsapp_messages (telefone, role, content) VALUES ($1, $2, $3)',
                    [telefone, role, content]
                );
                console.log('✅ Mensagem salva após migração de schema!');
            } catch (err2) {
                console.error('Erro crítico ao salvar mensagem:', err2);
            }
        }
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
async function registrarLead(nome, telefone, kitnetInteresse = null) {
    try {
        console.log(`📝 Registrando Lead: ${nome || 'Nome não inf.'} - ${telefone}`);

        // Primeiro cria a tabela se não existir (garantindo VARCHAR(60))
        await pool.query(`
            CREATE TABLE IF NOT EXISTS leads (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100),
                telefone VARCHAR(60) UNIQUE,
                kitnet_interesse INTEGER,
                data_contato TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'novo'
            )
        `);

        // Verifica se o lead já existe para não sobrescrever nome existente com null
        const existingLead = await getLeadByPhone(telefone);
        let nomeFinal = nome;

        if (existingLead && existingLead.nome && !nome) {
            // Mantém o nome antigo se o novo for nulo
            nomeFinal = existingLead.nome;
        }

        await pool.query(`
            INSERT INTO leads (nome, telefone, kitnet_interesse)
            VALUES ($1, $2, $3)
            ON CONFLICT (telefone) 
            DO UPDATE SET 
                data_contato = CURRENT_TIMESTAMP, 
                kitnet_interesse = COALESCE($3, leads.kitnet_interesse),
                nome = COALESCE($1, leads.nome)
        `, [nomeFinal, telefone, kitnetInteresse]);

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
async function gerarResposta(mensagemUsuario, telefoneUsuario, sendMediaCallback = null) {
    try {
        // Buscar informações do usuário (Lead)
        const lead = await getLeadByPhone(telefoneUsuario);
        const nomeUsuario = lead ? lead.nome : 'Desconhecido';

        // Buscar contexto do banco
        const kitnetsLivres = await getKitnetsDisponiveis();
        const precoReferencia = kitnetsLivres.length > 0 ? kitnetsLivres[0].valor : await getPrecoReferencia();
        const precoFormatado = Number(precoReferencia).toFixed(2);

        // Montar contexto para a IA
        let contexto = `Você é um assistente virtual de aluguel de kitnets.
        
📍 DADOS DO SISTEMA:
- Unidades livres: ${kitnetsLivres.length > 0 ? 'SIM' : 'NÃO'}
- Preço base: R$ ${precoFormatado}/mês
- Cliente atual: ${nomeUsuario} (${telefoneUsuario})
- Endereço: R. Porto Reis, 125 - Praia de Fora, Palhoça (https://maps.app.goo.gl/wYwVUsGdTAFPSoS79)

🤖 SUAS INSTRUÇÕES:
1. Seu objetivo é tirar dúvidas e **REGISTRAR O INTERESSE** do cliente.
2. **PRIORIDADE MÁXIMA:** Se o cliente pedir "folder", "pdf", "arquivo", "informações por escrito" ou "regras", USE A FERRAMENTA \`send_info_folder\` IMEDIATAMENTE. Não faça perguntas antes. Envie o folder e DEPOIS pergunte o nome ou continue a conversa.
3. Use a ferramenta \`register_lead\` quando o cliente disser o nome ou demonstrar interesse em visitar.
4. Se o nome for 'Desconhecido' e ele NÃO pediu folder/video, pergunte o nome.
5. Não invente kitnets. Se não tem livres, diga que não tem.
6. Seja curto, amigável e use emojis 🏠.
7. **LOCALIZAÇÃO:** No início ou final da conversa, SEMPRE ofereça/mostre a localização neste formato:
   - *Localização:* R. Porto Reis, 125 - Praia de Fora, Palhoça
   - *Google Maps:* https://maps.app.goo.gl/wYwVUsGdTAFPSoS79
8. **AGENDAMENTO:** Se o cliente quiser visitar, pergunte data e hora. Use 'schedule_visit'.

📋 REGRAS E DETALHES (CÉREBRO):
- **Animais:** NÃO aceitamos pets/animais de estimação. 🚫🐶
- **Custos:** Água e Luz inclusos. Internet NÃO inclusa (contratar à parte). 💧💡❌🌐
- **Caução:** R$ 450,00 no primeiro mês. 💰
- **Mobília:** Sim, mobiliadas. 🛏️
- **Contrato:** Tempo mínimo de 6 meses. 📝
- **Garagem:** NÃO tem vaga para carro. Apenas estacionamento para MOTO no terreno. 🏍️
- **Lavanderia:** Tem espaço e conexão para máquina de lavar na própria kitnet. 🧺
- **Capacidade:** Prioridade para 1 pessoa. Máximo de 2 pessoas. NÃO aceita crianças. 👤
- **Silêncio:** Lei do silêncio após às 22h. 🤫
- **Documentos:** Necessário RG, CPF e Comp. Renda (detalhes a combinar na visita). 📄
- **Visitas:** Seg-Sex das 10h às 17h. 🕙`;

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

                    const sucesso = await registrarLead(args.nome, telefoneUsuario);

                    messages.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: "register_lead",
                        content: sucesso ? "Lead registrado com sucesso. Agradeça o cliente." : "Erro ao registrar lead."
                    });
                } else if (toolCall.function.name === 'send_info_folder') {
                    console.log(`🔨 Tool Call: send_info_folder`);

                    try {
                        // Generate PDF
                        const pdfPath = await generateRulesPDF();

                        // Send PDF (Need to import sendMedia from whatsapp service or pass socket)
                        // Temporarily, we will enhance the response to say we sent it, but actual sending needs socket access.
                        // We need to refactor slightly to access socket or use a callback/event.
                        // For now, let's assume valid PDF and return instruction to send it.

                        // BETTER APPROACH: Return a special tag in content or handle sending here if we import 'sendMedia' (circular dep risk).
                        // Let's use a global or require loop workaround, or just return the path to the main loop?
                        // Actually, 'whatsapp.js' calls 'aiAgent.js', so we can't easily require 'whatsapp.js' here without circular dep.
                        // Solution: Pass a 'sendMediaCallback' to 'gerarResposta'.

                        // CHANGING PLAN: I'll modify 'gerarResposta' signature to accept a 'sendMediaCallback'
                        if (sendMediaCallback) {
                            await sendMediaCallback(telefoneUsuario, pdfPath, 'application/pdf', 'folder_kitnets.pdf', 'Aqui está o folder com todas as informações! 📄');
                        }

                        messages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: "send_info_folder",
                            content: "Folder PDF gerado e enviado com sucesso."
                        });
                    } catch (error) {
                        console.error('Erro ao gerar/enviar PDF:', error);
                        messages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: "send_info_folder",
                            content: "Erro ao gerar o folder."
                        });
                    }
                } else if (toolCall.function.name === 'send_tour_video') {
                    console.log(`🔨 Tool Call: send_tour_video`);

                    try {
                        // Get video path (for now, static or from first kitnet)
                        // In real app, we would get specific kitnet video
                        const kitnets = await getKitnetsDisponiveis();
                        let videoPath = kitnets.length > 0 ? kitnets[0].video : null;

                        // Fallback if null in DB but file exists known
                        if (!videoPath) {
                            // Hardcoded fallback for now if DB update failed or didn't propagate 
                            videoPath = String.raw`c:\Users\pedro\OneDrive\Área de Trabalho\Agente Kitnets\fotos_e_videos\tour_video.mp4`;
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

                } else if (toolCall.function.name === 'request_human') {
                    console.log(`🔨 Tool Call: request_human`);

                    // Update lead status? Send notification?
                    // For now, just confirm to AI that human was requested
                    // The AI will then reply "Um atendente humano vai..."

                    // In a real scenario we would notify the admin here
                    console.log(`🚨 HUMAN HANDOFF REQUESTED FOR ${telefoneUsuario}`);

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
