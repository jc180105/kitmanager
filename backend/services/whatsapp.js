const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, downloadMediaMessage } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
const { gerarResposta } = require('./aiAgent');

let sock = null;

// Inicializar OpenAI para transcrição
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Transcreve áudio usando OpenAI Whisper
 */
async function transcreverAudio(audioBuffer) {
    try {
        // Salvar temporariamente o áudio
        const tempPath = path.join(__dirname, '..', 'temp_audio.ogg');
        fs.writeFileSync(tempPath, audioBuffer);

        // Transcrever com Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempPath),
            model: 'whisper-1',
            language: 'pt'
        });

        // Remover arquivo temporário
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
    const authDir = path.join(__dirname, '..', 'auth_info');

    // Carregar estado de autenticação
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    // Criar socket
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['KitManager Bot', 'Chrome', '1.0.0']
    });

    // Handler de atualização de conexão
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n📱 Escaneie o QR Code abaixo com seu WhatsApp:\n');
            qrcode.generate(qr, { small: true });
            console.log('\n⏳ Aguardando conexão...\n');
        }

        if (connection === 'open') {
            console.log('✅ WhatsApp conectado com sucesso!');
            console.log('🤖 Bot pronto para receber mensagens (texto e áudio).\n');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                console.log('⚠️ Conexão perdida. Reconectando...');
                await initWhatsApp();
            } else {
                console.log('❌ Desconectado do WhatsApp. Escaneie o QR Code novamente.');
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Handler de mensagens recebidas
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];

        if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') {
            return;
        }

        const remetente = msg.key.remoteJid;
        const telefone = remetente.replace('@s.whatsapp.net', '').replace('@lid', '');

        let textoMensagem = '';

        // Verificar se é mensagem de áudio/voz
        const audioMessage = msg.message.audioMessage;
        if (audioMessage) {
            console.log(`🎤 Áudio recebido de ${telefone}`);

            try {
                // Indicar que está processando
                await sock.sendPresenceUpdate('composing', remetente);

                // Baixar áudio
                const audioBuffer = await downloadMediaMessage(msg, 'buffer', {});

                // Transcrever
                const textoTranscrito = await transcreverAudio(audioBuffer);

                if (textoTranscrito) {
                    textoMensagem = textoTranscrito;
                } else {
                    await sock.sendMessage(remetente, {
                        text: 'Desculpe, não consegui entender o áudio. Pode enviar uma mensagem de texto? 😊'
                    });
                    return;
                }
            } catch (error) {
                console.error('Erro ao processar áudio:', error);
                await sock.sendMessage(remetente, {
                    text: 'Desculpe, tive um problema ao processar o áudio. Pode tentar novamente ou enviar texto?'
                });
                return;
            }
        } else {
            // Mensagem de texto normal
            textoMensagem =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                msg.message.imageMessage?.caption ||
                '';
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
            await sock.sendMessage(remetente, {
                text: 'Desculpe, ocorreu um erro. Por favor, tente novamente em alguns instantes.'
            });
        }
    });

    return sock;
}

/**
 * Envia mensagem para um número específico
 */
async function enviarMensagem(numero, texto) {
    if (!sock) {
        throw new Error('WhatsApp não está conectado');
    }

    const jid = numero.includes('@') ? numero : `${numero}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: texto });
}

/**
 * Verifica se está conectado
 */
function isConnected() {
    return sock?.user ? true : false;
}

module.exports = {
    initWhatsApp,
    enviarMensagem,
    isConnected
};
