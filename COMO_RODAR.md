# 🚀 Como Fazer o Servidor Funcionar

## ⚠️ Problema: Servidor não inicia

O servidor não está funcionando porque as **variáveis de ambiente do Supabase** não estão configuradas.

## ✅ Solução Rápida (Para Ver a Interface)

### Passo 1: Copiar arquivo de configuração temporária

No terminal, execute:

```bash
# Windows (PowerShell)
Copy-Item .env.local.temp .env.local

# OU manualmente: renomeie o arquivo .env.local.temp para .env.local
```

### Passo 2: Iniciar o servidor

```bash
pnpm dev
```

### Passo 3: Acessar

Abra o navegador em: **http://localhost:3000**

---

## 📝 Credenciais de Teste

Após o servidor iniciar, faça login com:
- **Email**: qualquer email (ex: `teste@teste.com`)
- **Senha**: qualquer senha (ex: `123456`)

> **Nota**: A autenticação não funcionará de verdade porque o Supabase está em modo mock, mas você poderá ver toda a interface do sistema!

---

## 🎯 Para Usar com Supabase Real (Opcional)

Se quiser conectar ao Supabase de verdade:

1. Acesse https://supabase.com/dashboard
2. Crie um projeto (2-3 minutos)
3. Vá em **Settings → API**
4. Copie as credenciais
5. Edite o arquivo `.env.local` com os valores reais

---

## 🐛 Se Ainda Não Funcionar

Tente:

```bash
# Limpar cache e reiniciar
rm -rf .next
pnpm dev
```

---

## 📱 O Que Você Verá

Com o servidor rodando, você poderá acessar:
- ✅ Página de login (azul e branco)
- ✅ Dashboard com cards de métricas
- ✅ **Central de Mensagens** (nova!)
  - Lista de conversas com filtros
  - Chat em tempo real
  - Detalhes do paciente
- ✅ Sidebar com navegação

Todos com dados de exemplo (mock data) funcionando!
