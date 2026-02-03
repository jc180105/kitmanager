const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /despesas - List expenses (optional month filter YYYY-MM)
router.get('/', async (req, res) => {
    try {
        const { mes } = req.query; // YYYY-MM
        let query = 'SELECT * FROM despesas';
        const params = [];

        if (mes) {
            query += ` WHERE to_char(data_despesa, 'YYYY-MM') = $1`;
            params.push(mes);
        }

        query += ' ORDER BY data_despesa DESC, id DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar despesas:', error);
        res.status(500).json({ error: 'Erro ao buscar despesas.' });
    }
});

// POST /despesas - Add expense
router.post('/', async (req, res) => {
    try {
        const { descricao, valor, categoria, data_despesa } = req.body;

        if (!descricao || !valor) {
            return res.status(400).json({ error: 'Descrição e Valor são obrigatórios.' });
        }

        const result = await pool.query(
            `INSERT INTO despesas (descricao, valor, categoria, data_despesa)
       VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE))
       RETURNING *`,
            [descricao, valor, categoria || 'Outros', data_despesa]
        );

        console.log(`💸 Despesa adicionada: ${descricao} - R$ ${valor}`);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao salvar despesa:', error);
        res.status(500).json({ error: 'Erro ao salvar despesa.' });
    }
});

// DELETE /despesas/:id - Delete expense
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM despesas WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada.' });
        }

        console.log(`🗑️ Despesa removida: ${result.rows[0].descricao}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao excluir despesa:', error);
        res.status(500).json({ error: 'Erro ao excluir despesa.' });
    }
});

// PUT /despesas/:id - Update expense
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { descricao, valor, categoria, data_despesa } = req.body;

    try {
        const result = await pool.query(
            `UPDATE despesas 
       SET descricao = $1, valor = $2, categoria = $3, data_despesa = $4
       WHERE id = $5
       RETURNING *`,
            [descricao, valor, categoria, data_despesa, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada.' });
        }

        console.log(`✏️ Despesa atualizada: ${descricao}`);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar despesa:', error);
        res.status(500).json({ error: 'Erro ao atualizar despesa.' });
    }
});

module.exports = router;
