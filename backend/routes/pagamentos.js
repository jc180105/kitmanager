const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { validateId } = require('../utils/validators');

// GET /pagamentos/:id - Lista histórico de pagamentos de uma kitnet
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!validateId(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const result = await pool.query(
            `SELECT id, kitnet_id, valor, mes_referencia, data_pagamento, forma_pagamento
       FROM historico_pagamentos 
       WHERE kitnet_id = $1 
       ORDER BY data_pagamento DESC`,
            [id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar histórico de pagamentos:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico de pagamentos' });
    }
});

// GET /pagamentos/detalhes/:id - Busca detalhes de um pagamento específico para recibo
router.get('/detalhes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 Buscando detalhes do pagamento: ${id}`);

        if (!validateId(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const result = await pool.query(
            `SELECT 
                p.id, 
                p.valor, 
                p.mes_referencia, 
                p.data_pagamento, 
                p.forma_pagamento,
                k.numero as kitnet_numero,
                k.inquilino_nome,
                k.inquilino_cpf
             FROM historico_pagamentos p
             LEFT JOIN kitnets k ON p.kitnet_id = k.id
             WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pagamento não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar detalhes do pagamento:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes do pagamento' });
    }
});

// DELETE /pagamentos/:id - Remove um registro de histórico de pagamento
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!validateId(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    try {
        const result = await pool.query('DELETE FROM historico_pagamentos WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pagamento não encontrado' });
        }

        console.log(`🗑️ Pagamento removido do histórico: ID ${id}`);
        res.json({ success: true, deleted: result.rows[0] });
    } catch (error) {
        console.error('Erro ao excluir pagamento:', error);
        res.status(500).json({ error: 'Erro ao excluir pagamento' });
    }
});

module.exports = router;
