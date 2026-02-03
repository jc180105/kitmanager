require('dotenv').config();
const pool = require('./config/database');
const fs = require('fs');
const path = require('path');

async function checkStatus() {
    console.log('--- Diagnóstico WhatsApp Bot ---');

    // 1. Check DB Config
    try {
        const res = await pool.query("SELECT * FROM config WHERE chave = 'whatsapp_ativo'");
        if (res.rows.length > 0) {
            console.log(`[DB] whatsapp_ativo: ${res.rows[0].valor}`);
        } else {
            console.log('[DB] whatsapp_ativo: NÃO ENCONTRADO na tabela config');
        }
    } catch (err) {
        console.error('[DB] Erro ao consultar config:', err.message);
    }

    // 2. Check Env
    console.log(`[ENV] OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Definida' : 'NÃO DEFINIDA'}`);

    // 3. Check Auth Info
    const authDir = path.join(__dirname, 'auth_info');
    if (fs.existsSync(authDir)) {
        const files = fs.readdirSync(authDir);
        console.log(`[FS] auth_info existe com ${files.length} arquivos.`);
    } else {
        console.log('[FS] auth_info NÃO existe.');
    }

    pool.end();
}

checkStatus();
