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
        console.error('❌ Erro na migração de telefone:', error);
    }

    try {
        // Migration 2: Create rules table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rules (
                chave VARCHAR(50) PRIMARY KEY,
                valor TEXT
            )
        `);
        console.log('✅ Tabela rules verificada.');

        // Insert default values if not exists
        const defaultRules = [
            { key: 'base_price', value: '850.00' },
            { key: 'deposit_value', value: '450.00' },
            { key: 'contract_months', value: '6' },
            { key: 'wifi_included', value: 'Não (contratar à parte)' },
            { key: 'water_included', value: 'Sim' },
            { key: 'light_included', value: 'Sim' },
            { key: 'garage_rules', value: 'Apenas MOTO (não tem carro)' },
            { key: 'pet_rules', value: 'Não aceitamos animais' },
            { key: 'capacity_rules', value: 'Máximo 2 pessoas. Sem crianças.' },
            { key: 'furniture_rules', value: '100% mobiliadas (Cama, Geladeira, Fogão, Mesa, Guarda-roupa)' },
            { key: 'laundry_rules', value: 'Espaço e conexão para máquina na própria kitnet' }
        ];

        for (const rule of defaultRules) {
            await pool.query(`
                INSERT INTO rules (chave, valor) VALUES ($1, $2)
                ON CONFLICT (chave) DO NOTHING
            `, [rule.key, rule.value]);
        }
        console.log('✅ Regras padrão verificadas/inseridas.');

    } catch (error) {
        console.error('❌ Erro na migração de rules:', error);
    }
}

module.exports = { runMigrations };
