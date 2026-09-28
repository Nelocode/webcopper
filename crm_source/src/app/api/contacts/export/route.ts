import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, getEffectiveTenantId } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get('tenantId');
    const effectiveTenantId = getEffectiveTenantId(session, requestedTenantId);

    const where = effectiveTenantId ? { tenantId: effectiveTenantId } : {};

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Name', 'Email', 'Phone', 'Company', 'Title', 'Stage', 'Investor Type', 'Lead Score', 'Source', 'AUM', 'Country', 'CreatedAt'
    ];

    const rows = contacts.map(c => {
      return [
        c.name,
        c.email || '',
        c.phone || '',
        c.company || '',
        c.title || '',
        c.stage || '',
        c.investorType || '',
        c.leadScore?.toString() || '0',
        c.source || '',
        c.aum || '',
        c.country || '',
        c.createdAt.toISOString()
      ].map(val => `"${val.replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="contacts.csv"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
