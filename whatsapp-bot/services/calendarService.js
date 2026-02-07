const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const KEY_FILE_PATH = path.join(__dirname, '../../google_credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Cache para o cliente autenticado
let calendarClient = null;

async function getCalendarClient() {
    if (calendarClient) return calendarClient;

    if (!fs.existsSync(KEY_FILE_PATH)) {
        console.error('❌ Arquivo google_credentials.json não encontrado na raiz do projeto.');
        return null;
    }

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_FILE_PATH,
            scopes: SCOPES,
        });

        calendarClient = google.calendar({ version: 'v3', auth });
        console.log('✅ Cliente Google Calendar autenticado.');
        return calendarClient;
    } catch (error) {
        console.error('❌ Erro ao autenticar no Google Calendar:', error);
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

module.exports = { createCalendarEvent };
