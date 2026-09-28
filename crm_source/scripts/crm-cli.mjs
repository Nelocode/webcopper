#!/usr/bin/env node

/**
 * CRM Command Line Tool for Hermes (v19.0)
 * Allows Hermes to inspect, query, create, update, and manage CRM data directly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    console.log(`
Outcrop Silver CRM CLI - Herramienta para Hermes
Uso: node scripts/crm-cli.mjs <comando> [opciones]

Comandos disponibles:
  list-contacts                     Lista todos los contactos registrados
  search-contacts <termino>         Busca contactos por nombre, empresa o correo
  get-contact <id_o_nombre>         Obtiene el detalle completo de un contacto
  create-contact <json_datos>       Crea un nuevo contacto (ej: '{"name":"Juan","company":"Mineros","email":"j@m.com"}')
  update-contact <id_o_nombre> <json> Actualiza campos de un contacto (ej: '{"stage":"Deal Committed"}')
  delete-contact <id_o_nombre>      Elimina un contacto
  stats                             Muestra estadísticas y métricas del CRM
`);
    process.exit(0);
  }

  try {
    if (command === 'list-contacts') {
      const contacts = await prisma.contact.findMany({
        take: 30,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, company: true, email: true, phone: true, stage: true, leadScore: true, investorType: true },
      });
      console.log(JSON.stringify(contacts, null, 2));
    } else if (command === 'search-contacts') {
      const query = args[1] || '';
      const contacts = await prisma.contact.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { company: { contains: query } },
            { email: { contains: query } },
            { stage: { contains: query } },
          ],
        },
        select: { id: true, name: true, company: true, email: true, phone: true, stage: true, leadScore: true },
      });
      console.log(JSON.stringify(contacts, null, 2));
    } else if (command === 'get-contact') {
      const identifier = args[1];
      const contact = await prisma.contact.findFirst({
        where: {
          OR: [{ id: identifier }, { name: { contains: identifier } }],
        },
        include: {
          timelineActivities: { take: 5, orderBy: { createdAt: 'desc' } },
          voiceNotes: { take: 5, orderBy: { createdAt: 'desc' } },
          cards: true,
        },
      });
      console.log(JSON.stringify(contact, null, 2));
    } else if (command === 'create-contact') {
      const rawJson = args.slice(1).join(' ');
      const data = JSON.parse(rawJson);

      const defaultTenant =
        (await prisma.tenant.findFirst({ where: { slug: 'outcrop-silver' } })) ||
        (await prisma.tenant.findFirst());

      const newContact = await prisma.contact.create({
        data: {
          tenantId: data.tenantId || defaultTenant?.id || null,
          name: data.name,
          company: data.company || 'Empresa Independiente',
          title: data.title || 'Inversionista',
          email: data.email || null,
          phone: data.phone || null,
          whatsapp: data.whatsapp || data.phone || null,
          stage: data.stage || 'Lead Prospect',
          investorType: data.investorType || 'HNW investor',
          leadScore: data.leadScore || 70,
          dynamicIcebreaker: data.notes || `Contacto registrado por Hermes Agent.`,
          strategicContext: data.strategicContext || 'Creado via CRM CLI por Hermes.',
          source: 'Hermes Local Agent',
        },
      });
      console.log('✅ Contacto creado exitosamente:', JSON.stringify(newContact, null, 2));
    } else if (command === 'update-contact') {
      const identifier = args[1];
      const rawJson = args.slice(2).join(' ');
      const updates = JSON.parse(rawJson);

      const target = await prisma.contact.findFirst({
        where: {
          OR: [{ id: identifier }, { name: { contains: identifier } }],
        },
      });

      if (!target) {
        console.error(`❌ No se encontró ningún contacto que coincida con "${identifier}"`);
        process.exit(1);
      }

      const updated = await prisma.contact.update({
        where: { id: target.id },
        data: updates,
      });
      console.log('✅ Contacto actualizado exitosamente:', JSON.stringify(updated, null, 2));
    } else if (command === 'stats') {
      const [contactsCount, dealsCount, stageGroups] = await Promise.all([
        prisma.contact.count(),
        prisma.deal.count(),
        prisma.contact.groupBy({
          by: ['stage'],
          _count: { stage: true },
        }),
      ]);

      console.log(JSON.stringify({
        totalContacts: contactsCount,
        totalDeals: dealsCount,
        stages: stageGroups,
      }, null, 2));
    } else {
      console.error(`Comando desconocido: ${command}. Ejecuta sin argumentos para ver la ayuda.`);
    }
  } catch (err) {
    console.error('❌ Error ejecutando comando CRM:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
