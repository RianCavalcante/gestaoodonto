# GestãoOdonto 🦷

Sistema completo de gestão para clínicas odontológicas com central de mensagens omnichannel, funil de vendas e dashboards analíticos.

## 🚀 Funcionalidades

- ✅ **Central de Mensagens Omnichannel**: WhatsApp, Facebook, Instagram e chat do site em uma única interface
- ✅ **Funil de Vendas**: Gestão visual de leads com drag & drop
- ✅ **Dashboards e Analytics**: Métricas e relatórios em tempo real
- ✅ **Integração WhatsApp Gratuita**: Conecte via QR Code (whatsapp-web.js)

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **WhatsApp**: whatsapp-web.js + Baileys
- **UI**: Shadcn/ui + Lucide Icons
- **Charts**: Recharts
- **Drag & Drop**: @dnd-kit

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- pnpm (recomendado) ou npm

### Passos

1. Clone o repositório e instale as dependências:
```bash
pnpm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.local.example .env.local
```

Edite `.env.local` e adicione suas credenciais do Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

3. Execute o servidor de desenvolvimento:
```bash
pnpm dev
```

4. Acesse http://localhost:3000

## 🗄️ Configuração do Banco de Dados

O schema do banco de dados está documentado no `implementation_plan.md`. Execute as migrations do Supabase conforme necessário.

### Tabelas Principais:
- `users` - Usuários e atendentes
- `clinics` - Clínicas odontológicas
- `patients` - Pacientes/leads
- `conversations` - Conversas omnichannel
- `messages` - Mensagens
- `funnel_stages` - Estágios do funil
- `campaigns` - Campanhas de marketing
- `whatsapp_sessions` - Sessões WhatsApp

## 📱 Integração WhatsApp

O sistema suporta integração gratuita com WhatsApp via `whatsapp-web.js`:

1. Acesse **Configurações** no dashboard
2. Vá para **WhatsApp**
3. Escaneie o QR Code com seu WhatsApp
4. Pronto! As mensagens aparecerão na central omnichannel

## 🎨 Design System

O projeto usa um design system premium com:
- Dark mode por padrão
- Glassmorphism effects
- Gradientes vibrantes
- Animações suaves
- Paleta de cores personalizada para canais (WhatsApp verde, Facebook azul, Instagram gradiente)

## 📝 Credenciais Demo

Para teste local (após configurar o banco):
- **Email**: admin@gestaoodonto.com
- **Senha**: demo123

## 🤝 Contribuindo

Este é um projeto em desenvolvimento ativo. Contribuições são bem-vindas!

## 📄 Licença

MIT

---

Desenvolvido com ❤️ para clínicas odontológicas
