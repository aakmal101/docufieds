import * as dotenv from 'dotenv';
import path from 'path';
// Load .env explicitly before anything else
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Now import prisma
import { prisma } from './src/lib/prisma';

async function main() {
  try {
    console.log("Testing Prisma connection through app logic...");
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Successfully connected! Found ${userCount} users.`);
  } catch (error) {
    console.error("❌ Failed to connect:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
