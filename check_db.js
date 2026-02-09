const pool = require('./whatsapp-bot/config/database');
async function check() {
    try {
        const res = await pool.query('SELECT * FROM rules');
        console.log('RULES:', JSON.stringify(res.rows, null, 2));
        const res2 = await pool.query('SELECT * FROM kitnets');
        console.log('KITNETS:', JSON.stringify(res2.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
