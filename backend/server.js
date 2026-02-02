require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const app = express();
const PORT = process.env.PORT || 3001;

// ===================
// MIDDLEWARE
// ===================
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Rate Limiting - 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use(limiter);

// ===================
// DATABASE
// ===================
// Support both DATABASE_URL (Railway/production) and individual vars (local)
const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  : new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5433,
    user: process.env.DB_USER || 'usuario',
    password: process.env.DB_PASSWORD || 'senha_segura',
    database: process.env.DB_NAME || 'imobiliaria'
  });

// Initialize Database
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kitnets (
        id SERIAL PRIMARY KEY,
        numero INTEGER UNIQUE NOT NULL,
        valor NUMERIC(10, 2) NOT NULL,
        descricao TEXT,
        status VARCHAR(20) DEFAULT 'livre',
        inquilino_nome VARCHAR(100),
        inquilino_telefone VARCHAR(20),
        inquilino_cpf VARCHAR(20),
        inquilino_rg VARCHAR(20),
        data_entrada DATE,
        dia_vencimento INTEGER,
        pago_mes BOOLEAN DEFAULT FALSE
      );
      
      CREATE TABLE IF NOT EXISTS historico_kitnets (
        id SERIAL PRIMARY KEY,
        kitnet_id INTEGER,
        kitnet_numero INTEGER,
        acao VARCHAR(50),
        status_anterior VARCHAR(20),
        status_novo VARCHAR(20),
        data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS historico_pagamentos (
        id SERIAL PRIMARY KEY,
        kitnet_id INTEGER REFERENCES kitnets(id),
        valor NUMERIC(10, 2) NOT NULL,
        data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mes_referencia VARCHAR(7) -- Format: YYYY-MM
      );

      CREATE TABLE IF NOT EXISTS documentos (
        id SERIAL PRIMARY KEY,
        kitnet_id INTEGER REFERENCES kitnets(id),
        nome_arquivo VARCHAR(255) NOT NULL,
        caminho_arquivo VARCHAR(255) NOT NULL,
        tipo_arquivo VARCHAR(50),
        data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS despesas (
        id SERIAL PRIMARY KEY,
        descricao VARCHAR(255) NOT NULL,
        valor NUMERIC(10, 2) NOT NULL,
        data_despesa DATE DEFAULT CURRENT_DATE,
        categoria VARCHAR(50) DEFAULT 'Manutenção'
      );

      -- Update schema for existing tables
      ALTER TABLE kitnets 
      ADD COLUMN IF NOT EXISTS inquilino_cpf VARCHAR(20),
      ADD COLUMN IF NOT EXISTS inquilino_rg VARCHAR(20);
    `);
    console.log('✅ Banco de dados conectado e tabelas verificadas');

    // Insert default kitnets if table is empty
    const count = await pool.query('SELECT COUNT(*) FROM kitnets');
    if (parseInt(count.rows[0].count) === 0) {
      console.log('📦 Criando kitnets padrão...');
      for (let i = 1; i <= 20; i++) {
        await pool.query(
          'INSERT INTO kitnets (numero, status, valor) VALUES ($1, $2, $3)',
          [i, 'livre', 500.00]
        );
      }
      console.log('✅ 20 kitnets criadas com sucesso!');
    }

  } catch (err) {
    console.error('❌ Erro ao conectar ao banco:', err);
  }
};

// Test connection and initialize
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erro ao conectar no PostgreSQL:', err.message);
  } else {
    console.log('✅ Conectado ao PostgreSQL');
    release();
    initDb();
  }
});

// ===================
// HEALTH CHECK
// ===================
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'KitManager API',
    version: '1.0.0',
    endpoints: ['/kitnets', '/historico', '/api/health']
  });
});

// ===================
// VALIDATION HELPERS
// ===================
const validateId = (id) => {
  const parsed = parseInt(id);
  return !isNaN(parsed) && parsed > 0;
};

const validateValor = (valor) => {
  const parsed = parseFloat(valor);
  return !isNaN(parsed) && parsed >= 0;
};

const validateStatus = (status) => {
  return ['livre', 'alugada'].includes(status);
};

// ===================
// ROUTES - KITNETS
// ===================

// GET /kitnets - Lista todas as kitnets
app.get('/kitnets', async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT id, numero, status, valor, descricao, 
             inquilino_nome, inquilino_telefone, 
             data_entrada, dia_vencimento
      FROM kitnets
    `;
    const params = [];
    const conditions = [];

    // Filter by status
    if (status && validateStatus(status)) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    // Search by number or description
    if (search) {
      conditions.push(`(numero::text LIKE $${params.length + 1} OR descricao ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY numero ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar kitnets:', error);
    res.status(500).json({ error: 'Erro ao buscar kitnets' });
  }
});

// PUT /kitnets/:id/status - Alterna o status
app.put('/kitnets/:id/status', async (req, res) => {
  const { id } = req.params;

  if (!validateId(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const current = await pool.query(
      'SELECT id, status, numero FROM kitnets WHERE id = $1',
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Kitnet não encontrada' });
    }

    const kitnet = current.rows[0];
    const novoStatus = kitnet.status === 'livre' ? 'alugada' : 'livre';

    // If changing to 'livre', clear tenant data
    let updateQuery, updateParams;
    if (novoStatus === 'livre') {
      updateQuery = `
        UPDATE kitnets 
        SET status = $1, inquilino_nome = NULL, inquilino_telefone = NULL, 
            data_entrada = NULL, dia_vencimento = NULL, inquilino_cpf = NULL, inquilino_rg = NULL
        WHERE id = $2 
        RETURNING *
      `;
      updateParams = [novoStatus, id];
    } else {
      updateQuery = 'UPDATE kitnets SET status = $1 WHERE id = $2 RETURNING *';
      updateParams = [novoStatus, id];
    }

    const result = await pool.query(updateQuery, updateParams);

    // Log the change
    await pool.query(
      `INSERT INTO historico_kitnets (kitnet_id, kitnet_numero, acao, status_anterior, status_novo) 
       VALUES ($1, $2, 'status_change', $3, $4)`,
      [id, kitnet.numero, kitnet.status, novoStatus]
    );

    console.log(`🏠 Kitnet ${kitnet.numero}: ${kitnet.status} → ${novoStatus}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// PUT /kitnets/:id/detalhes - Atualiza valor e descrição
app.put('/kitnets/:id/detalhes', async (req, res) => {
  const { id } = req.params;
  const { valor, descricao } = req.body;

  if (!validateId(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  if (valor !== undefined && !validateValor(valor)) {
    return res.status(400).json({ error: 'Valor inválido. Deve ser um número positivo.' });
  }

  if (descricao !== undefined && typeof descricao !== 'string') {
    return res.status(400).json({ error: 'Descrição inválida.' });
  }

  try {
    const result = await pool.query(
      'UPDATE kitnets SET valor = $1, descricao = $2 WHERE id = $3 RETURNING *',
      [valor, descricao, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kitnet não encontrada' });
    }

    console.log(`✏️ Kitnet ${result.rows[0].numero} atualizada: R$ ${valor}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar detalhes:', error);
    res.status(500).json({ error: 'Erro ao atualizar detalhes' });
  }
});

// PUT /kitnets/:id/inquilino - Atualiza dados do inquilino
app.put('/kitnets/:id/inquilino', async (req, res) => {
  const { id } = req.params;
  const { inquilino_nome, inquilino_telefone, inquilino_cpf, inquilino_rg, data_entrada, dia_vencimento } = req.body;

  if (!validateId(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  // Validate dia_vencimento (1-31)
  if (dia_vencimento !== undefined && dia_vencimento !== null) {
    const dia = parseInt(dia_vencimento);
    if (isNaN(dia) || dia < 1 || dia > 31) {
      return res.status(400).json({ error: 'Dia de vencimento deve ser entre 1 e 31.' });
    }
  }

  try {
    const result = await pool.query(
      `UPDATE kitnets 
       SET inquilino_nome = $1, 
           inquilino_telefone = $2, 
           inquilino_cpf = $3,
           inquilino_rg = $4,
           data_entrada = $5, 
           dia_vencimento = $6, 
           status = 'alugada'
       WHERE id = $7 RETURNING *`,
      [inquilino_nome, inquilino_telefone, inquilino_cpf, inquilino_rg, data_entrada, dia_vencimento, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kitnet não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar inquilino:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados do inquilino' });
  }
});

// PUT /kitnets/:id/pagamento - Toggle status de pagamento
app.put('/kitnets/:id/pagamento', async (req, res) => {
  const { id } = req.params;

  if (!validateId(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    // Get current kitnet data first
    const current = await pool.query('SELECT valor, pago_mes FROM kitnets WHERE id = $1', [id]);

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Kitnet não encontrada' });
    }

    const wasPaid = current.rows[0].pago_mes;
    const valor = current.rows[0].valor;

    // Toggle pago_mes value
    const result = await pool.query(
      `UPDATE kitnets 
       SET pago_mes = NOT COALESCE(pago_mes, false)
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    const isNowPaid = result.rows[0].pago_mes;
    const status = isNowPaid ? 'Pago' : 'Pendente';

    // Log if it became PAID
    if (isNowPaid && !wasPaid) {
      const today = new Date();
      const mesReferencia = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      // Check if already paid this month
      const existing = await pool.query(
        'SELECT id FROM historico_pagamentos WHERE kitnet_id = $1 AND mes_referencia = $2',
        [id, mesReferencia]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO historico_pagamentos (kitnet_id, valor, mes_referencia) 
           VALUES ($1, $2, $3)`,
          [id, valor, mesReferencia]
        );
        console.log(`💰 Pagamento registrado para histórico: Kitnet ${result.rows[0].numero}`);
      } else {
        console.log(`ℹ️ Pagamento já registrado para este mês: Kitnet ${result.rows[0].numero}`);
      }
    } else if (!isNowPaid && wasPaid) {
      // Optional: Remove log if toggled back to pending? 
      // For now, let's keep the log as "payment attempt" or just leave it. 
      // A strict system would remove the latest log for this month, but simple is better.
      console.log(`↩️ Pagamento desfeito: Kitnet ${result.rows[0].numero}`);
    }

    console.log(`💰 Kitnet ${result.rows[0].numero}: Pagamento ${status}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar pagamento' });
  }
});

// ===================
// ROUTES - HISTÓRICO
// ===================

// GET /historico - Lista histórico de alterações
app.get('/historico', async (req, res) => {
  try {
    const { kitnet_id, limit = 50 } = req.query;

    let query = `
      SELECT id, kitnet_id, kitnet_numero, acao, status_anterior, status_novo, data_alteracao
      FROM historico_kitnets
    `;
    const params = [];

    if (kitnet_id && validateId(kitnet_id)) {
      query += ' WHERE kitnet_id = $1';
      params.push(kitnet_id);
    }

    query += ' ORDER BY data_alteracao DESC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit) || 50);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// GET /pagamentos/:id - Lista histórico de pagamentos de uma kitnet
app.get('/pagamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const result = await pool.query(
      `SELECT * FROM historico_pagamentos 
       WHERE kitnet_id = $1 
       ORDER BY data_pagamento DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar histórico de pagamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de pagamentos' });
  }
});

// DELETE /pagamentos/:id - Remove um registro de histórico de pagamento
app.delete('/pagamentos/:id', async (req, res) => {
  const { id } = req.params;

  if (!validateId(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const result = await pool.query('DELETE FROM historico_pagamentos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    console.log(`🗑️ Pagamento removido do histórico: ID ${id}`);
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('Erro ao excluir pagamento:', error);
    res.status(500).json({ error: 'Erro ao excluir pagamento' });
  }
});

// ===================
// ROUTES - VENCIMENTOS
// ===================

// GET /kitnets/vencimentos - Lista kitnets com vencimento próximo
app.get('/kitnets/vencimentos', async (req, res) => {
  try {
    const today = new Date();
    const currentDay = today.getDate();

    // Get all rented kitnets with due dates
    const result = await pool.query(`
      SELECT id, numero, status, valor, descricao, 
             inquilino_nome, inquilino_telefone, 
             data_entrada, dia_vencimento, pago_mes
      FROM kitnets
      WHERE status = 'alugada' 
        AND dia_vencimento IS NOT NULL
      ORDER BY dia_vencimento ASC
    `);

    // Filter kitnets: Overdue OR Due in next 7 days
    const notifications = result.rows.map(kitnet => {
      const dueDay = kitnet.dia_vencimento;
      let daysUntilDue;

      if (!kitnet.pago_mes && currentDay > dueDay) {
        // Overdue! (Negative days indicates overdue)
        daysUntilDue = dueDay - currentDay;
      } else if (dueDay >= currentDay) {
        // Due later this month
        daysUntilDue = dueDay - currentDay;
      } else {
        // Due date passed but Paid, or looking at next month 
        // (If paid, we project to next month. If unpaid, logic above catches it as overdue)
        // Actually, if paid, we probably don't need to notify yet unless it's very close to next month (e.g. today 30th, due 1st)
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        daysUntilDue = (daysInMonth - currentDay) + dueDay;
      }

      return { ...kitnet, daysUntilDue };
    }).filter(k => {
      // Include if:
      // 1. Overdue (daysUntilDue < 0) AND Not Paid
      // 2. Due soon (daysUntilDue <= 7)

      if (!k.pago_mes && k.daysUntilDue < 0) return true; // Overdue
      if (k.daysUntilDue >= 0 && k.daysUntilDue <= 7) return true; // Upcoming
      return false;
    }).sort((a, b) => a.daysUntilDue - b.daysUntilDue); // Sort by urgency (lowest/most negative first)

    res.json(notifications);
  } catch (error) {
    console.error('Erro ao buscar vencimentos:', error);
    res.status(500).json({ error: 'Erro ao buscar vencimentos' });
  }
});

// ===================
// ROUTES - BACKUP
// ===================
const { exec } = require('child_process');

const BACKUP_DIR = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// GET /backup - Download database backup
app.get('/backup', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `kitnets_backup_${timestamp}.json`;

    // Export all data as JSON
    const kitnets = await pool.query('SELECT * FROM kitnets ORDER BY numero');
    const historico = await pool.query('SELECT * FROM historico_kitnets ORDER BY data_alteracao DESC LIMIT 1000');

    const backup = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {
        kitnets: kitnets.rows,
        historico: historico.rows,
      },
      stats: {
        totalKitnets: kitnets.rows.length,
        totalHistorico: historico.rows.length,
        livres: kitnets.rows.filter(k => k.status === 'livre').length,
        alugadas: kitnets.rows.filter(k => k.status === 'alugada').length,
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(backup);

    console.log(`📦 Backup manual gerado: ${filename}`);
  } catch (error) {
    console.error('Erro ao gerar backup:', error);
    res.status(500).json({ error: 'Erro ao gerar backup' });
  }
});

// POST /backup/restore - Restore from backup
app.post('/backup/restore', async (req, res) => {
  try {
    const { kitnets, clearExisting } = req.body;

    if (!kitnets || !Array.isArray(kitnets)) {
      return res.status(400).json({ error: 'Dados de backup inválidos' });
    }

    if (clearExisting) {
      await pool.query('DELETE FROM historico_kitnets');
      await pool.query('DELETE FROM kitnets');
    }

    let imported = 0;
    for (const kitnet of kitnets) {
      await pool.query(`
        INSERT INTO kitnets (numero, status, valor, descricao, inquilino_nome, inquilino_telefone, data_entrada, dia_vencimento)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (numero) DO UPDATE SET
          status = $2, valor = $3, descricao = $4, inquilino_nome = $5, 
          inquilino_telefone = $6, data_entrada = $7, dia_vencimento = $8
      `, [
        kitnet.numero, kitnet.status, kitnet.valor, kitnet.descricao,
        kitnet.inquilino_nome, kitnet.inquilino_telefone, kitnet.data_entrada, kitnet.dia_vencimento
      ]);
      imported++;
    }

    console.log(`📥 Backup restaurado: ${imported} kitnets`);
    res.json({ success: true, imported });
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    res.status(500).json({ error: 'Erro ao restaurar backup' });
  }
});

// ===================
// AUTOMATIC BACKUP (CRON)
// ===================
const cron = require('node-cron');

// Run monthly reset on the 1st day of every month at 00:00
cron.schedule('0 0 1 * *', async () => {
  try {
    console.log('📅 Executando reset mensal de pagamentos...');
    await pool.query('UPDATE kitnets SET pago_mes = false');

    // Log action
    await pool.query(
      `INSERT INTO historico_kitnets (acao, status_novo) 
       VALUES ('reset_mensal', 'todos_pendentes')`
    );

    console.log('✅ Todos os pagamentos foram resetados para PENDENTE.');
  } catch (error) {
    console.error('❌ Erro no reset mensal:', error);
  }
});

// Run backup every day at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `kitnets_auto_${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    const kitnets = await pool.query('SELECT * FROM kitnets ORDER BY numero');
    const historico = await pool.query('SELECT * FROM historico_kitnets ORDER BY data_alteracao DESC LIMIT 1000');
    const pagamentos = await pool.query('SELECT * FROM historico_pagamentos ORDER BY data_pagamento DESC LIMIT 1000');

    const backup = {
      exportDate: new Date().toISOString(),
      version: '1.1',
      data: {
        kitnets: kitnets.rows,
        historico: historico.rows,
        pagamentos: pagamentos.rows,
      }
    };

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
    console.log(`📦 Backup automático salvo: ${filename}`);

    // Keep only last 7 backups
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('kitnets_auto_'))
      .sort()
      .reverse();

    if (files.length > 7) {
      for (const file of files.slice(7)) {
        fs.unlinkSync(path.join(BACKUP_DIR, file));
        console.log(`🗑️ Backup antigo removido: ${file}`);
      }
    }
  } catch (error) {
    console.error('❌ Erro no backup automático:', error);
  }
});

console.log('⏰ Backup automático agendado para 02:00 diariamente');

// ===================
// ROUTES - DASHBOARD
// ===================
app.get('/dashboard/stats', async (req, res) => {
  try {
    // 1. Estatísticas de Ocupação e Receita Potencial
    const statsQuery = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'alugada' THEN 1 ELSE 0 END) as alugadas,
        SUM(CASE WHEN status = 'livre' THEN 1 ELSE 0 END) as livres,
        SUM(CASE WHEN status = 'alugada' THEN valor ELSE 0 END) as receita_potencial
      FROM kitnets
    `);

    const stats = statsQuery.rows[0];

    // 2. Receita Realizada (Mês Atual)
    const today = new Date();
    const mesAtual = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const receitaQuery = await pool.query(`
      SELECT SUM(valor) as receita_realizada
      FROM historico_pagamentos
      WHERE mes_referencia = $1
    `, [mesAtual]);

    const receitaRealizada = parseFloat(receitaQuery.rows[0].receita_realizada || 0);
    const receitaPotencial = parseFloat(stats.receita_potencial || 0);

    // 3. Histórico últimos 6 meses (Gráfico)
    // We need to subtract expenses here too if we want "Profit", but for now let's keep revenue only or handle profit separately?
    // Let's keep the chart as "Revenue Evolution" for now as per previous design, potentially add expenses line later.
    const graficoQuery = await pool.query(`
      SELECT mes_referencia, SUM(valor) as total
      FROM historico_pagamentos
      GROUP BY mes_referencia
      ORDER BY mes_referencia DESC
      LIMIT 6
    `);

    // 4. Despesas do Mês
    const despesasQuery = await pool.query(`
      SELECT SUM(valor) as total_despesas
      FROM despesas
      WHERE to_char(data_despesa, 'YYYY-MM') = $1
    `, [mesAtual]);

    const despesasMes = parseFloat(despesasQuery.rows[0].total_despesas || 0);
    const lucroLiquido = receitaRealizada - despesasMes;

    res.json({
      ocupacao: {
        total: parseInt(stats.total),
        alugadas: parseInt(stats.alugadas),
        livres: parseInt(stats.livres),
        taxa: stats.total > 0 ? Math.round((stats.alugadas / stats.total) * 100) : 0
      },
      financeiro: {
        potencial: receitaPotencial,
        realizado: receitaRealizada,
        pendente: Math.max(0, receitaPotencial - receitaRealizada),
        despesas: despesasMes,
        lucro: lucroLiquido
      },
      grafico: graficoQuery.rows.reverse() // Do mais antigo para o mais recente
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

// ===================
// ROUTES - DOCUMENTOS
// ===================

// POST /upload - Upload de documento
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { kitnet_id, tipo } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    if (!validateId(kitnet_id)) {
      // Clean up file if validation fails
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
app.get('/kitnets/:id/documentos', async (req, res) => {
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
app.delete('/documentos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Get file path first
    const docQuery = await pool.query('SELECT caminho_arquivo FROM documentos WHERE id = $1', [id]);

    if (docQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Documento não encontrado.' });
    }

    const filePath = docQuery.rows[0].caminho_arquivo;

    // Delete from DB
    await pool.query('DELETE FROM documentos WHERE id = $1', [id]);

    // Delete from Disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar documento:', error);
    res.status(500).json({ error: 'Erro ao deletar documento.' });
  }
});

// ===================
// ROUTES - DESPESAS
// ===================

// GET /despesas - List expenses (optional month filter YYYY-MM)
app.get('/despesas', async (req, res) => {
  try {
    const { mes } = req.query; // YYYY-MM
    let query = 'SELECT * FROM despesas';
    const params = [];

    if (mes) {
      query += ` WHERE to_char(data_despesa, 'YYYY-MM') = $1`;
      params.push(mes);
    }

    query += ' ORDER BY data_despesa DESC, id DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    res.status(500).json({ error: 'Erro ao buscar despesas.' });
  }
});

// POST /despesas - Add expense
app.post('/despesas', async (req, res) => {
  try {
    const { descricao, valor, categoria, data_despesa } = req.body;

    if (!descricao || !valor) {
      return res.status(400).json({ error: 'Descrição e Valor são obrigatórios.' });
    }

    const result = await pool.query(
      `INSERT INTO despesas (descricao, valor, categoria, data_despesa)
       VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE))
       RETURNING *`,
      [descricao, valor, categoria || 'Outros', data_despesa]
    );

    console.log(`💸 Despesa adicionada: ${descricao} - R$ ${valor}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao salvar despesa:', error);
    res.status(500).json({ error: 'Erro ao salvar despesa.' });
  }
});

// DELETE /despesas/:id - Delete expense
app.delete('/despesas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM despesas WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Despesa não encontrada.' });
    }

    console.log(`🗑️ Despesa removida: ${result.rows[0].descricao}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir despesa:', error);
    res.status(500).json({ error: 'Erro ao excluir despesa.' });
  }
});

// ===================
// START SERVER
// ===================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

