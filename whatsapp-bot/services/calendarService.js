const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const KEY_FILE_PATH = path.join(__dirname, '../../google_credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Cache para o cliente autenticado
let calendarClient = null;

async function getCalendarClient() {
    if (calendarClient) return calendarClient;

    // 1. Tentar Environment Variable (Produção no Railway)
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
        try {
            console.log('🔑 Usando credenciais via variável de ambiente (GOOGLE_CREDENTIALS_JSON)...');
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);

            // Fix: Ensure private_key has real newlines instead of string literals "\n"
            // This is a common issue when pasting JSON into Environment Variables
            if (credentials.private_key) {
                credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
            }

            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: SCOPES,
            });

            calendarClient = google.calendar({ version: 'v3', auth });
            console.log('✅ Cliente Google Calendar autenticado via ENV.');
            return calendarClient;
        } catch (error) {
            console.error('❌ Erro ao ler GOOGLE_CREDENTIALS_JSON:', error.message);
        }
    }

    // 2. Tentar Arquivo Local (Desenvolvimento)
    if (!fs.existsSync(KEY_FILE_PATH)) {
        console.error('❌ Arquivo google_credentials.json não encontrado e variável de ambiente vazia.');
        return null; // Retorna null em vez de crashar
    }

    try {
        console.log('📁 Usando credenciais via arquivo local...');
        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_FILE_PATH,
            scopes: SCOPES,
        });

        calendarClient = google.calendar({ version: 'v3', auth });
        console.log('✅ Cliente Google Calendar autenticado via Arquivo.');
        return calendarClient;
    } catch (error) {
        console.error('❌ Erro ao autenticar no Google Calendar via arquivo:', error);
        return null;
    }
}

/**
 * Cria um evento no Google Calendar
 * @param {string} telefone - Telefone do cliente (para colocar no título/descrição)
 * @param {string} dataHorario - Data ISO ou string compatível com Date (ex: '2023-10-27 14:00')
 */
async function createCalendarEvent(telefone, dataHorario) {
    const calendar = await getCalendarClient();
    if (!calendar) return false;

    // Tentar converter para data válida
    const startDate = new Date(dataHorario);
    if (isNaN(startDate.getTime())) {
        console.error('❌ Data inválida para agendamento:', dataHorario);
        return false;
    }

    // Duração fixa de 30 min para visita
    const endDate = new Date(startDate.getTime() + 30 * 60000);

    const event = {
        summary: `Visita Kitnet - ${telefone}`,
        description: `Visita agendada pelo Bot WhatsApp.\nCliente: ${telefone}\n\nVerificar disponibilidade real.`,
        start: {
            dateTime: startDate.toISOString(),
            timeZone: 'America/Sao_Paulo', // Ajuste conforme necessidade
        },
        end: {
            dateTime: endDate.toISOString(),
            timeZone: 'America/Sao_Paulo',
        },
    };

    try {
        const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

        const response = await calendar.events.insert({
            calendarId: calendarId,
            resource: event,
        });

        console.log(`📅 Evento criado no Google Calendar: ${response.data.htmlLink}`);
        return response.data.htmlLink;
    } catch (error) {
        console.error('❌ Erro ao criar evento no Google Calendar:', error);
        return false;
    }
}

/**
 * Verifica se o horário está livre
 * @param {string} dataHorario - Data ISO ou compatível
 * @returns {Promise<boolean>} - true se livre, false se ocupado
 */
async function checkAvailability(dataHorario) {
    const calendar = await getCalendarClient();
    if (!calendar) return true; // Se falhar auth, assume livre para não travar (ou false para bloquear)

    const startDate = new Date(dataHorario);
    if (isNaN(startDate.getTime())) return false;

    // Verificar intervalo de 30 min
    const endDate = new Date(startDate.getTime() + 30 * 60000);

    try {
        const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

        // Listar eventos que colidem
        const response = await calendar.events.list({
            calendarId: calendarId,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items;
        if (events && events.length > 0) {
            console.log(`⚠️ Horário ocupado! Conflito com: ${events[0].summary}`);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        return true; // Fallback: permite agendar se der erro na API
    }
}

/**
 * Testa a conexão com o Google Calendar
 * @returns {Promise<{status: string, message?: string}>}
 */
async function testConnection() {
    const calendar = await getCalendarClient();
    if (!calendar) return { status: 'error', message: 'Falha na autenticação (arquivo JSON ausente ou inválido)' };

    try {
        const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
        await calendar.events.list({
            calendarId: calendarId,
            maxResults: 1,
            singleEvents: true,
        });
        return { status: 'ok' };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

module.exports = { createCalendarEvent, checkAvailability, testConnection };
