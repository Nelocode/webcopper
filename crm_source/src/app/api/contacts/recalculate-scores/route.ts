import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, getEffectiveTenantId } from '@/lib/auth';
import { calculateContactScore, DEFAULT_SCORING_RULES } from '@/lib/scoringEngine';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json().catch(() => ({}));
    const { tenantId: requestedTenantId, rules } = body;

    const effectiveTenantId = getEffectiveTenantId(session, requestedTenantId);

    const whereClause: any = {};
    if (effectiveTenantId) {
      whereClause.OR = [
        { tenantId: effectiveTenantId },
        { tenantId: null },
      ];
    }

    const contacts = await prisma.contact.findMany({
      where: whereClause,
      include: {
        sourceRelationships: true,
        targetRelationships: true,
        voiceNotes: true,
        documents: true,
        timelineActivities: true,
      },
    });

    const activeRules = rules || DEFAULT_SCORING_RULES;
    let updatedCount = 0;

    for (const contact of contacts) {
      const newScore = calculateContactScore(contact, activeRules);
      if (newScore !== contact.leadScore) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: { leadScore: newScore },
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      totalContacts: contacts.length,
      updatedCount,
      message: `Lead score recalculado para ${contacts.length} contactos. (${updatedCount} modificados)`,
    });
  } catch (error: any) {
    console.error('Error recalculating scores:', error);
    return NextResponse.json(
      { error: error.message || 'Error al recalcular puntajes' },
      { status: 500 }
    );
  }
}
