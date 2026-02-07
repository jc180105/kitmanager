require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('visitas', 'agendamentos');
        `);
        console.log('Tabelas encontradas:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
        process.exit();
    }
})();
