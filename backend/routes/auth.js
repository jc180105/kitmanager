const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Rate limit: max 5 login attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// POST /auth/login
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { password } = req.body;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            console.error('❌ ADMIN_PASSWORD não configurada nas variáveis de ambiente!');
            return res.status(500).json({ error: 'Erro de configuração do servidor.' });
        }

        // Simple password check
        if (password !== adminPassword) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        // Generate Long-Lived Token (1 Year)
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('❌ JWT_SECRET não configurado nas variáveis de ambiente!');
            return res.status(500).json({ error: 'Erro de configuração do servidor.' });
        }

        const token = jwt.sign(
            { role: 'admin', user: 'admin' },
            secret,
            { expiresIn: '30d' } // 30 days validity
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
        const secret = process.env.JWT_SECRET;
        if (!secret) return res.status(500).json({ valid: false });
        jwt.verify(token, secret);
        res.json({ valid: true });
    } catch (e) {
        res.status(401).json({ valid: false });
    }
});

module.exports = router;
