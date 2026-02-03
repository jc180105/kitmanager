const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { validateId } = require('../utils/validators');

// Configuração do Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /upload - Upload de documento
// Nota: Rota original era /upload (singular). Mudei o router para ser montado onde quiser, mas a rota interna é /.
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { kitnet_id, tipo } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        if (!validateId(kitnet_id)) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ error: 'ID da kitnet inválido.' });
        }

        const result = await pool.query(
            `INSERT INTO documentos (kitnet_id, nome_arquivo, caminho_arquivo, tipo_arquivo)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [kitnet_id, file.originalname, file.path, tipo || file.mimetype]
        );

        console.log(`📎 Documento salvo: ${file.originalname} para Kitnet ${kitnet_id}`);
        res.json(result.rows[0]);

    } catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({ error: 'Erro ao salvar documento.' });
    }
});

// GET /kitnets/:id/documentos - Lista documentos
// IMPORTANTE: Esta rota começa com /kitnets, mas está relacionada a documentos.
// Se eu montar este router em /api/documentos, a URL mudaria.
// Para manter compatibilidade, vou definir a rota como /kitnets/:id/documentos aqui
// e no server.js usar app.use('/', documentosRoutes).
router.get('/kitnets/:id/documentos', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM documentos WHERE kitnet_id = $1 ORDER BY data_upload DESC',
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar documentos:', error);
        res.status(500).json({ error: 'Erro ao buscar documentos.' });
    }
});

// DELETE /documentos/:id - Remove documento
router.delete('/documentos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const docQuery = await pool.query('SELECT caminho_arquivo FROM documentos WHERE id = $1', [id]);

        if (docQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Documento não encontrado.' });
        }

        const filePath = docQuery.rows[0].caminho_arquivo;

        await pool.query('DELETE FROM documentos WHERE id = $1', [id]);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar documento:', error);
        res.status(500).json({ error: 'Erro ao deletar documento.' });
    }
});

module.exports = router;
