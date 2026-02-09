require('dotenv').config();
const express = require('express');
const { initWhatsApp, isConnected, getQR } = require('./services/whatsapp');
const { initCron } = require('./services/cronService');
const { runMigrations } = require('./services/migration');
const { testConnection } = require('./services/calendarService');

const app = express();
const PORT = process.env.PORT || 3002;

// Basic landing page to avoid Railway "Not Found"
app.get('/', (req, res) => {
    res.send('<h1>🤖 WhatsApp Bot is Running!</h1><p>Check <a href="/health">/health</a> for status or <a href="/qr">/qr</a> for connection.</p>');
});

// Health check endpoint
app.get('/health', async (req, res) => {
    const calendarStatus = await testConnection();
    res.json({
        status: 'ok',
        whatsapp: isConnected() ? 'connected' : 'disconnected',
        calendar: calendarStatus,
        timestamp: new Date().toISOString()
    });
});

// QR Code endpoint for scanning
app.get('/qr', (req, res) => {
    const qr = getQR();
    if (qr) {
        res.json({ qr, message: 'Escaneie o QR Code com seu WhatsApp' });
    } else if (isConnected()) {
        res.json({ message: 'WhatsApp já está conectado!' });
    } else {
        res.json({ message: 'QR Code não disponível. Aguarde...' });
    }
});

// Start server and WhatsApp
app.listen(PORT, async () => {
    console.log(`🚀 WhatsApp Bot rodando na porta ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`📱 QR Code: http://localhost:${PORT}/qr`);
    console.log('\n🔄 Inicializando WhatsApp...');

    try {
        await runMigrations();
        await initWhatsApp();
        initCron();
    } catch (error) {
        console.error('❌ Erro ao inicializar WhatsApp:', error);
        console.log('⚠️ Bot continuará rodando. Tente reiniciar.');
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Encerrando bot...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Encerrando bot...');
    process.exit(0);
});
