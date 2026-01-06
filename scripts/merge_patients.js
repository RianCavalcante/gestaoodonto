const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function mergePatients() {
    const badPhone = '201499128893603';
    const goodPhone = '558591872205';

    console.log(`Iniciando fusão de ${badPhone} para ${goodPhone}...`);

    // 1. Get IDs
    const { data: badPatient } = await supabase.from('patients').select('id').eq('phone', badPhone).single();
    const { data: goodPatient } = await supabase.from('patients').select('id').eq('phone', goodPhone).single();

    if (!badPatient || !goodPatient) {
        console.error("Não encontrei um dos pacientes. Verifique os números.");
        console.log("Bad:", badPatient);
        console.log("Good:", goodPatient);
        return;
    }

    console.log(`Bad ID: ${badPatient.id}`);
    console.log(`Good ID: ${goodPatient.id}`);

    // 2. Move Conversations
    console.log("Movendo conversas...");
    const { error: convError } = await supabase
        .from('conversations')
        .update({ patient_id: goodPatient.id })
        .eq('patient_id', badPatient.id);
    
    if (convError) {
        // Se der erro de duplicate key (já tem conversa pro Good), temos que deletar a do Bad e mover só as mensagens?
        // Sim, conversations tem unique(clinic_id, patient_id) provavelmente.
        console.log("Erro ao mover conversa (provável duplicidade):", convError.message);
        console.log("Tentando fusão manual de mensagens...");

        // Pegar ID da conversa ruim
        const { data: badConv } = await supabase.from('conversations').select('id').eq('patient_id', badPatient.id).single();
        // Pegar ID da conversa boa
        const { data: goodConv } = await supabase.from('conversations').select('id').eq('patient_id', goodPatient.id).single();

        if (badConv && goodConv) {
            // Mover mensagens da ruim pra boa
            const { error: msgError } = await supabase
                .from('messages')
                .update({ conversation_id: goodConv.id })
                .eq('conversation_id', badConv.id);
            
            if (msgError) console.error("Erro ao mover mensagens:", msgError);
            else console.log("Mensagens movidas com sucesso.");

            // Deletar conversa ruim
            await supabase.from('conversations').delete().eq('id', badConv.id);
            console.log("Conversa antiga removida.");
        }
    } else {
        console.log("Conversas atualizadas direto.");
    }

    // 3. Delete Bad Patient
    console.log("Removendo paciente incorreto...");
    const { error: delError } = await supabase.from('patients').delete().eq('id', badPatient.id);
    
    if (delError) console.error("Erro ao deletar paciente:", delError);
    else console.log("Paciente duplicado removido com sucesso!");
}

mergePatients();
