require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        console.log('🔄 Criando tabela de visitas...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS visitas (
                id SERIAL PRIMARY KEY,
                telefone VARCHAR(20) NOT NULL REFERENCES leads(telefone), -- Foreign key to leads table
                data_visita TIMESTAMP NOT NULL,
                status VARCHAR(20) DEFAULT 'agendado', -- agendado, realizado, cancelado
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add index on telefone and data_visita for quick lookups
        await pool.query('CREATE INDEX IF NOT EXISTS idx_visitas_telefone ON visitas(telefone)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_visitas_data ON visitas(data_visita)');

        console.log('✅ Tabela visitas criada com sucesso.');
    } catch (e) {
        console.error('❌ Erro:', e);
    } finally {
        await pool.end();
        process.exit();
    }
})();
