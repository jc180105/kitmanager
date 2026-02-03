const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { validateId, validateValor, validateStatus } = require('../utils/validators');

// GET /kitnets - Lista todas as kitnets
router.get('/', async (req, res) => {
    try {
        const { status, search } = req.query;

        let query = `
      SELECT id, numero, status, valor, descricao, 
             inquilino_nome, inquilino_telefone, 
             data_entrada, dia_vencimento, pago_mes
      FROM kitnets
    `;
        const params = [];
        const conditions = [];

        if (status && validateStatus(status)) {
            conditions.push(`status = $${params.length + 1}`);
            params.push(status);
        }

        if (search) {
            conditions.push(`(numero::text LIKE $${params.length + 1} OR descricao ILIKE $${params.length + 1})`);
            params.push(`%${search}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY numero ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar kitnets:', error);
        res.status(500).json({ error: 'Erro ao buscar kitnets' });
    }
});

// GET /kitnets/vencimentos - Lista kitnets com vencimento próximo
router.get('/vencimentos', async (req, res) => {
    try {
        const today = new Date();
        const currentDay = today.getDate();

        // Get all rented kitnets with due dates
        const result = await pool.query(`
      SELECT id, numero, status, valor, descricao, 
             inquilino_nome, inquilino_telefone, 
             data_entrada, dia_vencimento, pago_mes
      FROM kitnets
    
      WHERE status = 'alugada' 
        AND dia_vencimento IS NOT NULL
      ORDER BY dia_vencimento ASC
    `);

        // Filter kitnets: Overdue OR Due in next 7 days
        const notifications = result.rows.map(kitnet => {
            const dueDay = kitnet.dia_vencimento;
            let daysUntilDue;

            if (!kitnet.pago_mes && currentDay > dueDay) {
                // Overdue! (Negative days indicates overdue)
                daysUntilDue = dueDay - currentDay;
            } else if (dueDay >= currentDay) {
                // Due later this month
                daysUntilDue = dueDay - currentDay;
            } else {
                const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                daysUntilDue = (daysInMonth - currentDay) + dueDay;
            }

            return { ...kitnet, daysUntilDue };
        }).filter(k => {
            // Include if:
            // 1. Overdue (daysUntilDue < 0) AND Not Paid
            // 2. Due soon (daysUntilDue <= 7)

            if (!k.pago_mes && k.daysUntilDue < 0) return true; // Overdue
            if (k.daysUntilDue >= 0 && k.daysUntilDue <= 7) return true; // Upcoming
            return false;
        }).sort((a, b) => a.daysUntilDue - b.daysUntilDue);

        res.json(notifications);
    } catch (error) {
        console.error('Erro ao buscar vencimentos:', error);
        res.status(500).json({ error: 'Erro ao buscar vencimentos' });
    }
});

// PUT /kitnets/:id/status - Alterna o status
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;

    if (!validateId(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    try {
        const current = await pool.query(
            'SELECT id, status, numero FROM kitnets WHERE id = $1',
            [id]
        );

        if (current.rows.length === 0) {
            return res.status(404).json({ error: 'Kitnet não encontrada' });
        }

        const kitnet = current.rows[0];
        const novoStatus = kitnet.status === 'livre' ? 'alugada' : 'livre';

        let updateQuery, updateParams;
        if (novoStatus === 'livre') {
            updateQuery = `
        UPDATE kitnets 
        SET status = $1, inquilino_nome = NULL, inquilino_telefone = NULL, 
            data_entrada = NULL, dia_vencimento = NULL, inquilino_cpf = NULL, inquilino_rg = NULL
        WHERE id = $2 
        RETURNING *
      `;
            updateParams = [novoStatus, id];
        } else {
            updateQuery = 'UPDATE kitnets SET status = $1 WHERE id = $2 RETURNING *';
            updateParams = [novoStatus, id];
        }

        const result = await pool.query(updateQuery, updateParams);

        await pool.query(
            `INSERT INTO historico_kitnets (kitnet_id, kitnet_numero, acao, status_anterior, status_novo) 
       VALUES ($1, $2, 'status_change', $3, $4)`,
            [id, kitnet.numero, kitnet.status, novoStatus]
        );

        console.log(`🏠 Kitnet ${kitnet.numero}: ${kitnet.status} → ${novoStatus}`);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// PUT /kitnets/:id/detalhes - Atualiza valor e descrição
router.put('/:id/detalhes', async (req, res) => {
    const { id } = req.params;
    const { valor, descricao } = req.body;

    if (!validateId(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    if (valor !== undefined && !validateValor(valor)) {
        return res.status(400).json({ error: 'Valor inválido. Deve ser um número positivo.' });
    }

    try {
        const result = await pool.query(
            'UPDATE kitnets SET valor = $1, descricao = $2 WHERE id = $3 RETURNING *',
            [valor, descricao, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Kitnet não encontrada' });
        }

        console.log(`✏️ Kitnet ${result.rows[0].numero} atualizada: R$ ${valor}`);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar detalhes:', error);
        res.status(500).json({ error: 'Erro ao atualizar detalhes' });
    }
});

// PUT /kitnets/:id/inquilino - Atualiza dados do inquilino
router.put('/:id/inquilino', async (req, res) => {
    const { id } = req.params;
    const { inquilino_nome, inquilino_telefone, inquilino_cpf, inquilino_rg, data_entrada, dia_vencimento } = req.body;

    if (!validateId(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    if (dia_vencimento !== undefined && dia_vencimento !== null) {
        const dia = parseInt(dia_vencimento);
        if (isNaN(dia) || dia < 1 || dia > 31) {
            return res.status(400).json({ error: 'Dia de vencimento deve ser entre 1 e 31.' });
        }
    }

    try {
        const result = await pool.query(
            `UPDATE kitnets 
       SET inquilino_nome = $1, 
           inquilino_telefone = $2, 
           inquilino_cpf = $3,
           inquilino_rg = $4,
           data_entrada = $5, 
           dia_vencimento = $6, 
           status = 'alugada'
       WHERE id = $7 RETURNING *`,
            [inquilino_nome, inquilino_telefone, inquilino_cpf, inquilino_rg, data_entrada, dia_vencimento, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Kitnet não encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar inquilino:', error);
        res.status(500).json({ error: 'Erro ao atualizar dados do inquilino' });
    }
});

// PUT /kitnets/:id/pagamento - Toggle status de pagamento
router.put('/:id/pagamento', async (req, res) => {
    const { id } = req.params;

    if (!validateId(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    try {
        const current = await pool.query('SELECT valor, pago_mes FROM kitnets WHERE id = $1', [id]);

        if (current.rows.length === 0) {
            return res.status(404).json({ error: 'Kitnet não encontrada' });
        }

        const wasPaid = current.rows[0].pago_mes;
        const valor = current.rows[0].valor;

        const result = await pool.query(
            `UPDATE kitnets 
       SET pago_mes = NOT COALESCE(pago_mes, false)
       WHERE id = $1 
       RETURNING *`,
            [id]
        );

        const isNowPaid = result.rows[0].pago_mes;

        if (isNowPaid && !wasPaid) {
            const today = new Date();
            const mesReferencia = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

            const existing = await pool.query(
                'SELECT id FROM historico_pagamentos WHERE kitnet_id = $1 AND mes_referencia = $2',
                [id, mesReferencia]
            );

            if (existing.rows.length === 0) {
                await pool.query(
                    `INSERT INTO historico_pagamentos (kitnet_id, valor, mes_referencia) 
           VALUES ($1, $2, $3)`,
                    [id, valor, mesReferencia]
                );
                console.log(`💰 Pagamento registrado: Kitnet ${result.rows[0].numero}`);
            }
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar pagamento:', error);
        res.status(500).json({ error: 'Erro ao atualizar pagamento' });
    }
});

module.exports = router;
