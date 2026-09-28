"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDailyBriefingCronCheck = exports.sendTestBriefing = exports.buildDailyBriefingText = void 0;
const index_1 = require("../index");
const openai_1 = __importDefault(require("openai"));
const axios_1 = __importDefault(require("axios"));
// Helper to format relative time or dates nicely
const formatDateRelative = (date) => {
    const diffTime = Math.abs(new Date().getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0)
        return 'hoy';
    if (diffDays === 1)
        return 'ayer';
    return `hace ${diffDays} días`;
};
// Dispatcher for Telegram
const sendTelegram = async (botToken, chatId, text) => {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await axios_1.default.post(url, {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
    });
    return response.data;
};
// Dispatcher for WhatsApp (Twilio)
const sendWhatsApp = async (accountSid, authToken, recipientNumber, text) => {
    // Twilio endpoint for sending WhatsApp messages
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    // Format numbers to ensure WhatsApp syntax (whatsapp:+12345678)
    const to = recipientNumber.startsWith('whatsapp:') ? recipientNumber : `whatsapp:${recipientNumber}`;
    // Twilio sandbox usually requires sending from sandbox number
    const from = 'whatsapp:+14155238886'; // Standard Twilio Sandbox number
    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', from);
    params.append('Body', text);
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const response = await axios_1.default.post(url, params.toString(), {
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    return response.data;
};
// Core Business Logic: Generate the daily briefing text using OpenAI
const buildDailyBriefingText = async () => {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey || openaiKey.includes('your-api-key-here')) {
        throw new Error('OPENAI_KEY_MISSING');
    }
    const openai = new openai_1.default({ apiKey: openaiKey });
    // Get Today's range (server timezone)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    // Fetch today's meetings
    const meetings = await index_1.prisma.meeting.findMany({
        where: {
            startTime: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        orderBy: { startTime: 'asc' },
        include: {
            attendees: {
                include: {
                    contact: {
                        include: {
                            organization: true
                        }
                    }
                }
            }
        }
    });
    let briefingContext = '';
    if (meetings.length > 0) {
        briefingContext += `Hoy tienes ${meetings.length} reuniones agendadas:\n\n`;
        for (const [index, meeting] of meetings.entries()) {
            const timeStr = meeting.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            briefingContext += `REUNIÓN ${index + 1}:\n`;
            briefingContext += `- Título: "${meeting.title}"\n`;
            briefingContext += `- Hora: ${timeStr}\n`;
            briefingContext += `- Lugar/Link: ${meeting.location || 'No especificado'}\n`;
            briefingContext += `- Descripción: ${meeting.description || 'Sin descripción'}\n`;
            const attendees = meeting.attendees.map(a => a.contact).filter(Boolean);
            if (attendees.length > 0) {
                briefingContext += `- Participantes:\n`;
                for (const contact of attendees) {
                    briefingContext += `  * Nombre: ${contact.name}\n`;
                    briefingContext += `    - Cargo: ${contact.role || 'No especificado'}\n`;
                    briefingContext += `    - Empresa: ${contact.organization?.name || 'No especificada'}\n`;
                    briefingContext += `    - Relación Score: ${contact.relationshipScore}%\n`;
                    briefingContext += `    - Hobbies: ${contact.hobbies || 'Ninguno registrado'}\n`;
                    briefingContext += `    - Rompehielo IA: ${contact.aiIcebreaker || 'Ninguno'}\n`;
                    briefingContext += `    - Contexto Estratégico: ${contact.aiStrategicContext || 'Ninguno'}\n`;
                    // Get last interaction
                    const lastInteraction = await index_1.prisma.interaction.findFirst({
                        where: { contactId: contact.id },
                        orderBy: { date: 'desc' }
                    });
                    if (lastInteraction) {
                        const timeAgo = formatDateRelative(lastInteraction.date);
                        briefingContext += `    - Última interacción: ${lastInteraction.type.toUpperCase()} (${timeAgo}) con resumen: "${lastInteraction.summary}"\n`;
                    }
                    else {
                        briefingContext += `    - Última interacción: Ninguna registrada\n`;
                    }
                }
            }
            else {
                briefingContext += `- Participantes: Ninguno registrado en el CRM\n`;
            }
            briefingContext += `\n`;
        }
    }
    else {
        // If no meetings, fetch cold/inactive key contacts to follow up
        const coldContacts = await index_1.prisma.contact.findMany({
            where: {
                relationshipScore: { lte: 60 }
            },
            take: 3,
            orderBy: { updatedAt: 'asc' },
            include: { organization: true }
        });
        briefingContext += `Hoy no tienes reuniones agendadas en tu calendario de The Core.\n\n`;
        briefingContext += `Contactos sugeridos para reconectar (baja interacción reciente):\n`;
        coldContacts.forEach(c => {
            briefingContext += `- ${c.name} (${c.role || 'Sin puesto'} en ${c.organization?.name || 'Sin empresa'}). Score: ${c.relationshipScore}%. Rompehielo sugerido: ${c.aiIcebreaker || 'Reconectar saludando.'}\n`;
        });
    }
    const systemPrompt = `Eres el asistente ejecutivo de Irwin (CEO). Tu tarea es redactar un "Briefing Matutino" diario sumamente elegante, conciso y de alto valor a partir de los datos provistos.
  
  REGLAS DE REDACCIÓN:
  1. Sé extremadamente profesional, directo y dinámico. A un CEO le interesa la información accionable y rápida de leer.
  2. Formatea el texto de forma clara utilizando Markdown estándar (usa asteriscos simples o dobles para negritas: *texto* o **texto**, listas guionadas y saltos de línea limpios).
  3. Si hay reuniones, resume la agenda del día. Para cada reunión resalta:
     - Hora y título.
     - Quién participa (Nombre, puesto, empresa) y la salud de la relación (score).
     - La sugerencia de rompehielo IA más potente basada en sus hobbies o notas.
     - Un recordatorio rápido del último tema que hablaron.
  4. Si no hay reuniones, ofrece un mensaje de buenos días estimulante y sugiere reconectar con los contactos listados que tienen el score bajo.
  
  Escribe el resultado directamente, sin preámbulos explicativos de tu parte ni firmas robóticas. Comienza de inmediato con el saludo ejecutivo.`;
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Genera el briefing diario con los siguientes datos del CRM:\n\n${briefingContext}` }
        ]
    });
    return completion.choices[0]?.message?.content || 'Error al generar el briefing ejecutivo.';
};
exports.buildDailyBriefingText = buildDailyBriefingText;
// POST /api/briefings/test
// Triggers an immediate briefing dispatch for testing
const sendTestBriefing = async (req, res) => {
    try {
        console.log('[Briefing] Manual test request received.');
        // 1. Fetch briefing configurations
        const enabledProv = await index_1.prisma.integration.findUnique({ where: { key: 'briefing_provider' } });
        const tgToken = await index_1.prisma.integration.findUnique({ where: { key: 'telegram_bot_token' } });
        const tgChatId = await index_1.prisma.integration.findUnique({ where: { key: 'telegram_chat_id' } });
        const waSid = await index_1.prisma.integration.findUnique({ where: { key: 'whatsapp_twilio_sid' } });
        const waToken = await index_1.prisma.integration.findUnique({ where: { key: 'whatsapp_twilio_token' } });
        const waRecipient = await index_1.prisma.integration.findUnique({ where: { key: 'whatsapp_recipient_number' } });
        const provider = enabledProv?.value || 'telegram';
        // Generate text
        const text = await (0, exports.buildDailyBriefingText)();
        let dispatchResult = null;
        if (provider === 'telegram') {
            if (!tgToken?.value || !tgChatId?.value) {
                return res.status(400).json({ error: 'Configuración de Telegram incompleta (Bot Token o Chat ID faltante).' });
            }
            dispatchResult = await sendTelegram(tgToken.value, tgChatId.value, text);
        }
        else if (provider === 'whatsapp') {
            if (!waSid?.value || !waToken?.value || !waRecipient?.value) {
                return res.status(400).json({ error: 'Configuración de WhatsApp (Twilio) incompleta.' });
            }
            dispatchResult = await sendWhatsApp(waSid.value, waToken.value, waRecipient.value, text);
        }
        else {
            return res.status(400).json({ error: 'Proveedor de envío no compatible.' });
        }
        res.json({
            success: true,
            provider,
            dispatchResult,
            message: 'Briefing enviado exitosamente.'
        });
    }
    catch (error) {
        console.error('[Briefing Test] Error sending manually:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.sendTestBriefing = sendTestBriefing;
// Scheduler logic to run daily check
const runDailyBriefingCronCheck = async () => {
    try {
        const isEnabled = await index_1.prisma.integration.findUnique({ where: { key: 'briefing_enabled' } });
        if (!isEnabled || isEnabled.value !== 'true' || !isEnabled.isEnabled) {
            return; // Briefing disabled
        }
        // Get time to send
        const timeConfig = await index_1.prisma.integration.findUnique({ where: { key: 'briefing_time' } });
        const targetTime = timeConfig?.value || '07:30';
        const now = new Date();
        const currentHourMin = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        if (currentHourMin === targetTime) {
            // Check if already sent today
            const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const lastSentRecord = await index_1.prisma.integration.findUnique({ where: { key: 'last_briefing_sent_date' } });
            if (lastSentRecord && lastSentRecord.value === todayStr) {
                // Already sent today
                return;
            }
            console.log(`[Briefing Cron] Target time reached (${targetTime}). Generating and sending daily briefing...`);
            // Generate briefing
            const text = await (0, exports.buildDailyBriefingText)();
            // Send via enabled provider
            const enabledProv = await index_1.prisma.integration.findUnique({ where: { key: 'briefing_provider' } });
            const provider = enabledProv?.value || 'telegram';
            if (provider === 'telegram') {
                const tgToken = await index_1.prisma.integration.findUnique({ where: { key: 'telegram_bot_token' } });
                const tgChatId = await index_1.prisma.integration.findUnique({ where: { key: 'telegram_chat_id' } });
                if (tgToken?.value && tgChatId?.value) {
                    await sendTelegram(tgToken.value, tgChatId.value, text);
                    console.log('[Briefing Cron] Telegram briefing dispatched.');
                }
            }
            else if (provider === 'whatsapp') {
                const waSid = await index_1.prisma.integration.findUnique({ where: { key: 'whatsapp_twilio_sid' } });
                const waToken = await index_1.prisma.integration.findUnique({ where: { key: 'whatsapp_twilio_token' } });
                const waRecipient = await index_1.prisma.integration.findUnique({ where: { key: 'whatsapp_recipient_number' } });
                if (waSid?.value && waToken?.value && waRecipient?.value) {
                    await sendWhatsApp(waSid.value, waToken.value, waRecipient.value, text);
                    console.log('[Briefing Cron] WhatsApp briefing dispatched.');
                }
            }
            // Save last sent date
            await index_1.prisma.integration.upsert({
                where: { key: 'last_briefing_sent_date' },
                update: { value: todayStr },
                create: { key: 'last_briefing_sent_date', value: todayStr }
            });
        }
    }
    catch (err) {
        console.error('[Briefing Cron] Execution failed:', err.message);
    }
};
exports.runDailyBriefingCronCheck = runDailyBriefingCronCheck;
