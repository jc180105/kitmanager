const cron = require('node-cron');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../backups');

// Function to initialize scheduled jobs
const initScheduler = () => {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Run monthly reset on the 1st day of every month at 00:00
    cron.schedule('0 0 1 * *', async () => {
        try {
            console.log('📅 Executando reset mensal de pagamentos...');
            await pool.query('UPDATE kitnets SET pago_mes = false');

            // Log action
            await pool.query(
                `INSERT INTO historico_kitnets (acao, status_novo) 
         VALUES ('reset_mensal', 'todos_pendentes')`
            );

            console.log('✅ Todos os pagamentos foram resetados para PENDENTE.');
        } catch (error) {
            console.error('❌ Erro no reset mensal:', error);
        }
    });

    // Run backup every day at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `kitnets_auto_${timestamp}.json`;
            const filepath = path.join(BACKUP_DIR, filename);

            const kitnets = await pool.query('SELECT * FROM kitnets ORDER BY numero');
            const historico = await pool.query('SELECT * FROM historico_kitnets ORDER BY data_alteracao DESC LIMIT 1000');
            const pagamentos = await pool.query('SELECT * FROM historico_pagamentos ORDER BY data_pagamento DESC LIMIT 1000');

            const backup = {
                exportDate: new Date().toISOString(),
                version: '1.1',
                data: {
                    kitnets: kitnets.rows,
                    historico: historico.rows,
                    pagamentos: pagamentos.rows,
                }
            };

            fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
            console.log(`📦 Backup automático salvo: ${filename}`);

            // Keep only last 7 backups
            const files = fs.readdirSync(BACKUP_DIR)
                .filter(f => f.startsWith('kitnets_auto_'))
                .sort()
                .reverse();

            if (files.length > 7) {
                for (const file of files.slice(7)) {
                    fs.unlinkSync(path.join(BACKUP_DIR, file));
                    console.log(`🗑️ Backup antigo removido: ${file}`);
                }
            }
        } catch (error) {
            console.error('❌ Erro no backup automático:', error);
        }
    });

    console.log('⏰ Backup automático agendado para 02:00 diariamente');
};

module.exports = initScheduler;
