// Native fetch in Node 18+

async function sync() {
    try {
        const response = await fetch('http://localhost:3001/sync-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '558591872205' })
        });
        const data = await response.json();
        console.log("Result:", data);
    } catch (e) {
        console.error("Error:", e);
    }
}
sync();
