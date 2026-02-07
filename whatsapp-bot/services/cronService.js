const cron = require('node-cron');
const pool = require('../config/database');
const { enviarMensagem, isConnected } = require('./whatsapp');

function initCron() {
    console.log('⏰ Iniciando serviço de cron jobs...');

    // Follow-up de Leads: Todos os dias às 10:00 da manhã e 18:00
    // Agenda: "0 10,18 * * *"
    cron.schedule('0 10,18 * * *', async () => {
        console.log('🔍 Verificando leads para follow-up...');
        if (!isConnected()) {
            console.log('❌ WhatsApp desconectado. Pulando follow-up.');
            return;
        }

        try {
            // Buscar leads criados ha mais de 24h e ainda com status 'novo'
            // Intervalo de segurança: entre 24h e 72h atraś
            // Limite de 3 para evitar bloqueios massivos
            const result = await pool.query(`
                SELECT * FROM leads 
                WHERE status = 'novo' 
                AND data_contato < NOW() - INTERVAL '24 HOURS'
                AND data_contato > NOW() - INTERVAL '72 HOURS'
                LIMIT 3
            `);

            const leads = result.rows;
            console.log(`📋 Encontrados ${leads.length} leads para follow-up.`);

            for (const lead of leads) {
                const nome = lead.nome && lead.nome !== 'Desconhecido' ? lead.nome : 'tudo bem?';
                const saudacao = lead.nome && lead.nome !== 'Desconhecido' ? `Olá ${lead.nome}, tudo bem?` : `Olá, tudo bem?`;

                const mensagem = `${saudacao} 😊\n\nVi que você se interessou pelas kitnets recentemente. Ainda está procurando aluguel?\n\nSe quiser visitar ou ver mais fotos, é só me chamar! 🏠`;

                console.log(`📤 Enviando follow-up para ${lead.telefone}`);

                try {
                    await enviarMensagem(lead.telefone, mensagem);

                    // Atualizar status para não enviar novamente
                    await pool.query(`UPDATE leads SET status = 'followup_enviado' WHERE id = $1`, [lead.id]);
                } catch (sendError) {
                    console.error(`Erro ao enviar para ${lead.telefone}:`, sendError);
                }

                // Esperar aleatório entre 15s e 40s para parecer humano
                const delay = Math.floor(Math.random() * 25000) + 15000;
                await new Promise(r => setTimeout(r, delay));
            }

        } catch (error) {
            console.error('❌ Erro no job de follow-up:', error);
        }
    });

    console.log('✅ Cron jobs agendados: Follow-up (10h, 18h).');
}

module.exports = { initCron };
