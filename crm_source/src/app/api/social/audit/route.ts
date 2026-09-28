import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entity_type');
    const userId = searchParams.get('user_id');

    const where: any = {};

    if (action && action.trim()) {
      where.action = action.trim();
    }
    if (entityType && entityType.trim()) {
      where.entityType = entityType.trim();
    }
    if (userId && userId.trim()) {
      where.OR = [
        { userId: userId.trim() },
        { username: { contains: userId.trim() } },
      ];
    }

    const logs = await prisma.socialAuditLog.findMany({
      where,
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
