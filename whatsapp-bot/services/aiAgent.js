const OpenAI = require('openai');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Inicializar OpenAI (se houver chave)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
}) : null;

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
        await pool.query(`
            CREATE TABLE IF NOT EXISTS whatsapp_messages (
                id SERIAL PRIMARY KEY,
                telefone VARCHAR(20),
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
        console.error('Erro ao salvar mensagem:', error);
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

        // Primeiro cria a tabela se não existir
        await pool.query(`
            CREATE TABLE IF NOT EXISTS leads (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100),
                telefone VARCHAR(20) UNIQUE,
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
 * Gera resposta usando OpenAI + contexto do banco + Tools
 */
async function gerarResposta(mensagemUsuario, telefoneUsuario) {
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
2. Use a ferramenta \`register_lead\` SEMPRE que o cliente demonstrar interesse ou disser o nome.
3. Se o nome for 'Desconhecido', pergunte o nome. Se ele responder, CHAME \`register_lead\` com o nome.
4. Não invente kitnets. Se não tem livres, diga que não tem.
5. Seja curto, amigável e use emojis 🏠.
6. **LOCALIZAÇÃO:** No início ou final da conversa, SEMPRE ofereça/mostre a localização neste formato:
   - *Localização:* R. Porto Reis, 125 - Praia de Fora, Palhoça
   - *Google Maps:* https://maps.app.goo.gl/wYwVUsGdTAFPSoS79
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

                    const sucesso = await registrarLead(args.nome, telefoneUsuario);

                    messages.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: "register_lead",
                        content: sucesso ? "Lead registrado com sucesso. Agradeça o cliente." : "Erro ao registrar lead."
                    });
                }
            }

            // 2ª Chamada: O modelo gera a resposta final baseada no resultado da tool
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
    registrarLead
};
