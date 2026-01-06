const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
    console.log("Verificando bucket 'chat-media'...");
    
    // List buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        console.error("Erro ao listar buckets:", listError);
        return;
    }

    const exists = buckets.find(b => b.name === 'chat-media');

    if (exists) {
        console.log("Bucket 'chat-media' já existe.");
        // Ensure public
        if (!exists.public) {
            console.log("Atualizando para public...");
            await supabase.storage.updateBucket('chat-media', { public: true });
        }
    } else {
        console.log("Criando bucket 'chat-media'...");
        const { data, error } = await supabase.storage.createBucket('chat-media', {
            public: true,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: ['image/*', 'audio/*', 'application/pdf', 'video/mp4']
        });

        if (error) {
            console.error("Erro ao criar bucket:", error);
        } else {
            console.log("Bucket criado com sucesso!");
        }
    }
}

createBucket();
