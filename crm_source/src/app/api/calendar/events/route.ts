import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, getEffectiveTenantId } from '@/lib/auth';

// Helper: Format Date for Google & Outlook Calendar URL parameters (YYYYMMDDTHHMMSSZ)
function formatToIsoCompact(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d+/g, '');
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get('tenantId');
    const contactId = searchParams.get('contactId');

    const effectiveTenantId = getEffectiveTenantId(session, requestedTenantId);

    const where: any = {};
    if (effectiveTenantId) {
      where.tenantId = effectiveTenantId;
    }
    if (contactId) {
      where.contactId = contactId;
    }

    let events = await prisma.calendarEvent.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Seed default upcoming meetings if database is fresh for this query
    if (events.length === 0 && effectiveTenantId) {
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const defaultTenant = await prisma.tenant.findUnique({ where: { id: effectiveTenantId } });
      const defaultContact = await prisma.contact.findFirst({ where: { tenantId: effectiveTenantId } });

      await prisma.calendarEvent.createMany({
        data: [
          {
            tenantId: effectiveTenantId,
            contactId: defaultContact?.id,
            title: `${defaultTenant?.name || 'Reunión'} - Presentación Ejecutiva`,
            description: 'Presentación ejecutiva e interacción con inversionistas clave.',
            startTime: nextHour,
            endTime: new Date(nextHour.getTime() + 45 * 60 * 1000),
            location: 'Sala Virtual Jitsi',
            meetingUrl: `https://meet.jit.si/${defaultTenant?.slug || 'the-core'}-Reunion`,
            syncSource: 'GOOGLE',
          },
          {
            tenantId: effectiveTenantId,
            contactId: defaultContact?.id,
            title: `Due Diligence & Estado de Proyecto`,
            description: 'Revisión técnica de avances y entrega de informes.',
            startTime: tomorrow,
            endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
            location: 'Sala Virtual CRM',
            meetingUrl: `https://meet.jit.si/${defaultTenant?.slug || 'the-core'}-DD`,
            syncSource: 'OUTLOOK',
          },
        ],
      });

      events = await prisma.calendarEvent.findMany({
        where,
        include: {
          contact: {
            select: { id: true, name: true, email: true, company: true },
          },
        },
        orderBy: { startTime: 'asc' },
      });
    }

    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { title, description, startTime, endTime, location, meetingUrl, tenantId: bodyTenantId, contactId, attendees } = body;

    if (!title || !startTime) {
      return NextResponse.json({ success: false, error: 'Title and Start Time are required' }, { status: 400 });
    }

    const effectiveTenantId = getEffectiveTenantId(session, bodyTenantId);

    const startDate = new Date(startTime);
    const endDate = endTime ? new Date(endTime) : new Date(startDate.getTime() + 60 * 60 * 1000);

    const event = await prisma.calendarEvent.create({
      data: {
        tenantId: effectiveTenantId || null,
        contactId,
        title,
        description,
        startTime: startDate,
        endTime: endDate,
        location: location || 'Jitsi IR Video Room',
        meetingUrl: meetingUrl || `https://meet.jit.si/TheCore-IR-${Date.now().toString().slice(-6)}`,
        syncSource: 'MANUAL',
        attendees: attendees || '',
      },
      include: {
        contact: true,
      },
    });

    // Generate 1-Click Sync URLs
    const startIso = formatToIsoCompact(startDate);
    const endIso = formatToIsoCompact(endDate);
    const encodedTitle = encodeURIComponent(title);
    const encodedDetails = encodeURIComponent(`${description || ''}\n\nMeeting Link: ${event.meetingUrl}`);
    const encodedLocation = encodeURIComponent(event.location || '');

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${startIso}/${endIso}&details=${encodedDetails}&location=${encodedLocation}`;
    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodedTitle}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${encodedDetails}&location=${encodedLocation}`;

    // Standard .ics iCalendar file format content
    const icsContent =
      `BEGIN:VCALENDAR\n` +
      `VERSION:2.0\n` +
      `PRODID:-//Outcrop Silver CRM//Calendar Sync//EN\n` +
      `BEGIN:VEVENT\n` +
      `UID:${event.id}@outcropsilver.com\n` +
      `DTSTAMP:${formatToIsoCompact(new Date())}\n` +
      `DTSTART:${startIso}\n` +
      `DTEND:${endIso}\n` +
      `SUMMARY:${title}\n` +
      `DESCRIPTION:${description || ''} - Link: ${event.meetingUrl}\n` +
      `LOCATION:${event.location || ''}\n` +
      `END:VEVENT\n` +
      `END:VCALENDAR`;

    return NextResponse.json({
      success: true,
      event,
      syncLinks: {
        googleUrl,
        outlookUrl,
        icsContent,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
