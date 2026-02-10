const { Pool } = require('pg');

let poolConfig;

if (process.env.DATABASE_URL) {
    // Production: use connection string (Railway, etc.)
    poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false,
    };
} else {
    // Local development: use individual env vars
    poolConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'imobiliaria',
    };

    if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
        console.warn('⚠️ DB_USER e DB_PASSWORD não configurados. Configure as variáveis de ambiente.');
    }
}

const pool = new Pool(poolConfig);

module.exports = pool;
