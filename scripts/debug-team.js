const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- INSPECTING USERS (LEADS) ---');
    const users = await prisma.user.findMany({
        where: { role: 'ADMIN' }
    });
    users.forEach(u => console.log(`Lead: ${u.fullName} (${u.email}) | ID: ${u.id} | userId: ${u.userId}`));

    console.log('\n--- INSPECTING SUPPORT TEAM MEMBERS ---');
    const members = await prisma.supportTeamMember.findMany({
        include: { lead: true }
    });

    if (members.length === 0) {
        console.log('No support team members found.');
    } else {
        members.forEach(m => {
            console.log(`Member: ${m.fullName} (${m.email})`);
            console.log(`  - ID: ${m.id}`);
            console.log(`  - Linked Lead ID: ${m.leadId}`);
            console.log(`  - Is Active? ${m.isActive}`);
            console.log(`  - Lead Name: ${m.lead ? m.lead.fullName : 'UNKNOWN'}`);
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
