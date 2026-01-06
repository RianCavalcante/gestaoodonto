
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente faltando.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUser() {
  const email = 'admin@gestaoodonto.com';
  const password = '123'; // Senha simples para teste

  console.log(`Criando usuário ${email}...`);

  // 1. Criar usuário no Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    console.error('Erro ao criar usuário Auth:', authError.message);
    // Se já existe, vamos tentar pegar o ID
    if (authError.message.includes('already registered')) {
        console.log('Usuário já existe, tentando login...');
        return;
    }
    return;
  }

  const userId = authData.user.id;
  console.log('Usuário Auth criado! ID:', userId);

  // 2. Criar perfil na tabela public.profiles
  // Buscar ID da primeira clínica
  const { data: clinic } = await supabase.from('clinics').select('id').single();
  
  if (clinic) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        email: email,
        name: 'Administrador',
        role: 'admin',
        clinic_id: clinic.id
      });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError.message);
      } else {
        console.log('Perfil criado com sucesso!');
      }
  } else {
      console.error('Nenhuma clínica encontrada para vincular o perfil.');
  }
}

createUser();
