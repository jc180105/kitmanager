const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Listar todos os leads
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leads ORDER BY data_contato DESC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar leads' });
    }
});

// Atualizar status (ex: marcar como arquivado, contactado)
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query('UPDATE leads SET status = $1 WHERE id = $2', [status, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar lead' });
    }
});

// Excluir lead
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM leads WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir lead' });
    }
});

module.exports = router;
