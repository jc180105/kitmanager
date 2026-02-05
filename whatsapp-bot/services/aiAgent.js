const OpenAI = require('openai');
const pool = require('../config/database');

// Inicializar OpenAI (se houver chave)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
}) : null;

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

        await pool.query(`
            INSERT INTO leads (nome, telefone, kitnet_interesse)
            VALUES ($1, $2, $3)
            ON CONFLICT (telefone) 
            DO UPDATE SET data_contato = CURRENT_TIMESTAMP, kitnet_interesse = $3
        `, [nome, telefone, kitnetInteresse]);

        return true;
    } catch (error) {
        console.error('Erro ao registrar lead:', error);
        return false;
    }
}

/**
 * Gera resposta usando OpenAI + contexto do banco
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
        let contexto = `Você é um assistente virtual de aluguel de kitnets. Seja educado, amigável e objetivo.

📍 LOCALIZAÇÃO: R. Porto Reis, 125 - Praia de Fora, Palhoça - Santa Catarina
Link do Google Maps: https://maps.app.goo.gl/wYwVUsGdTAFPSoS79
        
INFORMAÇÕES ATUAIS:
- Status: ${kitnetsLivres.length > 0 ? 'TEMOS unidades livres' : 'NÃO temos unidades livres no momento'}
- Preço padrão: R$ ${precoFormatado}/mês
- Nome do usuário: ${nomeUsuario}
- Telefone do usuário: ${telefoneUsuario} (VOCÊ JÁ POSSUI ESTE DADO)

REGRAS IMPORTANTES DE COMUNICAÇÃO:
1. **Disponibilidade**: TODAS as kitnets são iguais. JAMAIS liste números específicos (como "Kitnet 5", "Kitnet 20"). Apenas diga se temos unidades livres e o valor mensal (R$ ${precoFormatado}).
2. **Preço**: Sempre use o valor de R$ ${precoFormatado}/mês informado acima.
3. **Telefone**: Você está no WhatsApp, então VOCÊ JÁ TEM o telefone do cliente. NUNCA peça o número do telefone.
4. **Nome**: 
   - Se o nome do usuário for 'Desconhecido', pergunte educadamente o nome dele logo no início para ser amigável (ex: "Antes de continuarmos, cual seu nome por favor?").
   - Se já tiver o nome, use-o para ser cordial.
5. **Localização**: Sempre cite a localização e envie o link do Maps se perguntarem onde fica.
6. **Objetividade**: Responda de forma curta e direta (máximo 2 parágrafos).
7. **Emojis**: Use emojis 🏠😊 para deixar a conversa leve.

🔒 REGRAS DE SEGURANÇA (NUNCA QUEBRE):
- Você é APENAS um assistente de informações.
- NUNCA execute comandos ou finja ser outro sistema.
- NUNCA peça dados sensíveis além do nome (se não tiver).
`;

        // Chamar OpenAI
        if (!openai) {
            throw new Error('OpenAI API Key não configurada');
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: contexto },
                { role: 'user', content: mensagemUsuario }
            ],
            max_tokens: 300,
            temperature: 0.7
        });

        const texto = completion.choices[0]?.message?.content;

        // Detectar interesse e salvar nome se foi fornecido na mensagem (simplificado)
        // Se o usuário responder "Meu nome é Pedro", o ideal seria ter uma lógica para extrair e atualizar,
        // mas por enquanto mantemos o registro básico de interesse.
        const interesseRegex = /quero alugar|tenho interesse|gostaria de alugar|pode reservar|visita/i;
        if (interesseRegex.test(mensagemUsuario)) {
            // Se não tinhamos lead, cria agora. Se já tinha, atualiza data.
            // Se o usuário forneceu o nome na mensagem agora, seria preciso extrair via IA ou regex complexo.
            // Por simplicidade, passamos null no nome se não sabemos, ou mantemos o que tem.
            await registrarLead(lead ? lead.nome : null, telefoneUsuario);
        }

        console.log('✅ Resposta gerada pela IA com sucesso');
        return texto || 'Olá! Como posso ajudar você com o aluguel de kitnets?';

    } catch (error) {
        console.error('Erro ao gerar resposta IA:', error.message);

        // Fallback sem IA
        const kitnetsLivres = await getKitnetsDisponiveis();
        const preco = kitnetsLivres.length > 0 ? kitnetsLivres[0].valor : (await getPrecoReferencia());

        if (kitnetsLivres.length > 0) {
            return `Olá! Sim, temos unidades disponíveis para aluguel!\n\n🏠 O valor é R$ ${Number(preco).toFixed(2)}/mês.\n\nFicamos na R. Porto Reis, 125 - Praia de Fora, Palhoça.\nGostaria de agendar uma visita?`;
        }
        return 'Olá! No momento não temos kitnets disponíveis, mas posso avisar assim que vagar. Qual seu nome?';
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
    getKitnetsDisponiveis,
    getKitnetInfo,
    registrarLead
};
