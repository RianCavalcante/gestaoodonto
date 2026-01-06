const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Verificando colunas de 'messages'...");
    // Try to insert a dummy message with message_type to see if it errors
    const { error } = await supabase
        .from('messages')
        .select('message_type, media_url')
        .limit(1);

    if (error) {
        console.error("Erro ao selecionar colunas novas:", error);
    } else {
        console.log("Colunas 'message_type' e 'media_url' parecem existir.");
    }

    // List latest messages to check actual data
    const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
    
    console.log("Últimas 3 mensagens:");
    console.log(JSON.stringify(msgs, null, 2));
}

checkSchema();
