require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: 5432,
    user: process.env.DB_USER || 'usuario',
    password: process.env.DB_PASSWORD || 'senha_segura',
    database: process.env.DB_NAME || 'imobiliaria'
});

console.log('Testing connection to:', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_USER, process.env.DB_NAME);

pool.connect((err, client, release) => {
    if (err) {
        console.error('Connection error', err.message, err.stack);
    } else {
        console.log('Connected successfully');
        release();
    }
    pool.end();
});
