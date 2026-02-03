# KitManager WhatsApp Bot 🤖

Bot de atendimento automático via WhatsApp para o sistema KitManager.

## 📋 Recursos

- Responde perguntas sobre kitnets disponíveis
- Informa preços e localização
- Transcreve mensagens de áudio (Whisper)
- Registra leads interessados
- Usa GPT-4o-mini para respostas inteligentes

## 🔧 Configuração

1. Copie `.env.example` para `.env`
2. Preencha as variáveis:
   - `DATABASE_URL` - Mesma URL do banco do backend principal
   - `OPENAI_API_KEY` - Chave da API OpenAI

## 🚀 Rodar Localmente

```bash
npm install
npm run dev
```

Na primeira execução, escaneie o QR Code com o WhatsApp.

## 📦 Deploy no Railway

1. Crie um novo serviço no Railway
2. Conecte este repositório (pasta `backend-whatsapp/`)
3. Configure as variáveis de ambiente
4. ⚠️ O QR Code aparece nos logs - escaneie rápido!

## 🏗️ Arquitetura

```
backend-whatsapp/
├── server.js           # Entry point + health check
├── config/
│   └── database.js     # Conexão PostgreSQL (mesmo banco)
└── services/
    ├── whatsapp.js     # Conexão Baileys
    └── aiAgent.js      # Lógica IA + consultas DB
```

## ⚠️ Importante

- Este serviço roda **separado** do backend principal
- Ambos compartilham o **mesmo banco de dados**
- O WhatsApp precisa de um número dedicado para o bot
