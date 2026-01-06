const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPolicy() {
    console.log("Aplicando política de leitura pública para 'chat-media'...");

    // SQL to create policy if not exists
    // Note: We cannot execute SQL directly via JS client usually, but we can try to use RPC or just assume the 'public' bucket flag is enough.
    // If 'public' flag is true, we should strictly check if the URL is correct.
    
    // Let's first re-verify the bucket is public
    const { data: bucket, error } = await supabase.storage.getBucket('chat-media');
    console.log("Bucket info:", bucket, error);

    if (bucket && !bucket.public) {
        console.log("Bucket não era público. Atualizando...");
        await supabase.storage.updateBucket('chat-media', { public: true });
    }

    // Since we cannot run raw SQL easily without RPC, let's try to upload a dummy file and check its public URL accessibility using fetch
    const testFile = 'test-' + Date.now() + '.txt';
    await supabase.storage.from('chat-media').upload(testFile, 'teste 123');
    
    const { data } = supabase.storage.from('chat-media').getPublicUrl(testFile);
    console.log("URL de teste:", data.publicUrl);

    // Fetch validation
    // Native fetch in Node 18+
    try {
        const res = await fetch(data.publicUrl);
        console.log("Status de acesso à URL:", res.status);
        if (res.status === 200) {
            console.log("Acesso PÚBLICO confirmado!");
        } else {
            console.log("ALERTA: Acesso público falhou (404/403). Verifique as Políticas RLS no Dashboard do Supabase!");
            console.log("SQL SUGERIDO no Dashboard:");
            console.log(`CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'chat-media' );`);
        }
    } catch (e) {
        console.error("Erro ao testar URL:", e);
    }
}

fixPolicy();
