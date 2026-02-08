const pool = require('../config/database');

async function runMigrations() {
    console.log('🔄 Verificando migrações de banco de dados...');

    try {
        // Migration 1: Fix telefone column size (20 -> 60)
        // Isso resolve o erro "value too long for type character varying(20)"
        // Migration 1: Fix telefone column size (20 -> 60)
        try {
            await pool.query('ALTER TABLE whatsapp_messages ALTER COLUMN telefone TYPE VARCHAR(60)');
            console.log('✅ Coluna telefone redimensionada para VARCHAR(60)');
        } catch (err) {
            // Ignore error if column is already correct size or other benign issues
            // but log it just in case
            console.log('ℹ️ Nota sobre migração (telefone):', err.message);
        }
        console.log('✅ Migrações concluídas.');
    } catch (error) {
        console.error('❌ Erro ao rodar migrações:', error);
    }
}

module.exports = { runMigrations };
