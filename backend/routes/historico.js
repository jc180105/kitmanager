const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { validateId } = require('../utils/validators');

// GET /historico - Lista histórico de alterações
// GET /historico - Lista histórico de alterações e pagamentos unificados
router.get('/', async (req, res) => {
    try {
        const { kitnet_id, limit = 50 } = req.query;
        const params = [];
        let paramCount = 1;

        let query = `
            SELECT 
                id, 
                kitnet_id, 
                acao as titulo, 
                status_anterior as detalhe_1, 
                status_novo as detalhe_2, 
                data_alteracao as data, 
                'alteracao' as tipo
            FROM historico_kitnets
        `;

        let queryPagamentos = `
            SELECT 
                id, 
                kitnet_id, 
                'Pagamento Recebido' as titulo, 
                mes_referencia as detalhe_1, 
                CAST(valor AS VARCHAR) as detalhe_2, 
                data_pagamento as data, 
                'pagamento' as tipo
            FROM historico_pagamentos
        `;

        if (kitnet_id && validateId(kitnet_id)) {
            query += ` WHERE kitnet_id = $${paramCount}`;
            queryPagamentos += ` WHERE kitnet_id = $${paramCount}`;
            params.push(kitnet_id);
            paramCount++;
        }

        // UNION ALL para combinar os dois resultados
        const finalQuery = `
            SELECT * FROM (${query} UNION ALL ${queryPagamentos}) as combinado
            ORDER BY data DESC
            LIMIT $${paramCount}
        `;

        params.push(parseInt(limit) || 50);

        const result = await pool.query(finalQuery, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
});

// GET /pagamentos/:id - Lista histórico de pagamentos de uma kitnet
// Nota: A rota original era no root /pagamentos/:id, mas aqui estará sob /historico/pagamentos/:id se montarmos em /historico
// OU podemos montar este router em / e definir os caminhos completos.
// Vamos montar rotas específicas no server.js. 
// Para manter organizado, vou exportar um router para /historico e outro para /pagamentos?
// Melhor: Manter este arquivo para rotas relacionadas a histórico. 
// No server.js: app.use('/historico', historicoRoutes);
// A rota de pagamentos era /pagamentos/:id. Vou mover para routes/pagamentos.js para ficar mais limpo.
// Então este arquivo fica só com /historico.

module.exports = router;
