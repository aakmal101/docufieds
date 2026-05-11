import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Connecting to database...");
    await prisma.$connect();
    console.log("✅ Successfully connected to database using generated client.");
  } catch (error) {
    console.error("❌ Failed to connect to database:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
