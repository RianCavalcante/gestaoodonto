# 🚀 Deploy no EasyPanel (Servidor WhatsApp)

Este servidor WhatsApp deve rodar separadamente do seu frontend Next.js para garantir estabilidade e persistência "Always On".

## 1. Criar Serviço no EasyPanel

1. Crie um novo **App** (ex: `whatsapp-server`).
2. Adicione um **Service** do tipo **Application**.
3. Em **Source**, selecione seu repositório GitHub.
4. **IMPORTANTE:** No campo **Root Directory** (ou Context), coloque:
   `backend/whatsapp`
   *(Isso diz para o EasyPanel construir apenas essa pasta, não o projeto todo)*

## 2. Configurar Build

O EasyPanel deve detectar automaticamente o `Dockerfile` dentro dessa pasta.
- **Build Type:** Dockerfile

## 3. Configurar Persistência (Volume) 🚨 CRÍTICO 🚨

Para que você não precise escanear o QR Code toda vez que fizer um deploy ou o servidor reiniciar:

1. Vá na aba **Storage** (ou Volumes).
2. Adicione um novo Volume:
   - **Mount Path (Caminho no Container):** `/app/auth_info_baileys`
   - **Type:** Disk (Persistent)
   
*Isso garante que a sessão do WhatsApp fique salva em um "disco virtual" separado do container.*

## 4. Variáveis de Ambiente (Environment)

Adicione as variáveis necessárias na aba **Environment**:

```env
PORT=3001
SUPABASE_URL=sua_url_supabase
SUPABASE_KEY=sua_service_role_key
# Opcional: Para debug
NODE_ENV=production
```

## 5. Expor Porta

Vá na aba **Domains** (ou Network):
1. Habilite o domínio (ex: `whatsapp.seu-easypanel.com`).
2. Garanta que a **Container Port** seja `3001`.

## 6. Atualizar o Frontend

Depois que o servidor WhatsApp estiver rodando e você tiver a URL dele (ex: `https://whatsapp.seu-easypanel.com`), atualize o seu projeto Next.js (Frontend):

No `.env.local` (ou Environment do Frontend):
```env
NEXT_PUBLIC_WHATSAPP_SERVER_URL=https://whatsapp.seu-easypanel.com
```

---

✅ **Pronto!** Agora seu servidor WhatsApp rodará isolado, blindado e com persistência de sessão.
