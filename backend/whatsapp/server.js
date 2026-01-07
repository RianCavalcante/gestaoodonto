// Tenta carregar .env.local (padrão Next.js) de diferentes locais
const path = require('path');
const fs = require('fs');

// Se estiver rodando da raiz do projeto
if (fs.existsSync('.env.local')) {
    require('dotenv').config({ path: '.env.local' });
} else {
    // Se estiver rodando de dentro de backend/whatsapp e o arquivo estiver na raiz (../../.env.local)
    require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
}
require('dotenv').config(); // Fallback para .env padrão
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    isJidBroadcast,
    downloadMediaMessage
} = require('@whiskeysockets/baileys');
const mime = require('mime-types');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const qrcode = require('qrcode');
const pino = require('pino');

// Configuração do App
const app = express();
app.use(cors());
app.use(express.json());

// Endpoint para marcar conversa como lida (Bypass RLS)
app.post('/read', async (req, res) => {
    const { conversationId } = req.body;
    if (!conversationId) return res.status(400).json({ error: 'Conversation ID required' });

    try {
        const { error } = await supabase
            .from('conversations')
            .update({ unread_count: 0 })
            .eq('id', conversationId);

        if (error) throw error;
        
        console.log(`Conversa ${conversationId} marcada como lida (pelo servidor)`);
        res.json({ success: true });
    } catch (e) {
        console.error('Erro ao marcar conversa como lida:', e);
        res.status(500).json({ error: e.message });
    }
});

// Endpoint para forçar atualização de foto de perfil
app.post('/sync-avatar', async (req, res) => {
    const { phone } = req.body;
    if (!phone || !sock) return res.status(400).json({ error: 'Telefone e Conexão necessários' });

    try {
        const jid = phone + '@s.whatsapp.net';
        console.log(`Buscando foto para ${jid}...`);
        
        const pptUrl = await sock.profilePictureUrl(jid, 'image'); // 'image' = HD usually
        
        if (pptUrl) {
            const { error } = await supabase
                .from('patients')
                .update({ avatar_url: pptUrl })
                .eq('phone', phone);
            
            if (error) throw error;
            console.log(`Foto atualizada com sucesso para ${phone}`);
            return res.json({ success: true, url: pptUrl });
        } else {
            return res.json({ success: false, message: 'Foto não encontrada ou privada' });
        }
    } catch (e) {
        console.error('Erro ao buscar foto:', e);
        // Supabase error or Baileys error (404/401)
        res.status(500).json({ error: e.message });
    }
});

// Configuração do Servidor e Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Configuração Supabase
// Configuração Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Estado Global
let sock;
let qrCodeData = null;
let connectionStatus = 'disconnected'; // disconnected, identifying, connected
let retryCount = 0;

// Store para mensagens e chats em memória (opcional, ajuda em alguns casos)
// const store = makeInMemoryStore({ logger: pino({ level: "silent" }) });
// store.readFromFile("./baileys_store_multi.json");
// setInterval(() => {
//    store.writeToFile("./baileys_store_multi.json");
// }, 10000);

// Função para iniciar o cliente Baileys
async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

    sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: true, // Útil para debug no terminal
        auth: state,
        // Ignora mensagens de broadcast/status na store se quiser
        shouldIgnoreJid: jid => isJidBroadcast(jid),
        // Configurações adicionais para estabilidade
        browser: ["GestaoOdonto", "Chrome", "10.0.0"],
        syncFullHistory: false, // Começa mais rápido
    });

    // store.bind(sock.ev);

    // Manipulador de Conexão
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('QR Code recebido (string para conversão)');
            qrCodeData = qr; // Baileys envia a string crua
            connectionStatus = 'qr_ready'; // Atualizado para manter consistência com o frontend
            
            // Emitir para frontend via Socket.IO
            io.emit('whatsapp_qr', qr);
            io.emit('whatsapp_status', 'qr_ready');
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log('Conexão fechada. Status:', statusCode, 'Erro:', lastDisconnect.error);
            
            // Auto-Recovery para Sessão Inválida ou 401
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                console.log('Sessão inválida/desconectada no celular. Iniciando Auto-Recovery...');
                
                connectionStatus = 'disconnected';
                qrCodeData = null;
                io.emit('whatsapp_status', 'disconnected');
                
                // Apagar pasta de sessão corrompida/antiga
                try {
                    const sessionPath = path.resolve(__dirname, 'auth_info_baileys');
                    if (fs.existsSync(sessionPath)) {
                        fs.rmSync(sessionPath, { recursive: true, force: true });
                        console.log('Pasta de sessão (auth_info_baileys) apagada com sucesso.');
                    }
                } catch (err) {
                    console.error('Erro ao apagar pasta de sessão:', err);
                }

                // Reiniciar imediatamente para gerar novo QR Code
                console.log('Reiniciando serviço para gerar novo QR Code...');
                startWhatsApp();
                
            } else if (shouldReconnect) {
                connectionStatus = 'reconnecting';
                startWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Conexão aberta/autenticada!');
            connectionStatus = 'connected';
            qrCodeData = null;
            retryCount = 0;
            io.emit('whatsapp_status', 'connected');
        }
    });

    // Salvar credenciais quando atualizadas
    sock.ev.on('creds.update', saveCreds);

    // Manipulador de Mensagens (UPSERT - chega nova ou update)
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        // Ao enviar mensagem própria, o tipo pode ser 'append'
        // 'notify' é para mensagens que geram notificação (recebidas)
        // Vamos processar todas para garantir que salvamos as enviadas também
        console.log(`Upsert recebido. Tipo: ${type}, Qtd: ${messages.length}`);
        
        for (const msg of messages) {
            await processMessage(msg);
        }
    });
}

// Helper para Download e Upload de Mídia
async function downloadAndUploadMedia(msg, type) {
    try {
        console.log(`Baixando mídia do tipo: ${type}...`);
        
        // Ensure msg has the correct structure for Baileys
        // Baileys 'downloadMediaMessage' expects { message: { [type]: mediaContent } } or similar
        console.log('Objeto MSG passado para download:', JSON.stringify(msg, null, 2));

        // Create a compliant message object if needed
        // If msg is already { message: { imageMessage: ... } }, use it.
        // If msg is just { imageMessage: ... }, wrap it.
        let msgToDownload = msg;
        if (!msg.message) {
             msgToDownload = { message: msg.message || msg }; 
        }
        
        // Pior caso: tenta passar direto
        console.log('Tentando download com msgToDownload...');

        // Download do buffer via Baileys
        let buffer;
        try {
            buffer = await downloadMediaMessage(
                msgToDownload,
                'buffer',
                { },
                { logger: pino({ level: 'silent' }) }
            ).catch(err => {
                console.error('Erro interno Baileys download:', err);
                throw err;
            });
        } catch(dErr) {
             console.error("Falha no downloadMediaMessage. Tentando wrapper alternativo...");
             // Tentar reconstruir wrapper se falhou
             const keys = Object.keys(msg);
             if (keys.length > 0 && !msg.message) {
                 const newFake = { message: { [type]: msg[type] || msg } };
                 console.log("Tentando wrapper reconstruído:", JSON.stringify(newFake));
                 buffer = await downloadMediaMessage(
                    newFake,
                    'buffer',
                    { },
                    { logger: pino({ level: 'silent' }) }
                 );
             } else {
                 throw dErr;
             }
        }

        if (!buffer) throw new Error('Falha ao baixar buffer de mídia');
        console.log(`Buffer baixado! Tamanho: ${buffer.length} bytes`);

        // Identificar extensão e mime
        let extension = 'bin';
        let mimeType = 'application/octet-stream';

        if (type === 'imageMessage') {
            const mContent = msg.message?.imageMessage || msg.imageMessage || msg;
            mimeType = mContent.mimetype || 'image/jpeg';
            extension = mime.extension(mimeType) || 'jpg';
        } else if (type === 'audioMessage') {
            const mContent = msg.message?.audioMessage || msg.audioMessage || msg;
            mimeType = mContent.mimetype || 'audio/ogg'; 
            extension = mime.extension(mimeType) || 'ogg';
        } else if (type === 'documentMessage') {
            const mContent = msg.message?.documentMessage || msg.documentMessage || msg;
            mimeType = mContent.mimetype || 'application/pdf';
            extension = mime.extension(mimeType) || 'pdf';
            const originalName = mContent.title || mContent.fileName;
            if (originalName) {
                const sanitized = originalName.replace(/[^a-z0-9.]/gi, '_');
                extension = sanitized.split('.').pop(); 
            }
        } else if (type === 'videoMessage') {
            const mContent = msg.message?.videoMessage || msg.videoMessage || msg;
            mimeType = mContent.mimetype || 'video/mp4';
            extension = mime.extension(mimeType) || 'mp4';
        }

        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
        const filePath = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

        console.log(`Fazendo upload para chat-media/${filePath}... (Mime: ${mimeType})`);

        const { data, error } = await supabase
            .storage
            .from('chat-media')
            .upload(filePath, buffer, {
                contentType: mimeType,
                upsert: false
            });

        if (error) {
            console.error('Erro no upload Supabase:', error);
            return null;
        }

        // Get Public URL
        const { data: publicData } = supabase.storage.from('chat-media').getPublicUrl(filePath);
        console.log("Upload OK. URL:", publicData.publicUrl);
        return publicData.publicUrl;

    } catch (e) {
        console.error('Erro ao processar mídia:', e);
        return null; // Retorna null para salvar sem URL em vez de crashar
    }
}

// Processamento de Mensagem (Salvar no Supabase)
// Helper de log em arquivo
const logDebug = (msg) => {
    const logPath = path.join(__dirname, 'debug_whatsapp.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
};

// Processamento de Mensagem (Salvar no Supabase)
async function processMessage(msg) {
    // Log da nova mensagem
    logDebug(`Processando mensagem: JID: ${msg.key.remoteJid}, FromMe: ${msg.key.fromMe}`);
    
    if (!msg.message) {
        logDebug('-> Mensagem vazia/protocolo. Ignorando.');
        return; 
    }

    // Ignorar status/broadcasts
    if (msg.key.remoteJid === 'status@broadcast') return;

    // Debug: Logar estrutura
    console.log('--- DEBUG MSG START ---');
    console.log(JSON.stringify(msg, null, 2));
    console.log('--- DEBUG MSG END ---');

    // Ignorar grupos
    if (msg.key.remoteJid.endsWith('@g.us')) {
        logDebug(`-> Ignorando grupo: ${msg.key.remoteJid}`);
        return;
    }

    // Ignorar LIDs (IDs internos do WhatsApp que causam duplicidade de conta com número errado)
    if (msg.key.remoteJid.includes('@lid')) {
        logDebug(`-> LID detectado: ${msg.key.remoteJid} - Tentando processar...`);
        // return; 
    }

    // Helper to unwrap message (handle ephemeral, viewOnce, etc)
    const getMessageContent = (m) => {
        if (!m) return null;
        if (m.ephemeralMessage) return getMessageContent(m.ephemeralMessage.message);
        if (m.viewOnceMessage) return getMessageContent(m.viewOnceMessage.message);
        if (m.viewOnceMessageV2) return getMessageContent(m.viewOnceMessageV2.message);
        if (m.documentWithCaptionMessage) return getMessageContent(m.documentWithCaptionMessage.message);
        return m;
    };

    const realMessage = getMessageContent(msg.message);
    const msgType = Object.keys(realMessage || {})[0];

    let messageContent = '';
    let mediaUrl = null;
    let messageType = 'text';

    console.log('Real Message Type identified:', msgType);
    
    if (!realMessage) {
        console.log('Mensagem vazia/desconhecida:', JSON.stringify(msg.message));
        return;
    }

    if (msgType === 'conversation') {
        messageContent = realMessage.conversation;
    } else if (msgType === 'extendedTextMessage') {
        messageContent = realMessage.extendedTextMessage.text;
    } else if (msgType === 'imageMessage') {
        messageType = 'image';
        messageContent = realMessage.imageMessage.caption || '[Imagem]';
        const fakeMsg = { message: realMessage };
        mediaUrl = await downloadAndUploadMedia(fakeMsg, 'imageMessage');

    } else if (msgType === 'audioMessage') {
        messageType = 'audio';
        messageContent = '[Áudio]';
        const fakeMsg = { message: realMessage };
        mediaUrl = await downloadAndUploadMedia(fakeMsg, 'audioMessage');

    } else if (msgType === 'videoMessage') {
        messageType = 'video';
        messageContent = realMessage.videoMessage.caption || '[Vídeo]';
        const fakeMsg = { message: realMessage };
        mediaUrl = await downloadAndUploadMedia(fakeMsg, 'videoMessage');

    } else if (msgType === 'documentMessage') {
        messageType = 'document';
        messageContent = realMessage.documentMessage.title || realMessage.documentMessage.fileName || '[Documento]';
        const fakeMsg = { message: realMessage };
        mediaUrl = await downloadAndUploadMedia(fakeMsg, 'documentMessage');

    } else if (msgType === 'protocolMessage') {
         return; // Ignorar
    } else {
         // Fallback
         messageContent = 
            realMessage.conversation ||
            realMessage.extendedTextMessage?.text ||
            JSON.stringify(realMessage).substring(0, 50) + '...'; 
         
         if (!messageContent || messageContent === '{}') messageContent = '[Mídia/Outro Tipo]';
    }

    if (!messageContent && !mediaUrl) {
        console.log('Mensagem vazia ignorada:', JSON.stringify(realMessage));
        return;
    }

    // Identificação Inteligente do Remetente (Smart Resolution)
    // O objetivo é encontrar o JID que representa o NÚMERO DE TELEFONE (sufixo @s.whatsapp.net).
    // Dependendo do modo (LID vs PN) e do dispositivo (Mobile vs Desktop), o número real pode estar em lugares diferentes.
    
    const candidates = [
        msg.key.remoteJid,
        msg.key.remoteJidAlt,
        msg.key.participant,
        msg.key.participantAlt
    ];

    // Busca o primeiro candidato que seja um JID de usuário padrão (@s.whatsapp.net)
    // Ignora LIDs (@lid) e Broadcasts (@g.us) se houver opção melhor.
    let targetJid = candidates.find(jid => jid && jid.includes('@s.whatsapp.net'));

    // Se não achar nenhum padrão, usa o remoteJid normal (caso de grupos ou broadcast sem alt)
    if (!targetJid) {
        targetJid = msg.key.remoteJid;
    }

    let senderNumber = targetJid.replace(/\D/g, ''); 
    
    // Fallback de segurança (Store Lookup) - Só roda se o resultado final ainda parecer um LID
    if (senderNumber.length > 14) {
        console.log(`Ainda parece um LID (${senderNumber}). Tentando Store...`);
        try {
            const lidMatch = Object.values(store.contacts).find(c => 
                c.lid && c.lid.includes(senderNumber)
            );
            
            if (lidMatch && lidMatch.id) {
                 const realPhone = lidMatch.id.replace(/\D/g, '');
                 console.log(`-> Store Salvou! Convertido p/ ${realPhone}`);
                 senderNumber = realPhone;
            }
        } catch (err) {
            console.error('Erro Store:', err);
        }
    }

    const isFromMe = msg.key.fromMe;
    
    // Nome do remetente (tenta pegar do pushName)
    const senderName = msg.pushName || (isFromMe ? "Eu" : senderNumber);

    console.log('----------------------------------------');
    console.log('MENSAGEM RECEBIDA (BAILEYS):', messageType, mediaUrl ? '(Com Mídia)' : '');
    console.log('CANDIDATOS JID:', candidates.filter(c => c).join(', '));
    console.log('JID ESCOLHIDO:', targetJid);
    console.log('SENDER FINAL:', senderName, `(${senderNumber})`);
    console.log('MINHA?:', isFromMe);

    try {
        // Buscar clinic_id real (pega o primeiro encontrado)
        const { data: clinicData } = await supabase.from('clinics').select('id').limit(1).single();
        const clinic_id = clinicData?.id; 

        if (!clinic_id) {
            console.error('ERRO CRÍTICO: Nenhuma clínica encontrada no banco de dados.');
            return;
        }

        let patient_id = null;

        // Helper para normalizar telefone (BRASIL)
        // O usuário informou que o padrão é sem o 9 (12 dígitos totais: 55 + DD + 8 digitos).
        // Se vier com 13 (9 dígitos), removemos o 9 para padronizar e evitar duplicatas.
        const normalizePhone = (rawPhone) => {
             let phone = rawPhone.replace(/\D/g, '');
             
             // Regra Brasil (55)
             if (phone.startsWith('55')) {
                 // DDI (2) + DDD (2) + 9 + 8 digitos = 13 digitos
                 if (phone.length === 13) {
                     // Remove o nono dígito (índice 4, pois começa em 0: 5,5,D,D,9...)
                     return phone.substring(0, 4) + phone.substring(5);
                 }
             }
             return phone;
        };

        const findPatientByPhone = async (rawPhone) => {
            const normalized = normalizePhone(rawPhone);
            const variations = new Set([normalized, rawPhone]);

            // Se for BR, tenta buscar TAMBÉM com o 9 (caso tenha sido salvo errado antes) para garantir merge
            if (normalized.startsWith('55') && normalized.length === 12) {
                 const with9 = normalized.substring(0, 4) + '9' + normalized.substring(4);
                 variations.add(with9);
            }

            const phoneOptions = Array.from(variations);
            console.log(`Buscando paciente (Normalizado: ${normalized}) variações: ${phoneOptions.join(', ')}`);

            const { data } = await supabase
                .from('patients')
                .select('id, avatar_url, phone')
                .in('phone', phoneOptions)
                .maybeSingle();

            return data;
        };
        
        // Padroniza o numero do remetente ANTES de tudo
        const normalizedSenderNumber = normalizePhone(senderNumber);

        if (!isFromMe) {
            let patient = await findPatientByPhone(senderNumber);

            // Fallback: Se não achou pelo número e é um ID estranho (LID) e temos nome:
            if (!patient && senderName && senderName !== senderNumber) {
                 console.log(`Paciente não achado por fone. Tentando match por nome (insensível): "${senderName}"`);
                 
                 // DEBUG: Logar estrutura completa para achar o número real se possível
                 console.log('--- MSG STRUCTURE DEBUG ---');
                 console.dir(msg, { depth: null });
                 console.log('---------------------------');

                 const { data: nameMatch } = await supabase
                     .from('patients')
                     .select('id, avatar_url, phone')
                     .ilike('name', senderName) // Case insensitive
                     .order('created_at', { ascending: false }) // Pega o mais recente
                     .limit(1)
                     .maybeSingle();
                 
                 if (nameMatch) {
                     console.log(`Match de paciente por NOME encontrado! Associando LID ${senderNumber} ao paciente ${nameMatch.phone}`);
                     patient = nameMatch;
                 } else {
                     console.log(`Nenhum paciente encontrado com o nome "${senderName}"`);
                 }
            }
            
            if (!patient) {
                console.log('Paciente (Sender) não encontrado, criando...', senderName);
                
                // Tenta pegar foto antes de criar
                let initialAvatar = null;
                try {
                    initialAvatar = await sock.profilePictureUrl(msg.key.remoteJid, 'image');
                } catch (e) {}

                const { data: newPatient, error: createError } = await supabase
                    .from('patients')
                    .insert([{
                        name: senderName,
                        phone: normalizedSenderNumber, // SALVA NORMALIZADO (sem 9 se for BR)
                        clinic_id: clinic_id,
                        channel: 'whatsapp',
                        lead_status: 'new',
                        avatar_url: initialAvatar
                    }])
                    .select()
                    .single();
                
                if (createError) {
                    console.error("Erro ao criar paciente:", createError);
                    // Tenta buscar de novo em caso de race condition
                    patient = await findPatientByPhone(senderNumber);
                } else {
                    patient = newPatient;
                }
            } else if (!patient.avatar_url) {
                // Se já existe mas está sem foto, tenta buscar
                try {
                    const pptUrl = await sock.profilePictureUrl(msg.key.remoteJid, 'image');
                    if (pptUrl) {
                        await supabase.from('patients').update({ avatar_url: pptUrl }).eq('id', patient.id);
                    }
                } catch (e) {} 
            }
            patient_id = patient?.id;
        } else {
            // Se for mensagem minha, preciso descobrir para QUEM mandei
            // O remoteJid é o destinatário quando envio
            const destNumber = msg.key.remoteJid.replace(/\D/g, '');
            
            // 1. Tenta match exato
            let { data: patient } = await supabase
                .from('patients')
                .select('id')
                .eq('phone', destNumber)
                .maybeSingle();
            
            // 2. Se não achou e é número BR (começa com 55), tenta sem o 55
            if (!patient && destNumber.startsWith('55') && destNumber.length >= 12) {
                 const phoneNoDDI = destNumber.substring(2);
                 const { data: p2 } = await supabase
                    .from('patients')
                    .select('id')
                    .eq('phone', phoneNoDDI)
                    .maybeSingle();
                 if (p2) {
                     console.log(`Paciente encontrado sem DDI: ${phoneNoDDI}`);
                     patient = p2;
                 }
            }

            if (patient) {
                patient_id = patient.id;
            } else {
                 console.log('Paciente (Dest) não encontrado para msg enviada, criando...', destNumber);
                 const { data: newPatient, error: createError } = await supabase
                    .from('patients')
                    .insert([{
                        name: destNumber, // Nome provisório = numero
                        phone: destNumber,
                        clinic_id: clinic_id,
                        channel: 'whatsapp',
                        lead_status: 'new'
                    }])
                    .select()
                    .single();

                 if (createError) {
                     console.error("Erro ao criar paciente no envio:", createError);
                 } else {
                     patient_id = newPatient.id;
                 }
            }
        }

        // 2. Buscar ou Criar Conversa
        if (!patient_id) {
            console.log('ERRO: Não foi possível identificar o paciente para esta mensagem.', msg.key);
            // Se for envio meu e não achar paciente, ignora por enquanto para não dar erro
            return; 
        }

        let { data: conversation } = await supabase
            .from('conversations')
            .select('id, unread_count')
            .eq('patient_id', patient_id)
            .eq('channel', 'whatsapp')
            .maybeSingle();

        if (!conversation) {
            const { data: newConv } = await supabase
                .from('conversations')
                .insert([{
                    clinic_id: clinic_id,
                    patient_id: patient_id,
                    channel: 'whatsapp',
                    last_message_at: new Date().toISOString(),
                    unread_count: isFromMe ? 0 : 1, // Se eu mandei, não é não lida
                    is_active: true
                }])
                .select()
                .single();
            conversation = newConv;
        } else {
            // Atualizar conversa
            // Atualizar conversa com preview
            await supabase
                .from('conversations')
                .update({
                    last_message_at: new Date().toISOString(),
                    unread_count: isFromMe ? conversation.unread_count : (conversation.unread_count || 0) + 1,
                    last_message_content: messageContent, // Coluna nova para preview
                    last_message_type: messageType // Coluna nova para tipo (text, audio, image)
                })
                .eq('id', conversation.id)
                .select(); // Select para retornar o erro se a coluna não existir catch abaixo pegará
                
        }

        // 3. OTIMIZAÇÃO PERFORMANCE (OPTIMISTIC INSERT)
        // Inserir no banco IMEDIATAMENTE antes de processar mídia pesada.
        // Isso garante que o usuário veja "Digitando..." ou o audio carregando instantaneamente.

        let initialContent = messageContent;
        let isMedia = false;
        let mediaType = 'text';

        // Detectar se é mídia para preparar o placeholder
        if (msg.message?.imageMessage) { isMedia = true; mediaType = 'image'; }
        else if (msg.message?.audioMessage) { isMedia = true; mediaType = 'audio'; }
        else if (msg.message?.videoMessage) { isMedia = true; mediaType = 'video'; }
        else if (msg.message?.documentMessage || msg.message?.documentWithCaptionMessage) { isMedia = true; mediaType = 'document'; }
        
        // Se for mídia, salva um placeholder inicial
        if (isMedia) {
             initialContent = JSON.stringify({
                type: mediaType,
                url: null, // Ainda não temos
                text: messageContent || "[Mídia]", 
                isMedia: true,
                status: "uploading" // Flag para frontend saber que está baixando
             });
        }

        // Inserção Otimista
        const { data: savedMessage, error: saveError } = await supabase
            .from('messages')
            .insert([{
                conversation_id: conversation.id,
                sender_type: isFromMe ? 'attendant' : 'patient',
                sender_id: isFromMe ? null : patient_id, 
                content: initialContent,
                type: 'text', // Mantemos text para compatibilidade, o JSON resolve
                status: isFromMe ? 'sent' : 'delivered',
                created_at: new Date(msg.messageTimestamp * 1000).toISOString()
            }])
            .select()
            .single();

        if (saveError) {
            console.error('Erro ao salvar mensagem otimista:', saveError);
            return;
        }

        console.log(`✅ Mensagem salva (Otimista): ${savedMessage.id} - ${mediaType}`);
        
        // Emitir evento Socket.IO para atualização em tempo real
        io.emit('new_message', savedMessage);
        
    } catch (err) {
        console.error('Erro ao processar mensagem Baileys:', JSON.stringify(err, null, 2));
    }
}


// --- Rotas API ---

app.get('/status', (req, res) => {
    res.json({ status: connectionStatus, qr: qrCodeData });
});

app.post('/init', async (req, res) => {
    if (connectionStatus === 'connected') {
        return res.json({ status: 'connected', message: 'Já conectado' });
    }
    await startWhatsApp();
    res.json({ status: 'initializing', message: 'Iniciando Baileys...' });
});

app.post('/logout', async (req, res) => {
    try {
        if (sock) {
            await sock.logout(); // Limpa estado no servidor whatsapp
            sock.end(undefined); // Encerra conexão socket
            sock = null; // Limpa referência
        }
        
        // Limpar estado
        qrCodeData = null;
        connectionStatus = 'disconnected';
        
        // Notificar frontend
        io.emit('whatsapp_status', 'disconnected');
        io.emit('whatsapp_qr', null);
        
        // Reiniciar WhatsApp para gerar novo QR
        setTimeout(() => {
            console.log('Reiniciando WhatsApp após logout...');
            startWhatsApp();
        }, 2000);
        
        res.json({ success: true, message: 'Desconectado. Gerando novo QR Code...' });
    } catch (e) {
        console.error('Erro no logout:', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/send', async (req, res) => {
    const { phone, message } = req.body;
    if (!sock || connectionStatus !== 'connected') {
        return res.status(400).json({ error: 'WhatsApp não conectado' });
    }

    try {
        // Normalização simples para BR (se tiver 10 ou 11 digitos e nao comecar com 55, adiciona)
        let targetPhone = phone.replace(/\D/g, '');
        if ((targetPhone.length === 10 || targetPhone.length === 11) && !targetPhone.startsWith('55')) {
             targetPhone = '55' + targetPhone;
        }

        console.log(`Enviando mensagem para: ${targetPhone}`);

        const jid = targetPhone + '@s.whatsapp.net';
        await sock.sendMessage(jid, { text: message });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
});

// Socket.IO
io.on('connection', (socket) => {
    console.log('Frontend conectado ao Socket.IO');
    socket.emit('whatsapp_status', connectionStatus);
    if (qrCodeData) {
        socket.emit('whatsapp_qr', qrCodeData);
    }
});

// Iniciar Servidor (Apenas Express, o Baileys inicia sob demanda no /init)
// OU iniciar Baileys automaticamente se já tiver sessão salva?
// Melhor esperar /init para controle
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Baileys WhatsApp Server running on port ${PORT}`);
    // Tenta reconectar automaticamente se tiver sessão
    startWhatsApp().catch(e => console.log('Nenhuma sessão salva ou erro ao auto-iniciar:', e.message));
});
