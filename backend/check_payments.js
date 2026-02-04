const pool = require('./config/database');

async function checkPayments() {
    try {
        const result = await pool.query(
            'SELECT id, kitnet_id, valor, mes_referencia, forma_pagamento, data_pagamento FROM historico_pagamentos ORDER BY data_pagamento DESC LIMIT 5'
        );
        console.log('Últimos 5 pagamentos:');
        console.table(result.rows);
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await pool.end();
    }
}

checkPayments();

