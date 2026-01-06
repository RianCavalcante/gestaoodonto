import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente Supabase (usando service role para acesso total no backend)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

let qrCodeData: string | null = null;
let clientStatus: 'disconnected' | 'initializing' | 'ready' = 'disconnected';
let whatsappClient: Client | null = null;

export const getStatus = () => ({
  status: clientStatus,
  qrCode: qrCodeData,
});

export const initializeWhatsApp = async () => {
  if (whatsappClient) return;

  clientStatus = 'initializing';

  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
    }
  });

  whatsappClient.on('qr', async (qr) => {
    console.log('QR Code recebido!');
    try {
      qrCodeData = await qrcode.toDataURL(qr);
    } catch (err) {
      console.error('Erro ao gerar QR Code image:', err);
    }
  });

  whatsappClient.on('ready', () => {
    console.log('WhatsApp Client is ready!');
    clientStatus = 'ready';
    qrCodeData = null;
  });

  whatsappClient.on('authenticated', () => {
    console.log('WhatsApp Autenticado!');
  });

  whatsappClient.on('auth_failure', (msg) => {
    console.error('Falha na autenticação:', msg);
    clientStatus = 'disconnected';
  });

  whatsappClient.on('disconnected', (reason) => {
    console.log('WhatsApp desconectado:', reason);
    clientStatus = 'disconnected';
    whatsappClient = null;
  });

  // Escutar novas mensagens
  whatsappClient.on('message', async (message) => {
    try {
      console.log('Nova mensagem de', message.from, ':', message.body);
      
      // Buscar informações do chat para verificar se é grupo
      const chat = await message.getChat();
      
      // Ignorar mensagens de grupo e status por enquanto
      if (chat.isGroup || message.isStatus) return;

      const phone = message.from.replace('@c.us', '');
      
      // 1. Buscar ou criar paciente pelo telefone
      let { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('phone', phone)
        .single();
        
      if (!patient) {
        // Obter info do contato
        const contact = await message.getContact();
        const name = contact.pushname || contact.name || phone;
        const avatarUrl = await contact.getProfilePicUrl().catch(() => null);

        // Buscar ID da clínica padrão (ajuste conforme necessário)
        const { data: clinic } = await supabase.from('clinics').select('id').single();

        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert({
            clinic_id: clinic?.id,
            name: name,
            phone: phone,
            avatar_url: avatarUrl,
            channel: 'whatsapp',
            lead_status: 'new'
          })
          .select()
          .single();

        if (createError) throw createError;
        patient = newPatient;
      }

      // 2. Buscar ou criar conversa ativa
      let { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('patient_id', patient.id)
        .eq('channel', 'whatsapp')
        .eq('is_active', true)
        .single();

      if (!conversation) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            clinic_id: patient.clinic_id,
            patient_id: patient.id,
            channel: 'whatsapp',
            unread_count: 0,
            is_active: true
          })
          .select()
          .single();

        if (convError) throw convError;
        conversation = newConv;
      }

      // 3. Salvar mensagem
      let mediaUrl = null;
      let type = 'text';

      if (message.hasMedia) {
        // Implementar upload de mídia para Supabase Storage aqui
        // Por enquanto vamos apenas marcar como mídia
        type = message.type; 
      }

      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_type: 'patient',
        type: type as any,
        content: message.body,
        media_url: mediaUrl,
        status: 'received'
      });

      // Atualizar contador e last_message
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_count: (conversation.unread_count || 0) + 1
        })
        .eq('id', conversation.id);

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  });

  try {
    await whatsappClient.initialize();
  } catch (error) {
    console.error('Erro ao inicializar cliente:', error);
    clientStatus = 'disconnected';
    whatsappClient = null;
  }
};

export const sendMessage = async (phone: string, content: string) => {
  if (!whatsappClient || clientStatus !== 'ready') {
    throw new Error('WhatsApp não está conectado');
  }
  
  const chatId = `${phone}@c.us`;
  await whatsappClient.sendMessage(chatId, content);
};

export const logoutWhatsApp = async () => {
    if (whatsappClient) {
        await whatsappClient.logout();
        await whatsappClient.destroy();
        whatsappClient = null;
        clientStatus = 'disconnected';
        qrCodeData = null;
    }
}
