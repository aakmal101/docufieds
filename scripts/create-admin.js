const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Creating/Updating admin user "Shahoriar"...');
    const id = 'demo-user-shahoriar-admin-id';
    const email = 'shahoriar@admin.com'; // Preferred email
    const fullName = 'Shahoriar';

    try {
        const user = await prisma.user.upsert({
            where: { id: id },
            update: {
                role: 'ADMIN',
                fullName: fullName,
                status: 'APPROVED'
            },
            create: {
                id: id,
                email: email,
                fullName: fullName,
                role: 'ADMIN',
                status: 'APPROVED',
                userId: 'shahoriar' // Match the identifier search
            }
        });

        console.log('User upserted successfully:', user);
    } catch (e) {
        console.error('Error creating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
