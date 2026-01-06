const fs = require('fs');
const path = require('path');

// Load .env.local manually or via dotenv
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
} else {
    require('dotenv').config();
}

const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessages() {
    const targetPhonePart = '558591872205'; // Number from screenshot
    console.log(`Checking data for phone containing: ${targetPhonePart}`);

    // 1. Check Patients
    const { data: patients, error: pError } = await supabase
        .from('patients')
        .select('*')
        .ilike('phone', `%${targetPhonePart}%`); // Flexible search

    if (pError) console.error(pError);
    console.log('--- Patients Found ---');
    console.log(JSON.stringify(patients, null, 2));

    if (patients && patients.length > 0) {
        for (const p of patients) {
            // 2. Check Conversations
            const { data: convs } = await supabase
                .from('conversations')
                .select('*')
                .eq('patient_id', p.id);
            
            console.log(`--- Conversations for Patient ${p.name} (ID: ${p.id}) ---`);
            console.log(JSON.stringify(convs, null, 2));

            // 3. Check Messages
            for (const c of convs || []) {
                const { data: msgs } = await supabase
                    .from('messages')
                    .select('id, content, sender_type, created_at')
                    .eq('conversation_id', c.id)
                    .order('created_at', { ascending: false })
                    .limit(3);
                console.log(`>>> Last messages in Conversation ${c.id}:`);
                console.log(JSON.stringify(msgs, null, 2));
            }
        }
    }
}

checkMessages();
