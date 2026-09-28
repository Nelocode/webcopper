import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, getEffectiveTenantId } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get('tenantId');
    const effectiveTenantId = getEffectiveTenantId(session, requestedTenantId);

    const rules = await prisma.workflowRule.findMany({
      where: effectiveTenantId ? { tenantId: effectiveTenantId } : {},
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { name, triggerType, triggerValue, actionType, actionValue, tenantId: bodyTenantId } = body;

    const effectiveTenantId = getEffectiveTenantId(session, bodyTenantId);

    const rule = await prisma.workflowRule.create({
      data: {
        name,
        triggerType,
        triggerValue,
        actionType,
        actionValue,
        isActive: true,
        tenantId: effectiveTenantId || null,
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, isActive } = body;

    const rule = await prisma.workflowRule.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ success: true, rule });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
