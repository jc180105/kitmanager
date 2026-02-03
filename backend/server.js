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
        mes_referencia VARCHAR(7)
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
    console.log('✅ Tabelas verificadas/criadas com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
  }
};

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - Required for Railway/Heroku/etc (behind reverse proxy)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting
// Rate Limiting (Disabled for dev)
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 1000 // limit each IP to 1000 requests per windowMs
// });
// app.use(limiter);

// Database Connection & Init
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erro ao conectar no PostgreSQL:', err.message);
  } else {
    console.log('✅ Conectado ao PostgreSQL');
    release();
    initDb();
  }
});

// Initialize Scheduler (Cron Jobs)
initScheduler();

// Initialize WhatsApp Bot (se OPENAI_API_KEY estiver configurada)
// Initialize WhatsApp Bot (se OPENAI_API_KEY estiver configurada)
// if (process.env.OPENAI_API_KEY) {
//   initWhatsApp().catch(err => {
//     console.error('⚠️ Erro ao iniciar WhatsApp Bot:', err.message);
//   });
// } else {
//   console.log('ℹ️ WhatsApp Bot desativado (OPENAI_API_KEY não configurada)');
// }

// API Routes
app.get('/', (req, res) => {
  res.json({
    message: 'KitManager API',
    version: '1.0.0',
    endpoints: ['/kitnets', '/dashboard', '/historico', '/despesas']
  });
});

app.use('/kitnets', kitnetsRoutes);
app.use('/historico', historicoRoutes);
app.use('/pagamentos', pagamentosRoutes);
app.use('/despesas', despesasRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/backup', backupRoutes);
app.use('/', documentosRoutes); // Mounts at root because it defines mixed paths

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado no servidor!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
