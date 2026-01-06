const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente faltando.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedLeads() {
  console.log('Inserindo leads de teste...');

  // Buscar ID da clínica
  const { data: clinic } = await supabase.from('clinics').select('id').single();
  
  if (!clinic) {
    console.error('Nenhuma clínica encontrada. Criando uma...');
    const { data: newClinic } = await supabase.from('clinics')
      .insert({ name: 'Clínica Sorriso' })
      .select()
      .single();
    clinic = newClinic;
  }

  const testLeads = [
    { name: 'Maria Silva', phone: '11999999999', channel: 'whatsapp', lead_status: 'new', clinic_id: clinic.id },
    { name: 'João Santos', phone: '11988888888', channel: 'instagram', lead_status: 'contacted', clinic_id: clinic.id },
    { name: 'Ana Costa', phone: '11977777777', channel: 'facebook', lead_status: 'qualified', clinic_id: clinic.id },
    { name: 'Pedro Oliveira', phone: '11966666666', channel: 'website', lead_status: 'scheduled', clinic_id: clinic.id },
    { name: 'Carla Mendes', phone: '11955555555', channel: 'whatsapp', lead_status: 'converted', clinic_id: clinic.id },
    { name: 'Bruno Alves', phone: '11944444444', channel: 'instagram', lead_status: 'new', clinic_id: clinic.id },
    { name: 'Juliana Lima', phone: '11933333333', channel: 'whatsapp', lead_status: 'contacted', clinic_id: clinic.id },
    { name: 'Roberto Dias', phone: '11922222222', channel: 'facebook', lead_status: 'qualified', clinic_id: clinic.id },
  ];

  const { data, error } = await supabase
    .from('patients')
    .insert(testLeads)
    .select();

  if (error) {
    console.error('Erro ao inserir leads:', error.message);
  } else {
    console.log(`✅ ${data.length} leads de teste criados com sucesso!`);
  }
}

seedLeads();
