require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const videoPath = String.raw`c:\Users\pedro\OneDrive\Área de Trabalho\Agente Kitnets\fotos_e_videos\tour_video.mp4`;

(async () => {
    try {
        console.log('🔄 Atualizando vídeo nas kitnets...');

        // Update all kitnets with the video path
        await pool.query('UPDATE kitnets SET video = $1', [videoPath]);

        console.log('✅ Vídeo atualizado para todas as kitnets:', videoPath);

        const res = await pool.query('SELECT numero, video FROM kitnets LIMIT 1');
        console.log('🔍 Exemplo:', res.rows[0]);

    } catch (e) {
        console.error('❌ Erro:', e);
    } finally {
        await pool.end();
        process.exit();
    }
})();
