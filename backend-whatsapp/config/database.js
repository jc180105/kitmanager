require('dotenv').config();
const { Pool } = require('pg');

// Usar a mesma DATABASE_URL do backend principal
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;
