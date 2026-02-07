const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'; // Fallback for dev

        // Simple password check
        if (password !== adminPassword) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        // Generate Long-Lived Token (1 Year)
        // This satisfies the "Login Once" requirement
        const secret = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';

        const token = jwt.sign(
            { role: 'admin', user: 'admin' },
            secret,
            { expiresIn: '365d' } // 1 Year validity
        );

        console.log('🔑 Login de administrador realizado com sucesso via App/Web');

        res.json({
            success: true,
            token,
            user: { name: 'Administrador', role: 'admin' }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// GET /auth/validate - verify if token is still valid
router.get('/validate', (req, res) => {
    // If it reaches here, middleware would have passed if used, 
    // but better to just verify manually or use middleware in server.js
    // For now, simple check:
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ valid: false });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ valid: false });

    try {
        const secret = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';
        jwt.verify(token, secret);
        res.json({ valid: true });
    } catch (e) {
        res.status(401).json({ valid: false });
    }
});

module.exports = router;
