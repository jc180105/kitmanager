# KitManager WhatsApp Bot

Serviço **independente** do bot WhatsApp para o sistema KitManager.

## 🎯 Objetivo

Executar o bot WhatsApp de forma isolada do backend principal, permitindo:
- ✅ Reniciar o bot sem afetar a aplicação web
- ✅ Logs e debugging separados
- ✅ Escalabilidade independente
- ✅ Usar o mesmo banco de dados PostgreSQL

## 🚀 Deploy no Railway

### 1. Criar Novo Serviço

No Railway:
1. Cliquesentence "New Service" → " GitHub Repo"
2. Selecione o repositório `kitmanager`
3. Em "Settings" → "Configure Build":
   - **Root Directory**: `whatsapp-bot`
   - **Build Command**: (deixe vazio)
   - **Start Command**: `npm start`

### 2. Conectar ao Banco

1. Vá em "Variables"
2. Clique em "Reference" → Selecione o serviço **Postgres**
3. Adicione: `DATABASE_URL` → `${{Postgres.DATABASE_URL}}`

### 3. Adicionar Variáveis

Adicione as seguintes variáveis:
- `OPENAI_API_KEY` (opcional)
- `GEMINI_API_KEY` (obrigatório para AI)

### 4. Deploy!

O Railway vai detectar as mudanças e fazer deploy automaticamente.

## 📱 Conectar WhatsApp

Após o deploy:

1. Acesse os logs do serviço no Railway
2. Procure pelo QR Code no terminal
3. Escaneie com seu WhatsApp
4. Pronto! Bot conectado

## 🔄 Endpoints

- `GET /health` - Status do bot e conexão WhatsApp
- `GET /qr` - Obter QR Code para conexão

## 📦 Estrutura

```
whatsapp-bot/
├── package.json
├── server.js
├── config/
│   └── database.js
└── services/
    ├── whatsapp.js
    └── aiAgent.js
```

## 🐛 Debug

Se o WhatsApp desconectar:
1. Va em Railway → whatsapp-bot → "Deployments"
2. Clique em "Redeploy"
3. O bot vai reiniciar e mostrar novo QR Code nos logs

**Não afeta a aplicação principal! 🎉**
