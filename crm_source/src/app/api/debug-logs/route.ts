import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await prisma.timelineActivity.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        title: true,
        description: true,
        createdAt: true
      }
    });
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
