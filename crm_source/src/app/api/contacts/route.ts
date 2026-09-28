import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, getEffectiveTenantId } from '@/lib/auth';
import { ensurePersistentData } from '@/lib/auto-seed';

export async function GET(request: Request) {
  try {
    await ensurePersistentData();
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const investorType = searchParams.get('investorType');
    const interestLevel = searchParams.get('interestLevel');
    const stage = searchParams.get('stage');
    const source = searchParams.get('source');
    const requestedTenantId = searchParams.get('tenantId');

    let effectiveTenantId = getEffectiveTenantId(session, requestedTenantId);
    if (!effectiveTenantId) {
      effectiveTenantId = requestedTenantId && requestedTenantId !== 'ALL' ? requestedTenantId : '1757cddf-5974-4184-9bb1-d5f4f7e931be';
    }

    const andClauses: any[] = [];

    // Enforce Tenant Scoping
    if (effectiveTenantId) {
      andClauses.push({
        OR: [
          { tenantId: effectiveTenantId },
          { tenantId: null }, // Shared legacy contacts
        ],
      });
    }

    if (search) {
      andClauses.push({
        OR: [
          { name: { contains: search } },
          { company: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      });
    }

    if (investorType && investorType !== 'ALL') {
      andClauses.push({ investorType: { contains: investorType } });
    }

    if (interestLevel && interestLevel !== 'ALL') {
      andClauses.push({ interestLevel: { contains: interestLevel } });
    }

    if (stage && stage !== 'ALL') {
      andClauses.push({ stage });
    }

    if (source && source !== 'ALL') {
      andClauses.push({ source });
    }

    const where = andClauses.length > 0 ? { AND: andClauses } : {};

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        timelineActivities: { orderBy: { createdAt: 'desc' }, take: 10 },
        deals: true,
        documents: true,
        interactions: true,
        quotes: true,
        sourceRelationships: { include: { targetContact: true } },
        targetRelationships: { include: { sourceContact: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, contacts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, title, company, email, phone, whatsapp, location, bio, investorType, stage, source, leadScore, tenantId: bodyTenantId, apiKey } = body;

    const isDaemonAuthorized = apiKey === process.env.WHATSAPP_DAEMON_KEY || apiKey === 'outcrop_daemon_secret_2026';
    const session = isDaemonAuthorized ? null : await getSession();

    if (!session && !isDaemonAuthorized) {
      return NextResponse.json({ success: false, error: 'Authentication required', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const effectiveTenantId = getEffectiveTenantId(session, bodyTenantId);

    const contact = await prisma.contact.create({
      data: {
        tenantId: effectiveTenantId || null,
        name,
        title: title || null,
        company: company || null,
        email: email || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        location: location || null,
        bio: bio || null,
        investorType: investorType || 'Retail investor',
        stage: stage || 'Interested - early',
        source: source || 'Networking',
        leadScore: leadScore ? parseInt(leadScore, 10) : 10,
        timelineActivities: {
          create: {
            type: 'NOTE',
            title: 'Contacto Creado',
            description: `Contacto registrado en la réplica CRM (${investorType} / ${stage}).`,
          },
        },
      },
    });

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

