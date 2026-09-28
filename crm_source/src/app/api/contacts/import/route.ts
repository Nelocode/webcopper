import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, getEffectiveTenantId } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { contacts, tenantId: bodyTenantId } = body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ success: false, error: 'Se requiere una lista de contactos válida' }, { status: 400 });
    }

    const effectiveTenantId = getEffectiveTenantId(session, bodyTenantId);

    let countCreated = 0;
    let countUpdated = 0;
    let countSkipped = 0;

    for (const rawContact of contacts) {
      const name = (rawContact.name || rawContact.Nombre || '').trim();
      if (!name) {
        countSkipped++;
        continue;
      }

      const email = (rawContact.email || rawContact.Email || '').trim() || null;
      const phone = (rawContact.phone || rawContact.Telefono || rawContact.Teléfono || '').trim() || null;
      const company = (rawContact.company || rawContact.Empresa || '').trim() || null;
      const title = (rawContact.title || rawContact.Cargo || '').trim() || null;
      const whatsapp = (rawContact.whatsapp || rawContact.WhatsApp || phone || '').trim() || null;
      const location = (rawContact.location || rawContact.Ubicacion || rawContact.Ubicación || '').trim() || null;
      const stage = (rawContact.stage || rawContact.Etapa || 'Lead Prospect').trim();
      const investorType = (rawContact.investorType || rawContact.Tipo || 'Retail investor').trim();
      const source = (rawContact.source || rawContact.Fuente || 'Import').trim();
      const leadScore = rawContact.leadScore ? parseInt(rawContact.leadScore, 10) : 50;

      // Check for duplicate by email or phone within tenant
      let existing = null;
      if (email || phone) {
        existing = await prisma.contact.findFirst({
          where: {
            tenantId: effectiveTenantId || null,
            OR: [
              ...(email ? [{ email }] : []),
              ...(phone ? [{ phone }] : []),
            ],
          },
        });
      }

      if (existing) {
        // Update existing contact
        await prisma.contact.update({
          where: { id: existing.id },
          data: {
            company: company || existing.company,
            title: title || existing.title,
            whatsapp: whatsapp || existing.whatsapp,
            location: location || existing.location,
            stage: stage || existing.stage,
            updatedAt: new Date(),
          },
        });
        countUpdated++;
      } else {
        // Create new contact
        await prisma.contact.create({
          data: {
            tenantId: effectiveTenantId || null,
            name,
            company,
            title,
            email,
            phone,
            whatsapp,
            location,
            investorType,
            stage,
            source,
            leadScore,
            timelineActivities: {
              create: {
                type: 'NOTE',
                title: 'Contacto Importado en Lote',
                description: `Importado desde archivo CSV/Excel (Fuente: ${source}).`,
              },
            },
          },
        });
        countCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Proceso completado: ${countCreated} creados, ${countUpdated} actualizados, ${countSkipped} omitidos.`,
      stats: { countCreated, countUpdated, countSkipped, totalProcessed: contacts.length },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
