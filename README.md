# 🏬 KitManager 

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **Gestão Inteligente de Aluguéis e Kitnets.** Uma solução completa, moderna e otimizada para dispositivos móveis para controle financeiro e administrativo de imóveis.

---

## 📸 Demonstração
*O sistema conta com interface responsiva (PWA), modo noturno nativo e gráficos dinâmicos.*

<p align="center">
  <img src="https://img.icons8.com/clouds/200/home.png" alt="Logo do Projeto" />
</p>

---

## 🚀 Principais Funcionalidades

### 💼 Administrativo
- **Dashboard Financeiro**: Acompanhamento de ocupação, receita mensal realizada, valores a receber e gráfico de evolução mensal.
- **Gestão de Unidades**: Painel visual para controlar 20 kitnets com status dinâmicos (Livre/Alugada).
- **Controle de Inquilinos**: Cadastro completo incluindo CPF, RG, telefone e histórico de pagamentos.
- **Gerador de Contratos**: Exportação automática de contratos de aluguel em PDF preenchidos com os dados do inquilino.

### 📱 Comunicação e Mobilidade
- **Integração WhatsApp**: Atalhos para contato individual e envio de avisos/lembretes para o grupo do condomínio.
- **PWA (Progressive Web App)**: Instale o sistema no seu celular (Android/iOS) e use como um aplicativo nativo.
- **Notificações Inteligentes**: Alertas visuais indicando vencimentos próximos ou atrasos.

### ⚙️ Técnico e Segurança
- **Histórico de Alterações**: Log completo de todas as mudanças de status e dados no sistema.
- **Backup e Exportação**: Download de banco de dados em tempo real e exportação de listas para Excel.
- **Arquitetura Nuvem**: Backend hospedado no Railway e Frontend no Vercel para alta disponibilidade.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React.js**: Interface reativa e modular.
- **Tailwind CSS**: Estilização moderna e responsiva.
- **Lucide React**: Biblioteca de ícones premium.
- **Recharts**: Gráficos de dados financeiros.
- **jspdf**: Geração de documentos PDF no cliente.

### Backend
- **Node.js & Express**: API REST escalável.
- **PostgreSQL**: Banco de dados relacional robusto.
- **Railway**: Hospedagem de banco de dados e servidor.
- **Vercel**: Deploy automatizado do frontend.

---

## 💻 Como Rodar Localmente

### 1. Pré-requisitos
- Node.js instalado.
- Banco de dados PostgreSQL configurado.

### 2. Configuração do Backend
```bash
# Entre na pasta
cd backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente no .env (DATABASE_URL)
# Inicie o servidor
npm start
```

### 3. Configuração do Frontend
```bash
# Entre na pasta
cd frontend

# Instale as dependências
npm install

# Inicie o modo desenvolvimento
npm run dev
```

---

## 📂 Estrutura do Projeto

```text
├── backend/
│   ├── server.js      # API Express e Conexão DB
│   └── package.json   # Dependências do servidor
├── frontend/
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   └── App.jsx     # Lógica principal
│   └── public/        # Recursos do PWA e Ícones
└── README.md
```

---

## 📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---
<p align="center">
  Desenvolvido com ❤️ para a gestão do <b>Condomínio Porto Reis</b>.
</p>
