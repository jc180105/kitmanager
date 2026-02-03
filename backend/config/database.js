const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
    // Local fallback
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5433,
    user: process.env.DB_USER || 'usuario',
    password: process.env.DB_PASSWORD || 'senha_segura',
    database: process.env.DB_NAME || 'imobiliaria'
});

module.exports = pool;
