const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('=== TESTE WHATSAPP WEB.JS ===');
console.log('Criando cliente...');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false, // Abre navegador visível para debug
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('✓ QR CODE GERADO!');
    console.log('Escaneie este QR Code com seu celular:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✓ WhatsApp conectado com sucesso!');
    console.log('Pressione Ctrl+C para sair');
});

client.on('authenticated', () => {
    console.log('✓ Autenticado!');
});

client.on('auth_failure', (msg) => {
    console.error('✗ Falha na autenticação:', msg);
    process.exit(1);
});

client.on('disconnected', (reason) => {
    console.log('Desconectado:', reason);
    process.exit(0);
});

console.log('Inicializando cliente...');
client.initialize().catch(err => {
    console.error('✗ ERRO AO INICIALIZAR:', err);
    process.exit(1);
});
