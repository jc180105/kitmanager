const { checkAvailability, createCalendarEvent } = require('./whatsapp-bot/services/calendarService');
require('dotenv').config({ path: './whatsapp-bot/.env' });

async function testCalendar() {
    console.log('📅 Iniciando teste do Google Calendar...');

    // 1. Testar verificação de disponibilidade (Leitura)
    console.log('\n🔍 Teste 1: Checar disponibilidade (Leitura)');
    const now = new Date();
    const isFree = await checkAvailability(now.toISOString());
    console.log(`Horário atual (${now.toISOString()}) está livre? ${isFree ? 'SIM' : 'NÃO/ERRO'}`);

    if (isFree !== undefined) {
        console.log('✅ Leitura da agenda funcionando!');
    } else {
        console.error('❌ Falha na leitura.');
    }

    // 2. Opcional: Criar evento de teste? (Melhor não criar lixo na agenda do usuário sem pedir)
    // console.log('\n✏️ Teste 2: Criar evento (Escrita)');
    // const link = await createCalendarEvent('TESTE_BOT', now.toISOString());
    // console.log('Link:', link);
}

testCalendar();
