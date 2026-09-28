"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectCalendar = exports.getMeetings = exports.syncCalendar = exports.googleCallback = exports.googleAuth = exports.getStatus = exports.saveConfig = void 0;
const index_1 = require("../index");
const googleapis_1 = require("googleapis");
const node_ical_1 = __importDefault(require("node-ical"));
const axios_1 = __importDefault(require("axios"));
const openai_1 = __importDefault(require("openai"));
// Setup Google OAuth2 client
const getOAuth2Client = () => {
    return new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
};
// ─── Background IA Enrichment Helper ──────────────────────────────────────────
async function runBackgroundInvestigate(contactId, name) {
    try {
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey || openaiKey.includes('your-api-key-here')) {
            console.warn('[Calendar Sync] Skipping background investigation: No real OpenAI API key');
            return;
        }
        const openai = new openai_1.default({ apiKey: openaiKey });
        const tavilyKey = process.env.TAVILY_API_KEY;
        let searchResults = '';
        if (tavilyKey && !tavilyKey.includes('placeholder')) {
            try {
                const query = `"${name}" professional profile bio linkedin`;
                const tavilyResponse = await fetch('https://api.tavily.com/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: tavilyKey,
                        query,
                        search_depth: 'basic',
                        include_answer: true,
                        max_results: 3
                    }),
                });
                if (tavilyResponse.ok) {
                    const searchData = await tavilyResponse.json();
                    searchResults = `Answer: ${searchData.answer}\nResults: ${searchData.results.map((r) => r.content).join('\n')}`;
                }
            }
            catch (searchError) {
                console.error('[Calendar Sync] Tavily search failed in background:', searchError);
            }
        }
        const systemPrompt = `You are a high-level executive assistant AI. 
Analyze the provided web search context about the person "${name}".
Extract or infer details to build a highly precise CRM profile.
Return ONLY a valid JSON object matching this structure:
{
  "location": "Physical location or city/country (string or null)",
  "hobbies": ["array of strings representing hobbies/interests"],
  "notes": "A brief summary of their current focus or recent news",
  "role": "Their exact current job title if found, otherwise null",
  "icebreaker": "A specific sentence to break the ice based on their hobbies or notes"
}`;
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: searchResults ? `Search context:\n${searchResults}` : `No internet connection. Use pre-trained knowledge to infer a profile for ${name}.` }
            ],
            response_format: { type: "json_object" }
        });
        const content = completion.choices[0]?.message?.content;
        if (content) {
            const parsed = JSON.parse(content);
            await index_1.prisma.contact.update({
                where: { id: contactId },
                data: {
                    location: parsed.location || null,
                    role: parsed.role || null,
                    hobbies: Array.isArray(parsed.hobbies) ? parsed.hobbies.join(', ') : null,
                    personalNotes: parsed.notes || null,
                    aiIcebreaker: parsed.icebreaker || null,
                    aiKeyInterests: Array.isArray(parsed.hobbies) ? parsed.hobbies.join(', ') : null
                }
            });
            console.log(`[Calendar Sync] Successfully enriched contact: ${name} (${contactId})`);
        }
    }
    catch (err) {
        console.error('[Calendar Sync] Background investigation failed for', name, err);
    }
}
// ─── Handlers ────────────────────────────────────────────────────────────────
const saveConfig = async (req, res) => {
    try {
        const { provider, webcalUrl } = req.body;
        if (!provider || (provider !== 'apple' && provider !== 'google')) {
            return res.status(400).json({ error: 'Invalid provider. Must be "apple" or "google".' });
        }
        if (provider === 'apple') {
            if (!webcalUrl?.trim()) {
                return res.status(400).json({ error: 'Webcal URL is required for Apple Calendar' });
            }
            let cleanUrl = webcalUrl.trim();
            if (cleanUrl.startsWith('webcal://')) {
                cleanUrl = 'https://' + cleanUrl.substring(9);
            }
            await index_1.prisma.calendarConfig.upsert({
                where: { id: 'singleton' },
                update: { provider: 'apple', webcalUrl: cleanUrl },
                create: { id: 'singleton', provider: 'apple', webcalUrl: cleanUrl }
            });
            return res.json({ success: true, provider: 'apple', webcalUrl: cleanUrl });
        }
        // Google config initialization
        await index_1.prisma.calendarConfig.upsert({
            where: { id: 'singleton' },
            update: { provider: 'google' },
            create: { id: 'singleton', provider: 'google' }
        });
        res.json({ success: true, provider: 'google' });
    }
    catch (error) {
        console.error('Error saving calendar config:', error);
        res.status(500).json({ error: 'Failed to save calendar configuration' });
    }
};
exports.saveConfig = saveConfig;
const getStatus = async (req, res) => {
    try {
        const config = await index_1.prisma.calendarConfig.findUnique({
            where: { id: 'singleton' }
        });
        if (!config) {
            return res.json({ connected: false });
        }
        res.json({
            connected: true,
            provider: config.provider,
            webcalUrl: config.webcalUrl,
            lastSyncedAt: config.lastSyncedAt
        });
    }
    catch (error) {
        console.error('Error getting calendar status:', error);
        res.status(500).json({ error: 'Failed to retrieve calendar status' });
    }
};
exports.getStatus = getStatus;
const googleAuth = async (req, res) => {
    try {
        const client = getOAuth2Client();
        const url = client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/calendar.readonly'],
            prompt: 'consent'
        });
        res.redirect(url);
    }
    catch (error) {
        console.error('Google Auth redirect error:', error);
        res.status(500).send('Failed to start Google Auth');
    }
};
exports.googleAuth = googleAuth;
const googleCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code)
            return res.status(400).send('Code is missing');
        const client = getOAuth2Client();
        const { tokens } = await client.getToken(code);
        await index_1.prisma.calendarConfig.upsert({
            where: { id: 'singleton' },
            update: {
                provider: 'google',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null
            },
            create: {
                id: 'singleton',
                provider: 'google',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null
            }
        });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/?connected=google`);
    }
    catch (error) {
        console.error('Google Auth callback error:', error);
        res.status(500).send('Authentication failed');
    }
};
exports.googleCallback = googleCallback;
const syncCalendar = async (req, res) => {
    try {
        const config = await index_1.prisma.calendarConfig.findUnique({
            where: { id: 'singleton' }
        });
        if (!config) {
            return res.status(400).json({ error: 'Calendar is not configured' });
        }
        let parsedEvents = [];
        // ─── APPLE CALENDAR (iCloud ICS parsing) ──────────────────────────────────
        if (config.provider === 'apple') {
            if (!config.webcalUrl) {
                return res.status(400).json({ error: 'Apple Calendar URL missing' });
            }
            console.log('[Calendar Sync] Syncing Apple Calendar from Webcal...');
            const response = await axios_1.default.get(config.webcalUrl);
            const rawEvents = node_ical_1.default.parseICS(response.data);
            for (const key in rawEvents) {
                if (rawEvents.hasOwnProperty(key)) {
                    const ev = rawEvents[key];
                    if (ev.type === 'VEVENT') {
                        const start = ev.start ? new Date(ev.start) : null;
                        const end = ev.end ? new Date(ev.end) : null;
                        if (start && end) {
                            // Parse attendees from iCal event
                            const attendeesList = [];
                            const addAttendee = (rawAtt) => {
                                let email = '';
                                let name = '';
                                if (typeof rawAtt === 'string') {
                                    if (rawAtt.toLowerCase().startsWith('mailto:')) {
                                        email = rawAtt.substring(7);
                                    }
                                }
                                else if (rawAtt && typeof rawAtt === 'object') {
                                    const val = rawAtt.val || '';
                                    if (val.toLowerCase().startsWith('mailto:')) {
                                        email = val.substring(7);
                                    }
                                    name = rawAtt.params?.CN || '';
                                }
                                if (email && email.includes('@')) {
                                    attendeesList.push({
                                        name: name || email.split('@')[0],
                                        email: email.toLowerCase().trim()
                                    });
                                }
                            };
                            if (ev.attendee) {
                                if (Array.isArray(ev.attendee)) {
                                    ev.attendee.forEach(addAttendee);
                                }
                                else {
                                    addAttendee(ev.attendee);
                                }
                            }
                            if (ev.organizer) {
                                addAttendee(ev.organizer);
                            }
                            // Deduplicate attendees by email
                            const uniqueAttendees = Array.from(new Map(attendeesList.map(a => [a.email, a])).values());
                            parsedEvents.push({
                                title: ev.summary || 'Sin Título',
                                startTime: start,
                                endTime: end,
                                location: ev.location || null,
                                description: ev.description || null,
                                attendees: uniqueAttendees
                            });
                        }
                    }
                }
            }
        }
        // ─── GOOGLE CALENDAR ──────────────────────────────────────────────────────
        else if (config.provider === 'google') {
            if (!config.refreshToken) {
                return res.status(400).json({ error: 'Google refresh token missing' });
            }
            console.log('[Calendar Sync] Syncing Google Calendar...');
            const client = getOAuth2Client();
            client.setCredentials({
                access_token: config.accessToken || undefined,
                refresh_token: config.refreshToken,
                expiry_date: config.expiryDate ? config.expiryDate.getTime() : undefined
            });
            // Google auto-refreshes if refresh_token is set
            const calendar = googleapis_1.google.calendar({ version: 'v3', auth: client });
            // Fetch last 7 days and next 7 days of events
            const timeMin = new Date();
            timeMin.setDate(timeMin.getDate() - 7);
            const timeMax = new Date();
            timeMax.setDate(timeMax.getDate() + 7);
            const gRes = await calendar.events.list({
                calendarId: 'primary',
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                singleEvents: true,
                orderBy: 'startTime'
            });
            const items = gRes.data.items || [];
            for (const item of items) {
                const startStr = item.start?.dateTime || item.start?.date;
                const endStr = item.end?.dateTime || item.end?.date;
                if (startStr && endStr) {
                    const attendeesList = [];
                    if (item.attendees) {
                        for (const att of item.attendees) {
                            if (att.email) {
                                attendeesList.push({
                                    name: att.displayName || att.email.split('@')[0],
                                    email: att.email.toLowerCase().trim()
                                });
                            }
                        }
                    }
                    if (item.organizer && item.organizer.email) {
                        attendeesList.push({
                            name: item.organizer.displayName || item.organizer.email.split('@')[0],
                            email: item.organizer.email.toLowerCase().trim()
                        });
                    }
                    // Deduplicate
                    const uniqueAttendees = Array.from(new Map(attendeesList.map(a => [a.email, a])).values());
                    parsedEvents.push({
                        title: item.summary || 'Sin Título',
                        startTime: new Date(startStr),
                        endTime: new Date(endStr),
                        location: item.location || null,
                        description: item.description || null,
                        attendees: uniqueAttendees
                    });
                }
            }
            // Save refreshed tokens if updated
            const latestCredentials = client.credentials;
            if (latestCredentials.access_token) {
                await index_1.prisma.calendarConfig.update({
                    where: { id: 'singleton' },
                    data: {
                        accessToken: latestCredentials.access_token,
                        expiryDate: latestCredentials.expiry_date ? new Date(latestCredentials.expiry_date) : null
                    }
                });
            }
        }
        // ─── DATABASE IMPORT & SYNC ───────────────────────────────────────────────
        let contactsCreatedCount = 0;
        let meetingsSyncedCount = 0;
        for (const ev of parsedEvents) {
            // 1. Check if meeting already exists at that exact start time and title
            let meeting = await index_1.prisma.meeting.findFirst({
                where: {
                    title: ev.title,
                    startTime: ev.startTime
                }
            });
            if (!meeting) {
                meeting = await index_1.prisma.meeting.create({
                    data: {
                        title: ev.title,
                        startTime: ev.startTime,
                        endTime: ev.endTime,
                        location: ev.location,
                        description: ev.description,
                        status: ev.startTime < new Date() ? 'completed' : 'upcoming'
                    }
                });
                meetingsSyncedCount++;
            }
            // 2. Process attendees
            for (const att of ev.attendees) {
                // Find if contact exists
                let contact = await index_1.prisma.contact.findFirst({
                    where: { email: att.email }
                });
                let isNew = false;
                if (!contact) {
                    // Auto-create missing contact (Phase 1)
                    contact = await index_1.prisma.contact.create({
                        data: {
                            name: att.name,
                            email: att.email,
                            captureSource: 'calendar_sync',
                            capturedAt: new Date(),
                            relationshipScore: 50
                        }
                    });
                    contactsCreatedCount++;
                    isNew = true;
                    // Trigger background AI enrichment (Phase 2)
                    runBackgroundInvestigate(contact.id, att.name);
                }
                // Link Attendee to Meeting if not already linked
                const attendeeLink = await index_1.prisma.meetingAttendee.findUnique({
                    where: {
                        meetingId_contactId: {
                            meetingId: meeting.id,
                            contactId: contact.id
                        }
                    }
                });
                if (!attendeeLink) {
                    await index_1.prisma.meetingAttendee.create({
                        data: {
                            meetingId: meeting.id,
                            contactId: contact.id,
                            role: 'attendee'
                        }
                    });
                }
                // Link Interaction if not already linked (Phase 3)
                const interactionLink = await index_1.prisma.interaction.findFirst({
                    where: {
                        contactId: contact.id,
                        meetingId: meeting.id
                    }
                });
                if (!interactionLink) {
                    await index_1.prisma.interaction.create({
                        data: {
                            type: 'meeting',
                            date: ev.startTime,
                            summary: `Reunión de calendario: ${ev.title}`,
                            location: ev.location,
                            contactId: contact.id,
                            meetingId: meeting.id,
                            sentiment: 'neutral'
                        }
                    });
                }
            }
        }
        // Update last sync time
        await index_1.prisma.calendarConfig.update({
            where: { id: 'singleton' },
            data: { lastSyncedAt: new Date() }
        });
        res.json({
            success: true,
            provider: config.provider,
            totalEventsFound: parsedEvents.length,
            meetingsSynced: meetingsSyncedCount,
            contactsCreated: contactsCreatedCount,
            lastSyncedAt: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Calendar Sync Error:', error);
        res.status(500).json({ error: error.message || 'Failed to sync calendar' });
    }
};
exports.syncCalendar = syncCalendar;
const getMeetings = async (req, res) => {
    try {
        const meetings = await index_1.prisma.meeting.findMany({
            orderBy: { startTime: 'asc' },
            include: {
                attendees: {
                    include: {
                        contact: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                relationshipScore: true,
                                role: true,
                                organization: true,
                                aiIcebreaker: true,
                                personalNotes: true
                            }
                        }
                    }
                }
            }
        });
        // Format meetings list for frontend convenience
        const formatted = meetings.map((m) => ({
            id: m.id,
            title: m.title,
            startTime: m.startTime,
            endTime: m.endTime,
            location: m.location,
            description: m.description,
            status: m.status,
            attendees: m.attendees.map((a) => ({
                id: a.contact.id,
                name: a.contact.name,
                email: a.contact.email,
                relationshipScore: a.contact.relationshipScore,
                role: a.contact.role,
                company: a.contact.organization?.name ?? null,
                aiIcebreaker: a.contact.aiIcebreaker,
                personalNotes: a.contact.personalNotes
            }))
        }));
        res.json(formatted);
    }
    catch (error) {
        console.error('Error fetching calendar meetings:', error);
        res.status(500).json({ error: 'Failed to fetch meetings' });
    }
};
exports.getMeetings = getMeetings;
const disconnectCalendar = async (req, res) => {
    try {
        await index_1.prisma.calendarConfig.deleteMany();
        // Also optional: we could delete imported meetings, but keeping them is better for history.
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error disconnecting calendar:', error);
        res.status(500).json({ error: 'Failed to disconnect calendar' });
    }
};
exports.disconnectCalendar = disconnectCalendar;
