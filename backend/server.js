require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// ===================
// MIDDLEWARE
// ===================
app.use(cors());
app.use(express.json());

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

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create kitnets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kitnets (
        id SERIAL PRIMARY KEY,
        numero INTEGER UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'livre',
        valor DECIMAL(10,2) DEFAULT 0,
        descricao TEXT,
        inquilino_nome VARCHAR(255),
        inquilino_telefone VARCHAR(50),
        data_entrada DATE,
        dia_vencimento INTEGER,
        pago_mes BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create historico table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historico_kitnets (
        id SERIAL PRIMARY KEY,
        kitnet_id INTEGER,
        kitnet_numero INTEGER,
        acao VARCHAR(50),
        status_anterior VARCHAR(20),
        status_novo VARCHAR(20),
        data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create historico_pagamentos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historico_pagamentos (
        id SERIAL PRIMARY KEY,
        kitnet_id INTEGER,
        data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valor DECIMAL(10,2),
        mes_referencia VARCHAR(7)
      )
    `);

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

    // Migration: Add pago_mes column if it doesn't exist
    try {
      await pool.query('ALTER TABLE kitnets ADD COLUMN IF NOT EXISTS pago_mes BOOLEAN DEFAULT false');
      console.log('✅ Coluna pago_mes verificada/adicionada');
    } catch (migrationError) {
      // Column might already exist, ignore error
    }

    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
  }
}

// Test connection and initialize
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erro ao conectar no PostgreSQL:', err.message);
  } else {
    console.log('✅ Conectado ao PostgreSQL');
    release();
    initializeDatabase();
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
            data_entrada = NULL, dia_vencimento = NULL
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
  const { inquilino_nome, inquilino_telefone, data_entrada, dia_vencimento } = req.body;

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
       SET inquilino_nome = $1, inquilino_telefone = $2, 
           data_entrada = $3, dia_vencimento = $4
       WHERE id = $5 
       RETURNING *`,
      [inquilino_nome, inquilino_telefone, data_entrada, dia_vencimento, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kitnet não encontrada' });
    }

    console.log(`👤 Inquilino atualizado na Kitnet ${result.rows[0].numero}: ${inquilino_nome}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar inquilino:', error);
    res.status(500).json({ error: 'Erro ao atualizar inquilino' });
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

      await pool.query(
        `INSERT INTO historico_pagamentos (kitnet_id, valor, mes_referencia) 
         VALUES ($1, $2, $3)`,
        [id, valor, mesReferencia]
      );
      console.log(`💰 Pagamento registrado para histórico: Kitnet ${result.rows[0].numero}`);
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

// ===================
// ROUTES - VENCIMENTOS
// ===================

// GET /kitnets/vencimentos - Lista kitnets com vencimento próximo
app.get('/kitnets/vencimentos', async (req, res) => {
  try {
    const today = new Date();
    const currentDay = today.getDate();

    // Get all rented kitnets with due dates in the next 7 days
    const result = await pool.query(`
      SELECT id, numero, status, valor, descricao, 
             inquilino_nome, inquilino_telefone, 
             data_entrada, dia_vencimento
      FROM kitnets
      WHERE status = 'alugada' 
        AND dia_vencimento IS NOT NULL
      ORDER BY dia_vencimento ASC
    `);

    // Filter kitnets with due dates in the next 7 days
    const notifications = result.rows.filter(kitnet => {
      const dueDay = kitnet.dia_vencimento;
      let daysUntilDue;

      if (dueDay >= currentDay) {
        daysUntilDue = dueDay - currentDay;
      } else {
        // Due date already passed this month, check days until next month's due
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        daysUntilDue = (daysInMonth - currentDay) + dueDay;
      }

      return daysUntilDue <= 7;
    });

    res.json(notifications);
  } catch (error) {
    console.error('Erro ao buscar vencimentos:', error);
    res.status(500).json({ error: 'Erro ao buscar vencimentos' });
  }
});

// ===================
// ROUTES - BACKUP
// ===================
const fs = require('fs');
const path = require('path');
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
// START SERVER
// ===================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

