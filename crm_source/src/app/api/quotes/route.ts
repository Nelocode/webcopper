import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const quotes = await prisma.quote.findMany({
      include: { contact: true, deal: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, quotes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contactId, dealId, items, totalAmount, status } = body;

    if (!contactId || !items) {
      return NextResponse.json({ success: false, error: 'Contact ID and items are required' }, { status: 400 });
    }

    const count = await prisma.quote.count();
    const quoteNumber = `OUT-2026-${(count + 101).toString().padStart(4, '0')}`;

    const quote = await prisma.quote.create({
      data: {
        contactId,
        dealId: dealId || null,
        quoteNumber,
        itemsJson: typeof items === 'string' ? items : JSON.stringify(items),
        totalAmount: totalAmount ? parseFloat(totalAmount) : 0,
        status: status || 'Sent',
      },
      include: { contact: true },
    });

    await prisma.timelineActivity.create({
      data: {
        contactId,
        type: 'QUOTE_CREATED',
        title: `Cotización Generada: ${quoteNumber}`,
        description: `Monto total: $${totalAmount}`,
      },
    });

    return NextResponse.json({ success: true, quote });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
