import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper: Simple iCal .ics text parser for Summary, DTStart, DTEnd
function parseIcsText(icsData: string) {
  const events: Array<{ title: string; startTime: Date; endTime: Date; description?: string; location?: string }> = [];
  const vevents = icsData.split('BEGIN:VEVENT');

  for (let i = 1; i < vevents.length; i++) {
    const chunk = vevents[i].split('END:VEVENT')[0];
    
    const summaryMatch = chunk.match(/SUMMARY:(.*)/i);
    const dtstartMatch = chunk.match(/DTSTART(?:;[^:]+)?:(.*)/i);
    const dtendMatch = chunk.match(/DTEND(?:;[^:]+)?:(.*)/i);
    const descMatch = chunk.match(/DESCRIPTION:(.*)/i);
    const locMatch = chunk.match(/LOCATION:(.*)/i);

    if (summaryMatch && dtstartMatch) {
      const title = summaryMatch[1].trim();
      const rawStart = dtstartMatch[1].trim();
      const rawEnd = dtendMatch ? dtendMatch[1].trim() : rawStart;

      // Parse YYYYMMDDTHHMMSSZ or YYYYMMDD
      let startYear = parseInt(rawStart.substring(0, 4), 10);
      let startMonth = parseInt(rawStart.substring(4, 6), 10) - 1;
      let startDay = parseInt(rawStart.substring(6, 8), 10);
      let startHour = rawStart.includes('T') ? parseInt(rawStart.substring(9, 11), 10) : 9;
      let startMin = rawStart.includes('T') ? parseInt(rawStart.substring(11, 13), 10) : 0;

      const startDate = new Date(Date.UTC(startYear, startMonth, startDay, startHour, startMin));
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      events.push({
        title,
        startTime: startDate,
        endTime: endDate,
        description: descMatch ? descMatch[1].trim() : undefined,
        location: locMatch ? locMatch[1].trim() : 'External iCal Calendar',
      });
    }
  }

  return events;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { icalUrl, tenantId } = body;

    if (!icalUrl || !icalUrl.startsWith('http')) {
      return NextResponse.json({ success: false, error: 'Valid iCal URL (http/https) is required' }, { status: 400 });
    }

    // Fetch live .ics feed from Google / Outlook / Apple Calendar
    const res = await fetch(icalUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (OutcropSilverCRM Calendar Sync)' },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Failed to fetch iCal feed (Status ${res.status})` }, { status: 400 });
    }

    const icsText = await res.text();
    const parsedEvents = parseIcsText(icsText);

    if (parsedEvents.length === 0) {
      return NextResponse.json({ success: false, error: 'No upcoming events found in provided iCal feed' }, { status: 400 });
    }

    let createdCount = 0;
    for (const evt of parsedEvents) {
      await prisma.calendarEvent.create({
        data: {
          tenantId,
          title: evt.title,
          description: evt.description,
          startTime: evt.startTime,
          endTime: evt.endTime,
          location: evt.location,
          syncSource: 'ICAL_FEED',
          meetingUrl: 'https://meet.jit.si/OutcropSilver-IR-Room',
        },
      });
      createdCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${createdCount} events from your external calendar feed!`,
      eventsCount: createdCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
