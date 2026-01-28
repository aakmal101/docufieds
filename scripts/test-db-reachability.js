const net = require('net');

const targets = [
    { host: 'db.nrbbxcxwyqczsoscdfyw.supabase.co', port: 5432, name: 'Direct (5432)' },
    { host: 'aws-1-ap-southeast-1.pooler.supabase.com', port: 6543, name: 'Pooler (6543)' }
];

async function checkConnection(target) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let status = 'failed';

        socket.setTimeout(5000); // 5s timeout

        socket.on('connect', () => {
            console.log(`[OK] Connected to ${target.name} at ${target.host}:${target.port}`);
            status = 'success';
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            console.log(`[ERR] Timeout connecting to ${target.name} at ${target.host}:${target.port}`);
            socket.destroy();
            resolve(false);
        });

        socket.on('error', (err) => {
            console.log(`[ERR] Error connecting to ${target.name} at ${target.host}:${target.port}: ${err.message}`);
            resolve(false);
        });

        socket.connect(target.port, target.host);
    });
}

async function run() {
    console.log('Starting connectivity check...');
    for (const target of targets) {
        await checkConnection(target);
    }
    console.log('Check complete.');
}

run();
