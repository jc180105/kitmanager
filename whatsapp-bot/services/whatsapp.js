const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
const { gerarResposta, transcreverAudio } = require('./aiAgent');

let sock = null;
let currentQR = null;
const messageRateLimit = new Map(); // Armazena timestamp da última mensagem por usuário
let makeWASocket, DisconnectReason, useMultiFileAuthState, downloadMediaMessage;

// Inicializar OpenAI para transcrição
// Inicializar OpenAI para transcrição (apenas se tiver key)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
}) : null;

// Função para enviar mídia (necessária para o agente)
async function sendMedia(telefone, mediaPath, mimetype, fileName, caption) {
    if (!sock) return;

    try {
        const buffer = fs.readFileSync(mediaPath);


        let messagePayload = {};
        if (mimetype.startsWith('video/')) {
            messagePayload = {
                video: buffer,
                caption: caption,
                gifPlayback: false
            };
        } else if (mimetype.startsWith('image/')) {
            messagePayload = {
                image: buffer,
                caption: caption
            };
        } else {
            messagePayload = {
                document: buffer,
                mimetype: mimetype,
                fileName: fileName,
                caption: caption
            };
        }

        await sock.sendMessage(telefone, messagePayload);
        console.log(`📎 Mídia enviada para ${telefone}: ${fileName}`);
    } catch (error) {
        console.error('Erro ao enviar mídia:', error);
    }
}

/**
 * Carrega Baileys dinamicamente (ESM)
 */
async function loadBaileys() {
    const baileys = await import('@whiskeysockets/baileys');
    makeWASocket = baileys.default;
    DisconnectReason = baileys.DisconnectReason;
    useMultiFileAuthState = baileys.useMultiFileAuthState;
    downloadMediaMessage = baileys.downloadMediaMessage;
    return baileys;
}

// ...

async function initWhatsApp() {
    const baileys = await loadBaileys();

    const qrcode = require('qrcode-terminal');
    const usePgAuthState = require('./usePgAuthState');
    const pool = require('../config/database');

    // USAR AUTH VIA POSTGRES (PERSISTENTE)
    const { state, saveCreds } = await usePgAuthState(baileys);

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['KitManager Bot', 'Chrome', '1.0.0']
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            currentQR = qr; // Salva o QR Code atual
            console.log('\n================================================================================');
            console.log('📱 VOCE SOLICITOU CONEXAO VIA TERMINAL');
            console.log('📱 ESCANIE O QR CODE ABAIXO COM SEU WHATSAPP:');
            console.log('================================================================================\n');
            qrcode.generate(qr, { small: true });

            // SAVE QR TO DATABASE
            try {
                await pool.query(`
                    INSERT INTO config (chave, valor, atualizado_em) 
                    VALUES ('whatsapp_qr', $1, CURRENT_TIMESTAMP)
                    ON CONFLICT (chave) 
                    DO UPDATE SET valor = $1, atualizado_em = CURRENT_TIMESTAMP
                `, [qr]);
                console.log('✅ QR Code salvo no banco de dados!');
            } catch (err) {
                console.error('Erro ao salvar QR no banco:', err);
            }

            console.log('\n================================================================================');
            console.log('Caso a imagem acima nao apareca ou esteja distorcida, use a string abaixo:');
            console.log(qr);
            console.log('================================================================================\n');
            console.log('\n⏳ Aguardando conexão...\n');
        }

        if (connection === 'open') {
            currentQR = null; // Limpa QR Code após conectar

            // CLEAR QR & SET STATUS CONNECTED
            try {
                await pool.query(`
                    INSERT INTO config (chave, valor, atualizado_em) VALUES 
                    ('whatsapp_qr', null, CURRENT_TIMESTAMP),
                    ('whatsapp_status', 'connected', CURRENT_TIMESTAMP)
                    ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = CURRENT_TIMESTAMP
                `);
            } catch (err) { console.error('Erro ao atualizar status DB (Open):', err); }

            console.log('✅ WhatsApp conectado com sucesso!');
            console.log('🤖 Bot pronto para receber mensagens.\n');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            // SET STATUS DISCONNECTED
            try {
                await pool.query(`
                    INSERT INTO config (chave, valor, atualizado_em) 
                    VALUES ('whatsapp_status', 'disconnected', CURRENT_TIMESTAMP)
                    ON CONFLICT (chave) DO UPDATE SET valor = 'disconnected', atualizado_em = CURRENT_TIMESTAMP
                `);
            } catch (err) { console.error('Erro ao atualizar status DB (Close):', err); }

            if (shouldReconnect) {
                console.log('⚠️ Conexão perdida. Reconectando...');
                await initWhatsApp();
            } else {
                console.log('❌ Desconectado do WhatsApp.');
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') return;

        const remetente = msg.key.participant || msg.key.remoteJid;
        const telefone = remetente.replace('@s.whatsapp.net', '').replace('@lid', '');

        // Rate Limiting (3 segundos entre mensagens)
        const now = Date.now();
        const lastMessageTime = messageRateLimit.get(remetente) || 0;

        if (now - lastMessageTime < 3000) {
            console.log(`⏳ Rate Limit: Ignorando mensagem de ${telefone} (muito rápido)`);
            return;
        }
        messageRateLimit.set(remetente, now);

        let textoMensagem = '';

        const audioMessage = msg.message.audioMessage;
        if (audioMessage) {
            console.log(`🎤 Áudio recebido de ${telefone}`);
            try {
                await sock.sendPresenceUpdate('composing', remetente);
                const audioBuffer = await downloadMediaMessage(msg, 'buffer', {});
                const textoTranscrito = await transcreverAudio(audioBuffer);
                if (textoTranscrito) {
                    textoMensagem = textoTranscrito;
                } else {
                    await sock.sendMessage(remetente, { text: 'Desculpe, não consegui entender o áudio. Pode enviar texto? 😊' });
                    return;
                }
            } catch (error) {
                console.error('Erro ao processar áudio:', error);
                await sock.sendMessage(remetente, { text: 'Erro ao processar áudio. Tente novamente.' });
                return;
            }
        } else {
            textoMensagem = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || '';
        }

        if (!textoMensagem.trim()) return;
        console.log(`📩 Mensagem de ${telefone}: ${textoMensagem}`);

        try {
            await sock.sendPresenceUpdate('composing', remetente);
            // Gerar resposta com IA (passando callback de mídia)
            const resposta = await gerarResposta(textoMensagem, remetente, sendMedia);

            if (resposta) {
                await sock.sendMessage(remetente, { text: resposta });
                console.log(`📤 Resposta enviada para ${telefone}`);
            }
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            await sock.sendMessage(remetente, { text: 'Desculpe, ocorreu um erro. Tente novamente.' });
        }
    });

    return sock;
}

async function enviarMensagem(numero, texto) {
    if (!sock) throw new Error('WhatsApp não está conectado');
    const jid = numero.includes('@') ? numero : `${numero}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: texto });
}

function isConnected() {
    return sock?.user ? true : false;
}

async function stopWhatsApp() {
    if (sock) {
        sock.end(undefined);
        sock = null;
    }
}

function getQR() {
    return currentQR;
}

module.exports = { initWhatsApp, enviarMensagem, isConnected, stopWhatsApp, getQR };
