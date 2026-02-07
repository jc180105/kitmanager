const pool = require('../config/database');

async function runMigrations() {
    console.log('🔄 Verificando migrações de banco de dados...');

    try {
        // Migration 1: Fix telefone column size (20 -> 60)
        // Isso resolve o erro "value too long for type character varying(20)"
        await pool.query(`
            DO $$ 
            BEGIN 
                BEGIN
                    ALTER TABLE whatsapp_messages ALTER COLUMN telefone TYPE VARCHAR(60);
                    RAISE NOTICE 'Coluna telefone redimensionada para VARCHAR(60)';
                EXCEPTION
                    WHEN others THEN 
                        RAISE NOTICE 'Erro (ou já aplicado) ao redimensionar coluna: %', SQLERRM;
                END;
            END $$;
        `);
        console.log('✅ Migrações concluídas.');
    } catch (error) {
        console.error('❌ Erro ao rodar migrações:', error);
    }
}

module.exports = { runMigrations };
