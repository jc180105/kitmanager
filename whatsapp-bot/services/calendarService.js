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
    let envJson = process.env.GOOGLE_CREDENTIALS_JSON;
    if (envJson) {
        try {
            console.log('🔑 Usando credenciais via variável de ambiente (GOOGLE_CREDENTIALS_JSON)...');

            envJson = envJson.trim();
            // Remover aspas extras que o usuário pode ter colado sem querer
            if (envJson.startsWith('"') && envJson.endsWith('"')) {
                envJson = envJson.slice(1, -1);
            }

            const credentials = JSON.parse(envJson);

            if (credentials.private_key) {
                // Limpeza agressiva da chave privada
                let key = credentials.private_key;

                // 1. Converter literais "\n" (texto) em quebras de linha reais
                key = key.replace(/\\n/g, '\n');

                // 2. Remover espaços em branco acidentais no início de cada linha (comum em copy-paste)
                key = key.split('\n').map(line => line.trim()).join('\n');

                // 3. Garantir que começa e termina exatamente onde deve
                if (!key.includes('BEGIN PRIVATE KEY')) {
                    key = `-----BEGIN PRIVATE KEY-----\n${key}`;
                }
                if (!key.includes('END PRIVATE KEY')) {
                    key = `${key}\n-----END PRIVATE KEY-----`;
                }

                credentials.private_key = key.trim();

                console.log('✅ Chave privada limpa e formatada.');
            }

            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: SCOPES,
            });

            calendarClient = google.calendar({ version: 'v3', auth });
            console.log('✅ Cliente Google Calendar inicializado.');
            return calendarClient;
        } catch (error) {
            console.error('❌ Erro crítico ao processar GOOGLE_CREDENTIALS_JSON:', error.message);
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
    try {
        const client = await getCalendarClient();
        if (!client) return { status: 'error', message: 'Cliente não inicializado (falta .json ou ENV)' };

        const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

        // Testar listando eventos
        const response = await client.events.list({
            calendarId: calendarId,
            timeMin: new Date().toISOString(),
            maxResults: 1,
        });

        return {
            status: 'ok',
            calendarId: calendarId,
            timezone: response.data.timeZone
        };
    } catch (error) {
        console.error('❌ Erro no teste de conexão do Calendário:', error);

        let message = error.message;
        if (message.includes('DECODER routines::unsupported')) {
            message = 'ERRO DE FORMATO NA CHAVE PRIVADA. Verifique se copiou o JSON completo e sem aspas extras no Railway.';
        } else if (message.includes('invalid_grant')) {
            message = 'ERRO DE AUTENTICAÇÃO. A conta de serviço pode estar desativada ou a chave expirou.';
        } else if (message.includes('not found')) {
            message = 'CALENDÁRIO NÃO ENCONTRADO. Verifique o GOOGLE_CALENDAR_ID.';
        }

        return { status: 'error', message: message, technical: error.code || error.message };
    }
}

/**
 * Lista todos os horários livres para um determinado dia
 * @param {string} dateStr - Data no formato YYYY-MM-DD
 * @returns {Promise<string[]>} - Lista de horários livres (ex: ['10:00', '11:00'])
 */
async function getFreeSlotsForDay(dateStr) {
    const calendar = await getCalendarClient();
    if (!calendar) return [];

    try {
        const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

        // Definir início e fim do dia comercial (10h as 17h)
        const startOfDay = new Date(`${dateStr}T10:00:00-03:00`);
        const endOfDay = new Date(`${dateStr}T17:00:00-03:00`);

        if (isNaN(startOfDay.getTime())) return [];

        // Buscar todos os eventos do dia
        const response = await calendar.events.list({
            calendarId: calendarId,
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items || [];

        // Horários que queremos oferecer (padrão do usuário no print)
        const checkSlots = ['10:00', '11:00', '14:00', '15:00', '16:00'];
        const freeSlots = [];

        for (const slot of checkSlots) {
            const slotStart = new Date(`${dateStr}T${slot}:00-03:00`);
            const slotEnd = new Date(slotStart.getTime() + 30 * 60000);

            // Verificar se algum evento colide com este slot
            const isBusy = events.some(event => {
                const eventStart = new Date(event.start.dateTime || event.start.date);
                const eventEnd = new Date(event.end.dateTime || event.end.date);

                // Sobreposição: (StartA < EndB) e (EndA > StartB)
                return (slotStart < eventEnd && slotEnd > eventStart);
            });

            if (!isBusy) {
                freeSlots.push(slot);
            }
        }

        return freeSlots;
    } catch (error) {
        console.error('Erro ao buscar slots livres:', error);
        return [];
    }
}

module.exports = { createCalendarEvent, checkAvailability, getFreeSlotsForDay, testConnection };
