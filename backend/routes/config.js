const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Criar tabela de configurações se não existir
const initConfigTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS config (
            chave VARCHAR(50) PRIMARY KEY,
            valor TEXT,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Inserir configuração padrão do WhatsApp se não existir
    await pool.query(`
        INSERT INTO config (chave, valor) 
        VALUES ('whatsapp_ativo', 'false')
        ON CONFLICT (chave) DO NOTHING
    `);
};

// Inicializar tabela
initConfigTable().catch(console.error);

// GET /config/whatsapp - Obtém status do WhatsApp
router.get('/whatsapp', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT valor FROM config WHERE chave = 'whatsapp_ativo'"
        );

        const ativo = result.rows[0]?.valor === 'true';
        res.json({ ativo });
    } catch (error) {
        console.error('Erro ao obter config WhatsApp:', error);
        res.status(500).json({ error: 'Erro ao obter configuração' });
    }
});

// PUT /config/whatsapp - Ativa/desativa WhatsApp
router.put('/whatsapp', async (req, res) => {
    try {
        const { ativo } = req.body;

        // Garantir que a tabela existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS config (
                chave VARCHAR(50) PRIMARY KEY,
                valor TEXT,
                atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // UPSERT - insere ou atualiza
        await pool.query(`
            INSERT INTO config (chave, valor, atualizado_em) 
            VALUES ('whatsapp_ativo', $1, CURRENT_TIMESTAMP)
            ON CONFLICT (chave) 
            DO UPDATE SET valor = $1, atualizado_em = CURRENT_TIMESTAMP
        `, [ativo ? 'true' : 'false']);

        // Se ativado e existe o módulo WhatsApp, tentar iniciar
        if (ativo) {
            try {
                const { initWhatsApp, isConnected } = require('../services/whatsapp');
                if (!isConnected()) {
                    console.log('🤖 Iniciando WhatsApp Bot...');
                    initWhatsApp().catch(err => {
                        console.error('Erro ao iniciar WhatsApp:', err.message);
                    });
                }
            } catch (e) {
                if (!isConnected()) {
                    console.log('🤖 Iniciando WhatsApp Bot...');
                    initWhatsApp().catch(err => {
                        console.error('Erro ao iniciar WhatsApp:', err.message);
                    });
                }
            } catch (e) {
                console.error('WhatsApp module load error:', e);
                console.log('WhatsApp module not available');
            }
        }

        res.json({ ativo, message: ativo ? 'WhatsApp ativado' : 'WhatsApp desativado' });
    } catch (error) {
        console.error('Erro ao atualizar config WhatsApp:', error);
        res.status(500).json({ error: 'Erro ao atualizar configuração' });
    }
});

// GET /config/whatsapp/status - Status da conexão
router.get('/whatsapp/status', async (req, res) => {
    try {
        const { isConnected } = require('../services/whatsapp');
        res.json({
            conectado: isConnected(),
            message: isConnected() ? 'Conectado ao WhatsApp' : 'Desconectado'
        });
    } catch (e) {
        res.json({ conectado: false, message: 'Módulo WhatsApp não disponível' });
    }
});


// POST /config/whatsapp/reset - Reinicia a conexão e limpa sessão
router.post('/whatsapp/reset', async (req, res) => {
    try {
        const { stopWhatsApp, initWhatsApp } = require('../services/whatsapp');
        const fs = require('fs');
        const path = require('path');

        console.log('🔄 Reiniciando WhatsApp Bot...');

        // 1. Parar conexão atual
        await stopWhatsApp();

        // 2. Limpar pasta de autenticação
        const authDir = path.join(__dirname, '..', 'auth_info');
        if (fs.existsSync(authDir)) {
            fs.rmSync(authDir, { recursive: true, force: true });
            console.log('🗑️ Sessão antiga removida.');
        }

        // 3. Reiniciar (se estiver ativo no banco)
        const result = await pool.query("SELECT valor FROM config WHERE chave = 'whatsapp_ativo'");
        const ativo = result.rows[0]?.valor === 'true';

        if (ativo) {
            console.log('🚀 Iniciando nova sessão...');
            // Pequeno delay para garantir liberação de recursos
            setTimeout(() => {
                initWhatsApp().catch(console.error);
            }, 1000);
        }

        res.json({ message: 'WhatsApp reiniciado. Aguarde o QR Code no terminal/logs.' });
    } catch (error) {
        console.error('Erro ao resetar WhatsApp:', error);
        res.status(500).json({ error: 'Erro ao resetar WhatsApp' });
    }
});

// GET /config/whatsapp/qr - Obtém o código QR atual
router.get('/whatsapp/qr', (req, res) => {
    try {
        const { getQR } = require('../services/whatsapp');
        res.json({ qr: getQR() });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao obter QR Code' });
    }
});

module.exports = router;
