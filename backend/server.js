require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const pool = require('./config/database');
const initScheduler = require('./services/scheduler');
// WhatsApp Bot agora roda em serviço separado (backend-whatsapp/)

// Routes
const kitnetsRoutes = require('./routes/kitnets');
const historicoRoutes = require('./routes/historico');
const pagamentosRoutes = require('./routes/pagamentos');
const despesasRoutes = require('./routes/despesas');
const documentosRoutes = require('./routes/documentos');
const dashboardRoutes = require('./routes/dashboard');
const backupRoutes = require('./routes/backup');
const configRoutes = require('./routes/config');

// Initialize Database Table (keep simple init here or move to config/db?)
// Keeping it simple for now, utilizing the existing logic structure but cleaned up.
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kitnets (
        id SERIAL PRIMARY KEY,
        numero INTEGER UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'livre',
        valor DECIMAL(10, 2) DEFAULT 0,
        descricao TEXT,
        inquilino_nome VARCHAR(100),
        inquilino_telefone VARCHAR(20),
        inquilino_cpf VARCHAR(14),
        inquilino_rg VARCHAR(20),
        data_entrada DATE,
        dia_vencimento INTEGER,
        pago_mes BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS historico_kitnets (
        id SERIAL PRIMARY KEY,
        kitnet_id INTEGER REFERENCES kitnets(id) ON DELETE SET NULL,
        kitnet_numero INTEGER,
        acao VARCHAR(50) NOT NULL,
        status_anterior VARCHAR(50),
        status_novo VARCHAR(50),
        data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS historico_pagamentos (
        id SERIAL PRIMARY KEY,
        kitnet_id INTEGER REFERENCES kitnets(id) ON DELETE SET NULL,
        valor DECIMAL(10, 2) NOT NULL,
        data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mes_referencia VARCHAR(7),
        forma_pagamento VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS despesas (
        id SERIAL PRIMARY KEY,
        descricao VARCHAR(255) NOT NULL,
        valor DECIMAL(10, 2) NOT NULL,
        categoria VARCHAR(50) DEFAULT 'Outros',
        data_despesa DATE DEFAULT CURRENT_DATE
      );
      
      CREATE TABLE IF NOT EXISTS documentos (
        id SERIAL PRIMARY KEY,
        kitnet_id INTEGER REFERENCES kitnets(id) ON DELETE CASCADE,
        nome_arquivo VARCHAR(255) NOT NULL,
        caminho_arquivo VARCHAR(255) NOT NULL,
        tipo_arquivo VARCHAR(100),
        data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Migration: Ensure forma_pagamento exists (for existing tables)
    await pool.query(`
      ALTER TABLE historico_pagamentos 
      ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(50);
    `);

    console.log('✅ Tabelas verificadas/criadas com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
  }
};

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - Required for Railway/Heroku/etc (behind reverse proxy)
app.set('trust proxy', 1);

const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');

// Middleware
// FIX: Restrict CORS to Frontend URL in production
const allowedOrigins = [
  'http://localhost:5173',
  'https://kitmanager-kw6k.vercel.app',
  'https://kitmanager-production.up.railway.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    console.warn(`⚠️ CORS bloqueou origem: ${origin}`);
    return callback(new Error('Não permitido pelo CORS'), false);
  }
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database tables and scheduler
initDb();
initScheduler();

// Public Routes
app.use('/auth', authRoutes);

// Protected Routes
app.use('/kitnets', authMiddleware, kitnetsRoutes);
app.use('/historico', authMiddleware, historicoRoutes);
app.use('/pagamentos', authMiddleware, pagamentosRoutes);
app.use('/despesas', authMiddleware, despesasRoutes);
app.use('/dashboard', authMiddleware, dashboardRoutes);
app.use('/backup', authMiddleware, backupRoutes);
app.use('/config', authMiddleware, configRoutes);
app.use('/leads', authMiddleware, require('./routes/leads'));
app.use('/', authMiddleware, documentosRoutes); // Mounts at root because it defines mixed paths

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado no servidor!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log('✅ VERSÃO ATUALIZADA: WhatsApp TOTALMENTE REMOVIDO deste serviço.');
});
