# 🏬 KitManager - Gestão de Kitnets & Aluguéis

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **A revolução na gestão de micro-imóveis.** Uma plataforma completa, segura e com design premium para proprietários que buscam eficiência e controle total.

---

## 💎 O Que Nos Torna Diferentes?

Ao contrário de planilhas complexas ou sistemas arcaicos, o **KitManager** foi desenhado com foco em **Experiência do Usuário (UX)** e **Automação**.

*   **🔐 Segurança de Ponta**: Sistema de autenticação robusto com **JWT**, sessões seguras e proteção de rotas. Seus dados financeiros estão protegidos.
*   **🎨 Design Premium "Glassmorphism"**: Interface moderna, escura e elegante, pensada para ser agradável de usar tanto no desktop quanto no celular (PWA).
*   **🤖 Automação WhatsApp**: Bot integrado que envia cobranças, recibos e avisos automaticamente. Escaneie o QR Code direto na aplicação!
*   **💸 Controle Financeiro Real**: Não apenas aluguéis. Gerencie despesas, visualize gráficos de fluxo de caixa (Receita x Despesa) e lucro líquido em tempo real.

---

## 🚀 Funcionalidades Principais

### 🏢 Gestão de Propriedades
*   **Painel Visual**: Veja o status de todas as kitnets (Livre/Alugada/Pendente/Paga) em um relance.
*   **Gestão de Inquilinos**: Cadastro completo, histórico de contratos e documentos digitalizados.
*   **Status Dinâmicos**: Altere de "Livre" para "Alugada" com um clique, mantendo histórico automático.

### 💰 Financeiro Avançado
*   **Fluxo de Caixa**: Gráficos interativos mostram a saúde financeira do seu negócio mês a mês.
*   **Gestão de Despesas**: Lance gastos com manutenção, impostos e contas para saber seu lucro real.
*   **Recibos Digitais**: Gere e envie recibos de pagamento profissionais em PDF ou via WhatsApp.
*   **Histórico de Pagamentos**: Registro imutável de todos os pagamentos recebidos.

### 📱 Mobilidade & Tecnologia
*   **PWA (Progressive Web App)**: Instale como um app nativo no seu Android ou iOS.
*   **Sincronização em Nuvem**: Acesse de qualquer lugar, com dados salvos seguramente na nuvem (Railway/PostgreSQL).
*   **Backup One-Click**: Baixe todos os seus dados a qualquer momento para segurança extra.

---

## 🛡️ Segurança & Autenticação

Implementamos um novo módulo de segurança para proteger o acesso administrativo:

*   **Login Seguro**: Interface de login dedicada com validação de credenciais.
*   **Tokens JWT**: Sessões persistentes e seguras (validade de 1 ano para conveniência do admin).
*   **Proteção de API**: Todas as rotas sensíveis (financeiro, dados de inquilinos) são blindadas contra acesso não autorizado.

---

## 🛠️ Stack Tecnológico

O sistema utiliza o que há de mais moderno no desenvolvimento web:

### Frontend
- **React 19 + Vite**: Performance extrema e carregamento instantâneo.
- **Tailwind CSS + Lucide**: Design system consistente e belíssimos ícones.
- **Recharts**: Visualização de dados financeiros.
- **Context API**: Gerenciamento de estado global otimizado.

### Backend
- **Node.js + Express**: API RESTful rápida e escalável.
- **PostgreSQL**: Banco de dados relacional para integridade dos dados.
- **JWT (JSON Web Tokens)**: Padrão ouro em autenticação stateless.
- **Baileys**: Integração direta e leve com a API do WhatsApp.

### Infraestrutura
- **Railway**: Hospedagem robusta para Backend e Banco de Dados.
- **Vercel**: CDN Global para entrega do Frontend.

---

## 💻 Instalação e Uso

### Pré-requisitos
*   Node.js 20+
*   PostgreSQL

### Backend
```bash
cd backend
npm install
# Crie um arquivo .env com:
# DATABASE_URL=ua_url_postgres
# JWT_SECRET=sua_chave_secreta
# ADMIN_PASSWORD=sua_senha
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📄 Licença
Desenvolvido exclusivamente para gestão privada. Todos os direitos reservados.

---
<p align="center">
  <b>KitManager</b> - Transformando a gestão de aluguéis.
</p>
