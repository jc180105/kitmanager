const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { validateId } = require('../utils/validators');

// GET /historico - Lista histórico de alterações
router.get('/', async (req, res) => {
    try {
        const { kitnet_id, limit = 50 } = req.query;

        let query = `
      SELECT id, kitnet_id, kitnet_numero, acao, status_anterior, status_novo, data_alteracao
      FROM historico_kitnets
    `;
        const params = [];

        if (kitnet_id && validateId(kitnet_id)) {
            query += ' WHERE kitnet_id = $1';
            params.push(kitnet_id);
        }

        query += ' ORDER BY data_alteracao DESC LIMIT $' + (params.length + 1);
        params.push(parseInt(limit) || 50);

        const result = await pool.query(query, params);
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
