# 🚀 Setup Rápido - GestãoOdonto

## 1. Configurar Supabase

### Opção A: Usar Supabase Cloud (Recomendado)

1. Acesse https://supabase.com/dashboard
2. Clique em "New Project"
3. Preencha os dados do projeto
4. Aguarde a criação (2-3 minutos)
5. Vá em "Settings" → "API"
6. Copie:
   - `Project URL` → será o `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public` key → será o `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → será o `SUPABASE_SERVICE_ROLE_KEY`

7. **Crie o arquivo `.env.local` na raiz do projeto:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Opção B: Supabase Local

```bash
npx supabase init
npx supabase start
```

## 2. Executar o Projeto

```bash
pnpm dev
```

Acesse: **http://localhost:3000**

## 3. Próximos Passos

Após configurar o Supabase, solicite ao assistente:
- "Implemente a integração WhatsApp com QR Code"
- "Crie a Central de Mensagens Omnichannel"
- "Implemente o Funil de Vendas"

---

## ⚠️ Importante

- O projeto **não vai compilar** sem as variáveis de ambiente do Supabase configuradas
- Crie o arquivo `.env.local` na raiz com suas credenciais
- Você pode usar o arquivo `.env.local.example` como referência

## 💡 Credenciais Demo

Após criar o banco e usuários:
- Email: admin@gestaoodonto.com
- Senha: demo123
