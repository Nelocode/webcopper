import { PrismaClient } from '@prisma/client';
import { ensurePersistentData } from '@/lib/auto-seed';

const globalForPrisma = global as unknown as { prisma: PrismaClient; autoSeeded?: boolean };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Auto-seed persistent configurations and core data on server initialization
if (!globalForPrisma.autoSeeded) {
  globalForPrisma.autoSeeded = true;
  ensurePersistentData().catch(() => {});
}
