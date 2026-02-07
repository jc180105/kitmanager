const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./config/database');

async function testQuery() {
    try {
        const res = await pool.query('SELECT id, kitnet_id FROM historico_pagamentos ORDER BY id DESC LIMIT 1');
        if (res.rows.length > 0) {
            const id = res.rows[0].id;
            console.log(`Testing with ID: ${id}`);

            const details = await pool.query(`
                SELECT p.id, k.numero 
                FROM historico_pagamentos p
                JOIN kitnets k ON p.kitnet_id = k.id
                WHERE p.id = $1
            `, [id]);

            console.log('Details found:', details.rows.length > 0 ? details.rows[0] : 'None');

            if (details.rows.length === 0) {
                console.log('Trying LEFT JOIN...');
                const leftJoin = await pool.query(`
                    SELECT p.id, p.kitnet_id
                    FROM historico_pagamentos p
                    LEFT JOIN kitnets k ON p.kitnet_id = k.id
                    WHERE p.id = $1
                `, [id]);
                console.log('Left Join Result:', leftJoin.rows[0]);
            }

        } else {
            console.log('No payments found in DB');
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

testQuery();
