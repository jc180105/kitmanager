const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../backups');

// Ensure backup directory exists
// Assuming the server runs from backend root, but here we are in routes/. 
// Using __dirname + ../backups should work relative to routes file.
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// GET /backup - Download database backup
router.get('/', async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `kitnets_backup_${timestamp}.json`;

        // Export all data as JSON
        const kitnets = await pool.query('SELECT * FROM kitnets ORDER BY numero');
        const historico = await pool.query('SELECT * FROM historico_kitnets ORDER BY data_alteracao DESC LIMIT 1000');
        // Included payments as per backup logic in server.js
        const pagamentos = await pool.query('SELECT * FROM historico_pagamentos ORDER BY data_pagamento DESC LIMIT 1000');

        const backup = {
            exportDate: new Date().toISOString(),
            version: '1.0', // Updated to match server logic? server had 1.0 manual, 1.1 auto
            data: {
                kitnets: kitnets.rows,
                historico: historico.rows,
                pagamentos: pagamentos.rows
            },
            stats: {
                totalKitnets: kitnets.rows.length,
                totalHistorico: historico.rows.length,
                livres: kitnets.rows.filter(k => k.status === 'livre').length,
                alugadas: kitnets.rows.filter(k => k.status === 'alugada').length,
            }
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(backup);

        console.log(`📦 Backup manual gerado: ${filename}`);
    } catch (error) {
        console.error('Erro ao gerar backup:', error);
        res.status(500).json({ error: 'Erro ao gerar backup' });
    }
});

// POST /backup/restore - Restore from backup
router.post('/restore', async (req, res) => {
    try {
        const { kitnets, clearExisting } = req.body;

        if (!kitnets || !Array.isArray(kitnets)) {
            return res.status(400).json({ error: 'Dados de backup inválidos' });
        }

        if (clearExisting) {
            await pool.query('DELETE FROM historico_kitnets');
            await pool.query('DELETE FROM kitnets');
            // Maybe payment history too? 
            // Server.js logic only cleared kitnets and history related to kitnet status changes.
            // Let's stick to server.js logic, but if restore is full restore, maybe payments should be cleared?
            // Keeping original behavior.
        }

        let imported = 0;
        for (const kitnet of kitnets) {
            await pool.query(`
        INSERT INTO kitnets (numero, status, valor, descricao, inquilino_nome, inquilino_telefone, data_entrada, dia_vencimento)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (numero) DO UPDATE SET
          status = $2, valor = $3, descricao = $4, inquilino_nome = $5, 
          inquilino_telefone = $6, data_entrada = $7, dia_vencimento = $8
      `, [
                kitnet.numero, kitnet.status, kitnet.valor, kitnet.descricao,
                kitnet.inquilino_nome, kitnet.inquilino_telefone, kitnet.data_entrada, kitnet.dia_vencimento
            ]);
            imported++;
        }

        console.log(`📥 Backup restaurado: ${imported} kitnets`);
        res.json({ success: true, imported });
    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        res.status(500).json({ error: 'Erro ao restaurar backup' });
    }
});

module.exports = router;
