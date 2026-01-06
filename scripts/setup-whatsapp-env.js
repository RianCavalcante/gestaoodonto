const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '..', '.env.local');
const targetEnvPath = path.join(__dirname, '..', 'backend', 'whatsapp', '.env');

try {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const lines = envContent.split('\n');
    
    let url = '';
    let key = '';
    
    lines.forEach(line => {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
            url = line.split('=')[1].trim();
        }
        if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
            key = line.split('=')[1].trim();
        }
        if (!key && line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
            key = line.split('=')[1].trim();
        }
    });
    
    // Força a porta 3001
    const newEnvContent = `SUPABASE_URL=${url}\nSUPABASE_SERVICE_KEY=${key}\nPORT=3001`;
    
    fs.writeFileSync(targetEnvPath, newEnvContent);
    console.log('Environment variables copied to backend/whatsapp/.env with PORT=3001');
    
} catch (error) {
    console.error('Error copying env vars:', error);
}
