import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, getEffectiveTenantId } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get('tenantId');
    const effectiveTenantId = getEffectiveTenantId(session, requestedTenantId);

    const deals = await prisma.deal.findMany({
      where: effectiveTenantId ? { tenantId: effectiveTenantId } : {},
      include: {
        contact: true,
        quotes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, deals });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { contactId, title, amount, currency, stage, probability, expectedCloseDate, tenantId: bodyTenantId } = body;

    if (!contactId || !title) {
      return NextResponse.json({ success: false, error: 'Contact ID and title are required' }, { status: 400 });
    }

    const effectiveTenantId = getEffectiveTenantId(session, bodyTenantId);

    const deal = await prisma.deal.create({
      data: {
        contactId,
        title,
        amount: amount ? parseFloat(amount) : 0,
        currency: currency || 'USD',
        stage: stage || 'Prospecting',
        probability: probability ? parseInt(probability, 10) : 20,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        tenantId: effectiveTenantId || null,
      },
      include: { contact: true },
    });

    await prisma.timelineActivity.create({
      data: {
        contactId,
        type: 'NOTE',
        title: `Nueva Oportunidad Creada`,
        description: `${title} - Monto: ${currency} ${amount}`,
      },
    });

    return NextResponse.json({ success: true, deal });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, stage, probability, amount } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Deal ID is required' }, { status: 400 });
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        stage,
        probability,
        amount,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, deal: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
