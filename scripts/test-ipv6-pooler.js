const dns = require('dns').promises;
const net = require('net');

async function checkIPv6() {
    const host = 'db.nrbbxcxwyqczsoscdfyw.supabase.co';
    console.log(`Checking IPv6 for ${host}...`);
    try {
        const addresses = await dns.resolve6(host);
        console.log(`[IPv6] ${host} -> ${addresses.join(', ')}`);
    } catch (err) {
        console.log(`[IPv6] Error: ${err.message}`);
    }
}

async function checkPoolerSession() {
    const host = 'aws-1-ap-southeast-1.pooler.supabase.com';
    const port = 5432;
    console.log(`Checking TCP connection to ${host}:${port} (Session Mode?)...`);

    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        socket.on('connect', () => {
            console.log(`[TCP] Connected to ${host}:${port}`);
            socket.destroy();
            resolve();
        });
        socket.on('timeout', () => {
            console.log(`[TCP] Timeout connection to ${host}:${port}`);
            socket.destroy();
            resolve();
        });
        socket.on('error', (err) => {
            console.log(`[TCP] Error connecting to ${host}:${port}: ${err.message}`);
            resolve();
        });
        socket.connect(port, host);
    });
}

async function run() {
    await checkIPv6();
    await checkPoolerSession();
}

run();
