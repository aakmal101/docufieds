const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Listing all users...');
    try {
        const users = await prisma.user.findMany();
        console.log(`Found ${users.length} users:`);
        users.forEach(u => console.log(`- ${u.fullName} (${u.email}) [Role: ${u.role}] (ID: ${u.id})`));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
