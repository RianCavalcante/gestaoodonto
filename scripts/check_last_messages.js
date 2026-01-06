
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMessages() {
    console.log('Checking last 10 messages in Supabase...');
    const { data, error } = await supabase
        .from('messages')
        .select('id, content, created_at, type, sender_type')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching messages:', error);
        return;
    }

    console.log('--- RECENT MESSAGES ---');
    data.forEach(msg => {
        console.log(`[${new Date(msg.created_at).toLocaleTimeString()}] Type: ${msg.type} | Sender: ${msg.sender_type}`);
        console.log(`   Content: ${msg.content.substring(0, 150)}`); // Show more content
        console.log('-------------------------');
    });
}

checkMessages();
