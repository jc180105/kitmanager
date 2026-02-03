const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        // 1. Estatísticas de Ocupação e Receita Potencial
        const statsQuery = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'alugada' THEN 1 ELSE 0 END) as alugadas,
        SUM(CASE WHEN status = 'livre' THEN 1 ELSE 0 END) as livres,
        SUM(CASE WHEN status = 'alugada' THEN valor ELSE 0 END) as receita_potencial
      FROM kitnets
    `);

        const stats = statsQuery.rows[0];

        // 2. Receita Realizada (Mês Atual)
        const today = new Date();
        const mesAtual = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        const receitaQuery = await pool.query(`
      SELECT SUM(valor) as receita_realizada
      FROM historico_pagamentos
      WHERE mes_referencia = $1
    `, [mesAtual]);

        const receitaRealizada = parseFloat(receitaQuery.rows[0].receita_realizada || 0);
        const receitaPotencial = parseFloat(stats.receita_potencial || 0);

        // 3. Histórico últimos 6 meses (Gráfico)
        const graficoQuery = await pool.query(`
      SELECT mes_referencia, SUM(valor) as total
      FROM historico_pagamentos
      GROUP BY mes_referencia
      ORDER BY mes_referencia DESC
      LIMIT 6
    `);

        // 4. Despesas do Mês
        const despesasQuery = await pool.query(`
      SELECT SUM(valor) as total_despesas
      FROM despesas
      WHERE to_char(data_despesa, 'YYYY-MM') = $1
    `, [mesAtual]);

        const despesasMes = parseFloat(despesasQuery.rows[0].total_despesas || 0);
        const lucroLiquido = receitaRealizada - despesasMes;

        res.json({
            ocupacao: {
                total: parseInt(stats.total),
                alugadas: parseInt(stats.alugadas),
                livres: parseInt(stats.livres),
                taxa: stats.total > 0 ? Math.round((stats.alugadas / stats.total) * 100) : 0
            },
            financeiro: {
                potencial: receitaPotencial,
                realizado: receitaRealizada,
                pendente: Math.max(0, receitaPotencial - receitaRealizada),
                despesas: despesasMes,
                lucro: lucroLiquido
            },
            grafico: graficoQuery.rows.reverse()
        });
    } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
    }
});

// GET /dashboard/relatorio - Detailed financial report
router.get('/relatorio', async (req, res) => {
    try {
        const { periodo } = req.query; // Format: YYYY-MM
        const today = new Date();
        const mesAtual = periodo || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        // Calculate previous month
        const [year, month] = mesAtual.split('-').map(Number);
        const prevDate = new Date(year, month - 2, 1);
        const mesAnterior = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

        // 1. Receita do período
        const receitaQuery = await pool.query(`
      SELECT SUM(valor) as total
      FROM historico_pagamentos
      WHERE mes_referencia = $1
    `, [mesAtual]);
        const receitaAtual = parseFloat(receitaQuery.rows[0].total || 0);

        // 2. Receita do período anterior (para comparação)
        const receitaAnteriorQuery = await pool.query(`
      SELECT SUM(valor) as total
      FROM historico_pagamentos
      WHERE mes_referencia = $1
    `, [mesAnterior]);
        const receitaAnterior = parseFloat(receitaAnteriorQuery.rows[0].total || 0);

        // 3. Despesas por categoria
        const despesasQuery = await pool.query(`
      SELECT categoria, SUM(valor) as total, COUNT(*) as quantidade
      FROM despesas
      WHERE to_char(data_despesa, 'YYYY-MM') = $1
      GROUP BY categoria
      ORDER BY total DESC
    `, [mesAtual]);

        const despesasTotalAtual = despesasQuery.rows.reduce((sum, d) => sum + parseFloat(d.total), 0);

        // 4. Despesas do período anterior
        const despesasAnteriorQuery = await pool.query(`
      SELECT SUM(valor) as total
      FROM despesas
      WHERE to_char(data_despesa, 'YYYY-MM') = $1
    `, [mesAnterior]);
        const despesasAnterior = parseFloat(despesasAnteriorQuery.rows[0].total || 0);

        // 5. Lista de pagamentos recebidos
        const pagamentosQuery = await pool.query(`
      SELECT hp.*, k.numero, k.inquilino_nome
      FROM historico_pagamentos hp
      LEFT JOIN kitnets k ON hp.kitnet_id = k.id
      WHERE hp.mes_referencia = $1
      ORDER BY hp.data_pagamento DESC
    `, [mesAtual]);

        // 6. Cálculos
        const lucroAtual = receitaAtual - despesasTotalAtual;
        const lucroAnterior = receitaAnterior - despesasAnterior;
        const variacaoReceita = receitaAnterior > 0 ? ((receitaAtual - receitaAnterior) / receitaAnterior) * 100 : 0;
        const variacaoDespesas = despesasAnterior > 0 ? ((despesasTotalAtual - despesasAnterior) / despesasAnterior) * 100 : 0;
        const variacaoLucro = lucroAnterior !== 0 ? ((lucroAtual - lucroAnterior) / Math.abs(lucroAnterior)) * 100 : 0;

        res.json({
            periodo: mesAtual,
            periodoAnterior: mesAnterior,
            receita: {
                atual: receitaAtual,
                anterior: receitaAnterior,
                variacao: Math.round(variacaoReceita * 10) / 10
            },
            despesas: {
                total: despesasTotalAtual,
                anterior: despesasAnterior,
                variacao: Math.round(variacaoDespesas * 10) / 10,
                porCategoria: despesasQuery.rows.map(d => ({
                    categoria: d.categoria,
                    total: parseFloat(d.total),
                    quantidade: parseInt(d.quantidade)
                }))
            },
            lucro: {
                atual: lucroAtual,
                anterior: lucroAnterior,
                variacao: Math.round(variacaoLucro * 10) / 10,
                margem: receitaAtual > 0 ? Math.round((lucroAtual / receitaAtual) * 100) : 0
            },
            pagamentos: pagamentosQuery.rows
        });
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório financeiro' });
    }
});

module.exports = router;
