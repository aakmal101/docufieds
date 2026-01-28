const dns = require('dns').promises;

const hosts = [
    'db.nrbbxcxwyqczsoscdfyw.supabase.co',
    'aws-1-ap-southeast-1.pooler.supabase.com',
    'google.com' // Control
];

async function checkDNS() {
    console.log('Starting DNS check...');
    for (const host of hosts) {
        try {
            console.log(`Resolving ${host}...`);
            const addresses = await dns.resolve4(host);
            console.log(`[OK] ${host} -> ${addresses.join(', ')}`);
        } catch (err) {
            console.log(`[ERR] ${host} -> ${err.message}`);
        }
    }
}

checkDNS();
