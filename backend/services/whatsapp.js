const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
const { gerarResposta } = require('./aiAgent');

let sock = null;
let currentQR = null;
let makeWASocket, DisconnectReason, useMultiFileAuthState, downloadMediaMessage;

// Inicializar OpenAI para transcrição
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Carrega Baileys dinamicamente (ESM)
 */
async function loadBaileys() {
    const baileys = await import('@whiskeysockets/baileys');
    makeWASocket = baileys.default;
    DisconnectReason = baileys.DisconnectReason;
    useMultiFileAuthState = baileys.useMultiFileAuthState;
    downloadMediaMessage = baileys.downloadMediaMessage;
}

/**
 * Transcreve áudio usando OpenAI Whisper
 */
async function transcreverAudio(audioBuffer) {
    try {
        const tempPath = path.join(__dirname, '..', 'temp_audio.ogg');
        fs.writeFileSync(tempPath, audioBuffer);

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempPath),
            model: 'whisper-1',
            language: 'pt'
        });

        fs.unlinkSync(tempPath);
        console.log(`🎤 Áudio transcrito: "${transcription.text}"`);
        return transcription.text;
    } catch (error) {
        console.error('Erro ao transcrever áudio:', error.message);
        return null;
    }
}

/**
 * Inicializa conexão com WhatsApp via Baileys
 */
async function initWhatsApp() {
    await loadBaileys();

    const qrcode = require('qrcode-terminal');
    const authDir = path.join(__dirname, '..', 'auth_info');
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['KitManager Bot', 'Chrome', '1.0.0']
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            currentQR = qr; // Salva o QR Code atual
            console.log('\n📱 Escaneie o QR Code abaixo com seu WhatsApp:\n');
            qrcode.generate(qr, { small: true });
            console.log('\nSTRING DO QR CODE (Caso a imagem falhe):');
            console.log(qr);
            console.log('\n⏳ Aguardando conexão...\n');
        }

        if (connection === 'open') {
            currentQR = null; // Limpa QR Code após conectar
            console.log('✅ WhatsApp conectado com sucesso!');
            console.log('✅ WhatsApp conectado com sucesso!');
            console.log('🤖 Bot pronto para receber mensagens.\n');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
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

        const remetente = msg.key.remoteJid;
        const telefone = remetente.replace('@s.whatsapp.net', '').replace('@lid', '');
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
            const resposta = await gerarResposta(textoMensagem, telefone);
            await sock.sendMessage(remetente, { text: resposta });
            console.log(`📤 Resposta enviada para ${telefone}`);
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
