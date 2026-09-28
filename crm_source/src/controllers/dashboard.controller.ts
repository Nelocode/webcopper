import { Request, Response } from 'express';
import { prisma } from '../index';

// GET /api/dashboard
// Returns aggregated intelligence metrics for the main dashboard view
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ── Total contacts ──────────────────────────────────────────────────────────
    const totalContacts = await prisma.contact.count();

    // ── Contacts missing AI intelligence ─────────────────────────────────────────
    const noIcebreaker = await prisma.contact.count({ where: { aiIcebreaker: null } });
    const noStrategicContext = await prisma.contact.count({ where: { aiStrategicContext: null } });
    const noSentiment = await prisma.contact.count({ where: { aiSentiment: null } });
    const noKeyInterests = await prisma.contact.count({ where: { aiKeyInterests: null } });

    // Union: contacts missing at least one AI field
    const noAI = await prisma.contact.count({
      where: {
        OR: [
          { aiIcebreaker: null },
          { aiStrategicContext: null },
          { aiSentiment: null },
          { aiKeyInterests: null },
        ],
      },
    });

    // ── Engagement distribution ──────────────────────────────────────────────────
    const engagementGroups = await prisma.contact.groupBy({
      by: ['engagementLevel'],
      _count: { id: true },
    });
    const engagementDist: Record<string, number> = {};
    for (const g of engagementGroups) {
      if (g.engagementLevel) engagementDist[g.engagementLevel] = g._count.id;
    }

    // ── Seniority distribution ───────────────────────────────────────────────────
    const seniorityGroups = await prisma.contact.groupBy({
      by: ['seniority'],
      _count: { id: true },
    });
    const seniorityDist: Record<string, number> = {};
    for (const g of seniorityGroups) {
      if (g.seniority) seniorityDist[g.seniority] = g._count.id;
    }

    // ── Relations ────────────────────────────────────────────────────────────────
    const totalRelationships = await prisma.relationship.count();
    const autoDetectedRelationships = await prisma.relationship.count({
      where: { source: { not: 'manual' } },
    });

    // Contacts in same org without a relationship (detectable ties)
    const organizationsWithContacts = await prisma.organization.findMany({
      where: {
        contacts: { some: {} },
      },
      include: {
        _count: { select: { contacts: true } },
      },
    });

    let detectableRelationships = 0;
    for (const org of organizationsWithContacts) {
      if (org._count.contacts >= 2) {
        const contactsInOrg = await prisma.contact.findMany({
          where: { organizationId: org.id },
          select: { id: true },
        });
        const ids = contactsInOrg.map(c => c.id);
        const existingRelations = await prisma.relationship.count({
          where: {
            OR: [
              { contactAId: { in: ids }, contactBId: { in: ids } },
            ],
          },
        });
        const possiblePairs = (ids.length * (ids.length - 1)) / 2;
        detectableRelationships += possiblePairs - existingRelations;
      }
    }

    // ── Cooling contacts (last interaction > 30 days, but has at least one) ─────
    // Raw SQL: contacts whose most recent interaction is older than 30 days
    const coolingResult = await prisma.$queryRawUnsafe<{id: string}[]>(
      `SELECT c.id FROM Contact c
       WHERE c.id IN (SELECT DISTINCT i.contactId FROM Interaction i)
       AND (SELECT MAX(i2.date) FROM Interaction i2 WHERE i2.contactId = c.id) < ?`,
      thirtyDaysAgo.toISOString()
    );
    const coolingContacts = coolingResult.length;

    // Contacts with zero interactions ever
    const zeroInteractions = await prisma.contact.count({
      where: {
        interactions: { none: {} },
      },
    });

    // ── Sentiment distribution ───────────────────────────────────────────────────
    const sentimentGroups = await prisma.contact.groupBy({
      by: ['aiSentiment'],
      _count: { id: true },
    });
    const sentimentDist: Record<string, number> = {};
    for (const g of sentimentGroups) {
      if (g.aiSentiment) sentimentDist[g.aiSentiment] = g._count.id;
    }

    // ── Weekly trend: contacts created per week (last 8 weeks) ───────────────────
    const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);
    const recentContacts = await prisma.contact.findMany({
      where: { createdAt: { gte: eightWeeksAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by ISO week
    const weeklyGrowth: { week: string; count: number }[] = [];
    const weekMap = new Map<string, number>();
    for (const c of recentContacts) {
      const d = new Date(c.createdAt);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay()); // Sunday
      const key = weekStart.toISOString().slice(0, 10);
      weekMap.set(key, (weekMap.get(key) || 0) + 1);
    }
    for (const [week, count] of weekMap) {
      weeklyGrowth.push({ week, count });
    }

    // ── Response ─────────────────────────────────────────────────────────────────
    res.json({
      totalContacts,
      aiIntelligence: {
        noIcebreaker,
        noStrategicContext,
        noSentiment,
        noKeyInterests,
        completelyMissing: noAI, // missing at least one field
        pctComplete: totalContacts > 0
          ? Math.round(((totalContacts - noAI) / totalContacts) * 100)
          : 0,
      },
      engagement: {
        distribution: engagementDist,
        cooling: coolingContacts,
        zeroInteractions,
      },
      seniority: seniorityDist,
      relationships: {
        total: totalRelationships,
        autoDetected: autoDetectedRelationships,
        detectable: detectableRelationships,
      },
      sentiment: sentimentDist,
      growth: {
        weekly: weeklyGrowth,
      },
      generatedAt: now.toISOString(),
    });

  } catch (error: any) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
