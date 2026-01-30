# KitManager - Kitnets Dashboard

Sistema completo para gerenciamento de kitnets para aluguel.

## 🚀 Features

- **Dashboard Visual**: Grid de cards com status em tempo real
- **Toggle de Status**: Marcar kitnet como livre/alugada com um clique
- **Gestão de Inquilinos**: Nome, telefone, data de entrada, vencimento
- **WhatsApp Integration**: Enviar mensagens individuais ou para grupo
- **Notificações**: Alertas de vencimento próximo (7 dias)
- **Export**: Relatórios em PDF e Excel
- **Backup**: Automático diário + download manual
- **PWA**: Funciona offline como app no celular

## 🛠️ Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL

## 📦 Instalação

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configure as variáveis de ambiente
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Variáveis de Ambiente

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=usuario
DB_PASSWORD=senha
DB_NAME=imobiliaria
PORT=3001
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

## 📱 Deploy

O frontend pode ser deployado no Vercel.
O backend precisa de um servidor com Node.js e PostgreSQL.

## 📄 License

MIT
