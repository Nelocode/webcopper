import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Outcrop Silver Multi-Tenant CRM Database...');

  // 1. Clean existing records
  await prisma.relationship.deleteMany();
  await prisma.timelineActivity.deleteMany();
  await prisma.businessCard.deleteMany();
  await prisma.voiceNote.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workflowRule.deleteMany();
  await prisma.tenant.deleteMany();

  // 2. Create Default Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Outcrop Silver Corp',
      slug: 'outcrop-silver',
      logoUrl: '/logo.png',
      primaryColor: '#3b82f6',
      status: 'ACTIVE',
      configJson: JSON.stringify({
        industry: 'Silver & Precious Metals Mining',
        project: 'Santa Ana High-Grade Silver Project (Colombia)',
      }),
    },
  });

  // 3. Create Super Admin & Tenant Users
  const superAdmin = await prisma.user.create({
    data: {
      email: 'nelson@outcropsilver.com',
      phone: '+573012954278',
      name: 'Super Admin Nelson',
      role: 'SUPER_ADMIN',
    },
  });

  const tenantAdmin = await prisma.user.create({
    data: {
      email: 'sara@outcropsilver.com',
      phone: '+573207116676',
      name: 'Sara Admin (Outcrop Silver)',
      role: 'TENANT_ADMIN',
      tenantId: tenant.id,
    },
  });

  // 4. Create Sample Mining & Investor Contacts assigned to Tenant
  const c1 = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      name: 'Michael Sterling',
      title: 'Managing Director & Portfolio Manager',
      company: 'Apex Precious Metals Fund',
      email: 'm.sterling@apexpmfund.com',
      phone: '+1 416 555 0198',
      whatsapp: '+14165550198',
      location: 'Toronto, Canada',
      bio: 'Institutional PM focused on silver exploration & development in Latin America.',
      investorType: 'Institutional PM',
      stage: 'Interested - committed',
      source: 'Conference',
      leadScore: 85,
    },
  });

  const c2 = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      name: 'Elena Rostova',
      title: 'Senior Mining Analyst',
      company: 'Canaccord Genuity',
      email: 'erostova@canaccord.com',
      phone: '+1 604 555 0142',
      whatsapp: '+16045550142',
      location: 'Vancouver, Canada',
      bio: 'Covers high-grade silver deposits. Published coverage note on Santa Ana project.',
      investorType: 'Institutional analyst',
      stage: 'Interested - shareholder',
      source: 'Analyst referral',
      leadScore: 92,
    },
  });

  const c3 = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      name: 'Dr. Guillermo Gutierrez',
      title: 'Founder & Principal Investor',
      company: 'Andean Capital Family Office',
      email: 'ggutierrez@andeancap.ch',
      phone: '+41 22 555 9811',
      whatsapp: '+41225559811',
      location: 'Geneva, Switzerland',
      bio: 'Family office focused on royalty stream purchases and high-net-worth placements.',
      investorType: 'Family office',
      stage: 'Interested - considering',
      source: 'Brokerage roadshow',
      leadScore: 78,
    },
  });

  // 5. Create Graph Relationships
  await prisma.relationship.createMany({
    data: [
      {
        sourceContactId: c1.id,
        targetContactId: c2.id,
        relationshipType: 'Consulta Análisis de',
        notes: 'Michael confía en la investigación técnica publicada por Elena.',
        strength: 5,
      },
      {
        sourceContactId: c3.id,
        targetContactId: c1.id,
        relationshipType: 'Co-Inversor con',
        notes: 'Co-invirtieron en la ronda de financiamiento Serie B anterior.',
        strength: 4,
      },
    ],
  });

  // 6. Create Deals & Quotes
  const deal1 = await prisma.deal.create({
    data: {
      tenantId: tenant.id,
      contactId: c1.id,
      title: 'Colocación Privada Privada - $1.5M CAD',
      amount: 1500000,
      currency: 'CAD',
      stage: 'Proposal',
      probability: 75,
      expectedCloseDate: new Date('2026-09-30'),
    },
  });

  await prisma.quote.create({
    data: {
      contactId: c1.id,
      dealId: deal1.id,
      quoteNumber: 'OUT-2026-0042',
      totalAmount: 1500000,
      status: 'Sent',
      itemsJson: JSON.stringify([
        { description: 'Acciones Ordinarias Outcrop Silver (Unidades a $0.35)', qty: 4285714, unitPrice: 0.35, total: 1500000 },
        { description: 'Warrants de compra de acciones ($0.50 a 24 meses)', qty: 2142857, unitPrice: 0, total: 0 },
      ]),
    },
  });

  // 7. Create Workflow Rules
  await prisma.workflowRule.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: 'Alertar IR cuando Lead Score supere 80',
        triggerType: 'LEAD_SCORE_ABOVE',
        triggerValue: '80',
        actionType: 'NOTIFY_TEAM',
        actionValue: 'Enviar notificación urgente a equipo comercial de Outcrop Silver.',
      },
      {
        tenantId: tenant.id,
        name: 'Auto-enviar Deck Presentación al cambiar a Interested - committed',
        triggerType: 'STAGE_CHANGED',
        triggerValue: 'Interested - committed',
        actionType: 'SEND_WHATSAPP',
        actionValue: 'Hola {name}, adjuntamos la presentación corporativa y términos del proyecto Santa Ana.',
      },
    ],
  });

  console.log('Outcrop Silver Multi-Tenant Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
