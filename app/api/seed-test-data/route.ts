import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST() {
  const supabase = createClient();

  try {
    // Buscar clínica
    const { data: clinic } = await supabase.from('clinics').select('id').single();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Nenhuma clínica encontrada' }, { status: 400 });
    }

    const testLeads = [
      { name: 'Maria Silva', phone: '11999999999', channel: 'whatsapp', lead_status: 'new', clinic_id: clinic.id },
      { name: 'João Santos', phone: '11988888888', channel: 'instagram', lead_status: 'contacted', clinic_id: clinic.id },
      { name: 'Ana Costa', phone: '11977777777', channel: 'facebook', lead_status: 'qualified', clinic_id: clinic.id },
      { name: 'Pedro Oliveira', phone: '11966666666', channel: 'website', lead_status: 'new', clinic_id: clinic.id },
      { name: 'Carla Mendes', phone: '11955555555', channel: 'whatsapp', lead_status: 'converted', clinic_id: clinic.id },
      { name: 'Bruno Alves', phone: '11944444444', channel: 'instagram', lead_status: 'new', clinic_id: clinic.id },
      { name: 'Juliana Lima', phone: '11933333333', channel: 'whatsapp', lead_status: 'contacted', clinic_id: clinic.id },
      { name: 'Roberto Dias', phone: '11922222222', channel: 'facebook', lead_status: 'qualified', clinic_id: clinic.id },
    ];

    const { data, error } = await supabase
      .from('patients')
      .insert(testLeads)
      .select();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      count: data.length,
      message: `${data.length} leads de teste criados com sucesso!` 
    });
  } catch (error: any) {
    console.error('Erro ao criar leads de teste:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
