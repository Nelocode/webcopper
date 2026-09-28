import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, getEffectiveTenantId } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await params;
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        timelineActivities: { orderBy: { createdAt: 'desc' } },
        deals: { include: { quotes: true } },
        quotes: true,
        documents: true,
        interactions: { orderBy: { createdAt: 'desc' } },
        sourceRelationships: { include: { targetContact: true } },
        targetRelationships: { include: { sourceContact: true } },
      },
    });

    if (!contact) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    const effectiveTenantId = getEffectiveTenantId(session);
    if (effectiveTenantId && contact.tenantId && contact.tenantId !== effectiveTenantId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    const effectiveTenantId = getEffectiveTenantId(session);
    if (effectiveTenantId && existing.tenantId && existing.tenantId !== effectiveTenantId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    // Audit activity if stage or score changed
    if (body.stage && body.stage !== existing.stage) {
      await prisma.timelineActivity.create({
        data: {
          contactId: id,
          type: 'STAGE_CHANGE',
          title: `Etapa cambiada a: ${body.stage}`,
          description: `Etapa previa: ${existing.stage}`,
        },
      });
    }

    if (body.leadScore !== undefined && body.leadScore !== existing.leadScore) {
      await prisma.timelineActivity.create({
        data: {
          contactId: id,
          type: 'SCORE_CHANGE',
          title: `Lead Score actualizado: ${body.leadScore}`,
          description: `Puntaje anterior: ${existing.leadScore}`,
        },
      });
    }

    return NextResponse.json({ success: true, contact: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await params;

    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    const effectiveTenantId = getEffectiveTenantId(session);
    if (effectiveTenantId && existing.tenantId && existing.tenantId !== effectiveTenantId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.timelineActivity.deleteMany({ where: { contactId: id } }),
      prisma.deal.deleteMany({ where: { contactId: id } }),
      prisma.quote.deleteMany({ where: { contactId: id } }),
      prisma.document.deleteMany({ where: { contactId: id } }),
      prisma.interaction.deleteMany({ where: { contactId: id } }),
      prisma.relationship.deleteMany({ where: { sourceContactId: id } }),
      prisma.relationship.deleteMany({ where: { targetContactId: id } }),
      prisma.contact.delete({ where: { id } })
    ]);
    return NextResponse.json({ success: true, message: 'Contact and all associated data permanently purged.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

