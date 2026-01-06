# PRD e Arquitetura Técnica: Sistema Omnichannel (WhatsApp)

**Status:** Implementado (Estável)  
**Última Atualização:** 05/01/2026

## 1. Visão Geral
Este módulo gerencia a comunicação via WhatsApp integrada ao CRM da clínica. Diferente de integrações oficiais (API Business), utilizamos uma solução "Híbrida" com um servidor Node.js rodando **Baileys** (cliente WhatsApp Web socket) para conectar números pessoais/comuns, integrando com o **Supabase** para persistência e **Next.js** para interface.

## 2. Arquitetura do Sistema

### Componentes
1.  **Frontend (Next.js)**: Painel do usuário, Chat Window, Listagem de Conversas.
2.  **Backend (Supabase)**: Banco de dados (PostgreSQL), Auth, e **Realtime** (Websockets para atualizações na UI).
3.  **WhatsApp Microservice (Node.js/Baileys)**: Servidor customizado rodando em `backend/whatsapp/server.js`. Responsável pela conexão com os servidores do WhatsApp.

### Fluxo de Dados
*   **Next.js** <--> **Supabase**: Leitura de histórico, escuta de eventos Realtime (novas mensagens).
*   **Next.js** --> **WhatsApp Service (HTTP)**: Envio de mensagens (`POST /send`).
*   **WhatsApp Service** <--> **WhatsApp Servers**: Protocolo Noise/Socket (Baileys).
*   **WhatsApp Service** --> **Supabase**: Gravação de mensagens enviadas e recebidas.

---

## 3. Lógica Crítica (Importante para Manutenção)

### 3.1. Envio de Mensagens e UX (Optimistic UI)
Para garantir uma experiência "instantânea" (Realtime), o frontend não espera a confirmação do servidor.
*   **Hook:** `hooks/use-realtime-messages.ts`
*   **Ação:** Ao chamar `sendMessage`, adicionamos a mensagem imediatamente ao estado local (`setMessages`) com um ID temporário e `is_optimistic: true`.
*   **Confirmação:** O backend processa o envio, salva no banco, e o Supabase dispara um evento `INSERT`. O hook recebe esse evento e atualiza a lista (o sistema de deduplicação cuida de evitar duplicatas visuais se necessário, ou a lista apenas se atualiza).

### 3.2. Servidor WhatsApp (`server.js`)
O coração da integração. Possui lógicas de defesa robustas implementadas recentemente:

#### A. "Smart Patient Lookup" (Anti-Duplicidade de Contatos)
O WhatsApp pode enviar números com prefixo `55` (Brasil) ou sem, dependendo de como o contato foi salvo ou iniciado.
*   **Problema Anterior:** O sistema criava dois pacientes ("55859..." e "859...") para a mesma pessoa, fragmentando o chat.
*   **Lógica Atual:**
    1.  Tenta encontrar o paciente pelo `remoteJid` exato (apenas números).
    2.  Se falhar e o número começar com `55` (e tiver 12+ dígitos), remove o `55` e tenta buscar novamente.
    3.  Só cria um novo paciente se ambas as tentativas falharem.

#### B. Extração de Conteúdo (Parsing Robusto)
Mensagens do WhatsApp possuem estruturas JSON complexas e aninhadas (ex: `ephemeralMessage`, `viewOnceMessage`).
*   **Lógica Atual:** O `server.js` verifica múltiplos caminhos para extrair o texto, evitando que a mensagem apareça como "[Mídia/Outro Tipo]" ou vazia.
    *   Verifica: `conversation`, `extendedTextMessage.text`, `imageMessage.caption`.
    *   Verifica (Nível 2): `ephemeralMessage.message.conversation`, etc.

#### C. Tratamento de Mensagens Próprias (`messages.upsert`)
O Baileys emite eventos `upsert` tanto para mensagens recebidas (`notify`) quanto para enviadas/sincronizadas (`append`).
*   **Ajuste:** O listener `sock.ev.on('messages.upsert')` foi configurado para aceitar **todos** os tipos, garantindo que mensagens enviadas pelo celular (fora do painel) ou pelo painel sejam capturadas e salvas no CRM.

---

## 4. Estrutura de Banco de Dados (Supabase)

### Tabelas Principais
*   **`clinics`**: Entidade raiz.
*   **`patients`**: Contatos/Leads. Campo `phone` é a chave principal de busca para o WhatsApp. Campo `tags` usado para marcar grupos.
*   **`conversations`**: Liga `clinic_id` e `patient_id`. Garante unicidade de conversa por paciente.
*   **`messages`**: Armazena o histórico.
    *   `content`: Texto da mensagem.
    *   `sender_type`: 'patient' ou 'attendant'.
    *   `message_id`: ID externo do WhatsApp (para evitar duplicidade).

## 5. Como Rodar/Debugar

### Backend WhatsApp
O servidor não roda automaticamente com o Next.js. Deve ser iniciado em separado:
```bash
# Terminal 1 (Raiz)
$env:PORT=3001; node backend/whatsapp/server.js
```
*   Escuta na porta **3001**.
*   Console exibe logs detalhados de `Upsert` e estrutura JSON de mensagens recebidas (modo debug ativado).

### Frontend
```bash
# Terminal 2 (Raiz)
pnpm dev
```
*   Escuta na porta **3000**.

## 6. Próximos Passos Sugeridos
*   **Mídia:** Atualmente o suporte a mídia (imagens/áudio) é básico (extração de caption). Implementar upload/download de arquivos no Storage do Supabase.
*   **Multi-sessão:** O código possui estrutura para `auth_info_baileys`, mas para suportar múltiplas clínicas simultâneas, seria necessário isolar as sessões por pasta ou banco de dados.
