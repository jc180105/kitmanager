require('dotenv').config();
const pool = require('./config/database');
const { initWhatsApp } = require('./services/whatsapp');

const PORT = process.env.PORT || 3002;

console.log('🤖 KitManager WhatsApp Bot v1.0.0');
console.log('================================\n');

// Verificar conexão com banco de dados
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Erro ao conectar no PostgreSQL:', err.message);
        process.exit(1);
    }

    console.log('✅ Conectado ao PostgreSQL (mesmo banco do app principal)');
    release();

    // Iniciar WhatsApp Bot
    initWhatsApp().catch(err => {
        console.error('❌ Erro fatal ao iniciar WhatsApp:', err.message);
        process.exit(1);
    });
});

// Health check simples (opcional - para Railway saber que está vivo)
const http = require('http');
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', service: 'whatsapp-bot' }));
    } else {
        res.writeHead(404);
        res.end('WhatsApp Bot Service - Use /health para status');
    }
});

server.listen(PORT, () => {
    console.log(`🌐 Health check disponível em http://localhost:${PORT}/health\n`);
});
