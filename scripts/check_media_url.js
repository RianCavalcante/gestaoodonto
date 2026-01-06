const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log("Testando insert com media_url...");
    const { data: conv } = await supabase.from('conversations').select('id').limit(1).single();
    if (!conv) { console.log("Sem conversas para testar"); return; }

    const { error } = await supabase.from('messages').insert([{
        conversation_id: conv.id,
        content: 'teste media_url',
        media_url: 'http://google.com',
        type: 'text' // Usando type existente
    }]);

    if (error) {
        console.error("Erro insert:", error.message);
    } else {
        console.log("Sucesso! media_url existe.");
    }
}
check();
