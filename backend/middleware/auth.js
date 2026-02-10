// Middleware de Autenticação JWT
const jwt = require('jsonwebtoken');

const authorize = (req, res, next) => {
    // 1. Check for Authorization header
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    // 2. Extract token (Bearer <token>)
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acesso negado. Formato de token inválido.' });
    }

    try {
        // 3. Verify token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('❌ JWT_SECRET não configurado!');
            return res.status(500).json({ error: 'Erro de configuração do servidor.' });
        }

        const decoded = jwt.verify(token, secret);
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        console.error('Erro de autenticação:', error.message);
        return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
};

module.exports = authorize;
