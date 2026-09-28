/**
 * WhatsApp Message Processor - Multi-Tenant SaaS
 * Natural Conversational AI Engine & Executive CRM Assistant
 * Powered by Gemini 2.5 Flash Vision & Natural Language Intelligence
 */

import { prisma } from '@/lib/prisma';
import * as EvoApi from '@/lib/evolution-api';
import { parseCardImage, ExtractedCardInfo } from '@/lib/card-ocr';
import path from 'path';
import fs from 'fs';

// In-memory conversation state keyed by `${tenantId}:${remoteDigits}`
const conversationStates = new Map<string, { step: string; contactId?: string; data: Record<string, any>; ts: number }>();

export interface InboundMessage {
  instanceName: string;
  tenantId: string;
  remoteJid: string;
  remoteJidAlt?: string;
  pushName: string;
  text: string;
  isImage?: boolean;
  isAudio?: boolean;
  imageBase64?: string | null;
  audioBase64?: string | null;
  fromMe: boolean;
  msgId: string;
  messageKey?: any;
  rawMessage?: any;
}

// ─────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────
export async function processMessage(msg: InboundMessage) {
  if (msg.fromMe) return;

  const { instanceName, tenantId, remoteJid, remoteJidAlt, pushName, text, msgId, messageKey } = msg;
  let { imageBase64, audioBase64, isImage, isAudio } = msg;
  const remoteDigits = remoteJid.replace(/\D/g, '');
  const altDigits = (remoteJidAlt || '').replace(/\D/g, '');
  const lowerText = text.toLowerCase().trim();

  // Always download full-resolution original image from Evolution API
  if (isImage) {
    try {
      const fullMedia = await EvoApi.downloadMediaBase64(instanceName, msg.rawMessage || messageKey);
      if (fullMedia) {
        imageBase64 = fullMedia;
      }
    } catch (e: any) {
      console.error('Error downloading media from Evolution API:', e?.message);
    }
  }

  // If audio was flagged, download audio media from Evolution API
  if (isAudio) {
    try {
      const fullAudio = await EvoApi.downloadMediaBase64(instanceName, msg.rawMessage || messageKey);
      if (fullAudio) {
        audioBase64 = fullAudio;
      }
    } catch (e: any) {}
  }

  // ── Check whitelist / authorization ──────────────────────────────────
  const whitelist = await prisma.whatsAppWhitelist.findMany({
    where: { isActive: true },
  });

  const matchedAdmin = whitelist.find((w) => {
    const d = w.phoneNumber.replace(/\D/g, '');
    if (!d) return false;
    return (
      (altDigits && (altDigits.endsWith(d) || d.endsWith(altDigits) || altDigits === d)) ||
      (remoteDigits && (remoteDigits.endsWith(d) || d.endsWith(remoteDigits) || remoteDigits === d))
    );
  });

  const matched = whitelist.length === 0 || !!matchedAdmin;

  // Save inbound message log
  await prisma.whatsAppMessage.create({
    data: {
      tenantId,
      fromNumber: altDigits || remoteDigits,
      senderName: pushName || matchedAdmin?.name || 'WhatsApp User',
      toNumber: 'CRM Bot',
      message: text || (isImage || imageBase64 ? '📷 [Foto Tarjeta]' : isAudio || audioBase64 ? '🎙️ [Nota de Voz]' : '[Media]'),
      direction: 'INBOUND',
    },
  }).catch(() => {});

  if (!matched) {
    await reply(
      instanceName,
      remoteJid,
      tenantId,
      `🔒 *Outcrop Silver CRM Security*\n\nHola. No estás autorizado para operar este bot ejecutivo. Por favor contacta al administrador.`
    );
    return;
  }

  // Resolve true name of the sender from whitelist or profile name (no hardcoded defaults)
  let firstName = '';
  if (matchedAdmin?.name) {
    firstName = matchedAdmin.name.split(' ')[0];
  } else if (pushName && !['Brainware', 'WhatsApp User', 'Você', 'Yo', 'null', 'undefined'].includes(pushName.trim())) {
    firstName = pushName.trim().split(' ')[0];
  }

  const stateKey = `${tenantId}:${remoteDigits}`;
  const currentState = conversationStates.get(stateKey);

  // ── Cancel Command ───────────────────────────────────────────────────
  if (['cancelar', 'cancel', '/cancel', 'salir'].includes(lowerText)) {
    conversationStates.delete(stateKey);
    await reply(instanceName, remoteJid, tenantId, `❌ *Proceso cancelado.* ¿En qué más te puedo colaborar hoy?`);
    return;
  }

  const targetJid = remoteJidAlt && remoteJidAlt.includes('@s.whatsapp.net') ? remoteJidAlt : remoteJid;

  // ── 1. BUSINESS CARD SCANNER: FRONT IMAGE (INSTANT SAVE) ───────────────
  if (isImage || imageBase64) {
    // If we're waiting for back-of-card enrichment, run OCR to decide:
    // same card (back) vs. new card (different person).
    if (currentState?.step === 'AWAITING_ENRICHMENT') {
      const currentContactName: string = currentState.data?.name || '';

      // Run OCR on the incoming image to detect who is on this card
      let newOcr: Partial<ExtractedCardInfo> = {};
      if (imageBase64) {
        try {
          const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
          const buffer = Buffer.from(cleanBase64, 'base64');
          newOcr = await parseCardImage(buffer, pushName);
        } catch (e) {}
      }

      const newName = (newOcr.name || '').trim();
      const GENERIC_NAMES = ['contacto tarjeta', 'contacto', 'tarjeta', ''];
      const isGenericName = GENERIC_NAMES.includes(newName.toLowerCase());

      // Compare: if OCR found a real, clearly different name → it's a new contact
      const namesMatch = isGenericName ||
        !currentContactName ||
        currentContactName.toLowerCase() === newName.toLowerCase() ||
        currentContactName.toLowerCase().includes(newName.toLowerCase().split(' ')[0]) ||
        newName.toLowerCase().includes(currentContactName.toLowerCase().split(' ')[0]);

      if (!namesMatch) {
        // Different person detected — ask the user before acting
        conversationStates.set(stateKey, {
          step: 'CONFIRM_NEW_CONTACT',
          contactId: currentState.contactId,
          data: {
            ...currentState.data,
            pendingImageBase64: imageBase64,
            pendingOcr: newOcr,
          },
          ts: Date.now(),
        });

        await reply(
          instanceName,
          targetJid,
          tenantId,
          `🔍 *Detecté que esta tarjeta parece ser de una persona diferente:*\n\n` +
          `• Contacto actual: *${currentContactName}*\n` +
          `• Nueva tarjeta: *${newName}*${newOcr.company ? ` (${newOcr.company})` : ''}\n\n` +
          `¿Qué deseas hacer?\n` +
          `• Escribe *Nuevo* para crear un nuevo contacto\n` +
          `• Escribe *Reverso* para asociar esta imagen como reverso de la tarjeta de ${currentContactName}`
        );
        return;
      }

      // Names match (or couldn't confirm) → treat as back of current card
      let backPath: string | null = null;
      if (imageBase64) {
        backPath = await saveMedia(imageBase64, 'card_back', 'jpg');
      }

      if (currentState.contactId && backPath) {
        await prisma.businessCard.updateMany({
          where: { contactId: currentState.contactId },
          data: {
            backImageUrl: backPath,
            extractedTextBack: newOcr.rawText || 'Back Card Image',
          },
        }).catch(() => {});

        if (newOcr.location || newOcr.website || newOcr.phone || newOcr.email) {
          await prisma.contact.update({
            where: { id: currentState.contactId },
            data: {
              location: newOcr.location || undefined,
              phone: newOcr.phone || undefined,
              email: newOcr.email || undefined,
            },
          }).catch(() => {});
        }
      }

      conversationStates.set(stateKey, {
        step: 'AWAITING_ENRICHMENT',
        contactId: currentState.contactId,
        data: { ...currentState.data, backImageUrl: backPath },
        ts: Date.now(),
      });

      await reply(
        instanceName,
        targetJid,
        tenantId,
        `✅ *¡Foto del Reverso Recibida y Asociada al Contacto!*\n\n` +
        `🎙️ ¿Deseas agregar una **nota de voz** con acuerdos de la reunión?\n` +
        `Envía un audio ahora o escribe *"Listo"* para terminar.`
      );
      return;
    }

    // No active state, or state is SCAN_FRONT/IDLE → new card scan
    try {
      await handleInstantCardScan(instanceName, targetJid, tenantId, stateKey, imageBase64, pushName, firstName);
    } catch (e: any) {
      console.error('Error in handleInstantCardScan:', e);
    }
    return;
  }

  // ── 2. CONFIRM NEW CONTACT vs REVERSO ────────────────────────────────
  if (currentState?.step === 'CONFIRM_NEW_CONTACT') {
    const isNuevo = ['nuevo', 'si', 'sí', 'yes', 'new', 'nueva', 'crear', 'create'].includes(lowerText.trim());
    const isReverso = ['reverso', 'no', 'back', 'atras', 'atrás', 'mismo', 'mismo contacto'].includes(lowerText.trim());

    if (isNuevo) {
      // Create a new contact from the OCR data that was already extracted
      const pendingOcr: Partial<ExtractedCardInfo> = currentState.data?.pendingOcr || {};
      const pendingImageBase64: string | null = currentState.data?.pendingImageBase64 || null;

      conversationStates.delete(stateKey); // Clear state before creating new contact

      await handleInstantCardScan(
        instanceName,
        targetJid,
        tenantId,
        stateKey,
        pendingImageBase64,
        pushName,
        firstName,
      );
      return;
    }

    if (isReverso) {
      // Save the pending image as back of the current contact
      const pendingImageBase64: string | null = currentState.data?.pendingImageBase64 || null;
      const pendingOcr: Partial<ExtractedCardInfo> = currentState.data?.pendingOcr || {};
      let backPath: string | null = null;

      if (pendingImageBase64) {
        backPath = await saveMedia(pendingImageBase64, 'card_back', 'jpg');
      }

      if (currentState.contactId && backPath) {
        await prisma.businessCard.updateMany({
          where: { contactId: currentState.contactId },
          data: {
            backImageUrl: backPath,
            extractedTextBack: pendingOcr.rawText || 'Back Card Image',
          },
        }).catch(() => {});

        if (pendingOcr.location || pendingOcr.website || pendingOcr.phone || pendingOcr.email) {
          await prisma.contact.update({
            where: { id: currentState.contactId },
            data: {
              location: pendingOcr.location || undefined,
              phone: pendingOcr.phone || undefined,
              email: pendingOcr.email || undefined,
            },
          }).catch(() => {});
        }
      }

      conversationStates.set(stateKey, {
        step: 'AWAITING_ENRICHMENT',
        contactId: currentState.contactId,
        data: { ...currentState.data, backImageUrl: backPath },
        ts: Date.now(),
      });

      await reply(
        instanceName,
        targetJid,
        tenantId,
        `✅ *¡Foto del Reverso Asociada al Contacto!*\n\n` +
        `🎙️ ¿Deseas agregar una **nota de voz** con acuerdos de la reunión?\n` +
        `Envía un audio ahora o escribe *"Listo"* para terminar.`
      );
      return;
    }

    // Unrecognized response — remind the user
    await reply(
      instanceName,
      targetJid,
      tenantId,
      `Por favor responde:\n• *Nuevo* — para crear un nuevo contacto\n• *Reverso* — para asociar como reverso de la tarjeta actual`
    );
    return;
  }

  // ── 3. VOICE NOTE ENRICHMENT OR VOICE COMMAND ─────────────────────────

  if (isAudio || audioBase64) {
    let audioPath: string | null = null;
    let transcript = '';

    if (audioBase64) {
      audioPath = await saveMedia(audioBase64, 'voice', 'ogg');
      try {
        const { transcribeAudio } = await import('@/lib/card-ocr');
        transcript = await transcribeAudio(audioBase64);
      } catch (e: any) {
        console.error('Audio transcription error:', e?.message);
      }
    }

    if (!transcript) {
      transcript = 'Nota de voz de reunión.';
    }

    const lowerTranscript = transcript.toLowerCase();
    const isContactCreation = ['agrega', 'agreguemos', 'crear', 'añadir', 'anadir', 'nuevo contacto'].some((k) => lowerTranscript.includes(k));

    if (isContactCreation) {
      await startContactWizard(instanceName, remoteJid, tenantId, stateKey, transcript, pushName, remoteDigits, matchedAdmin);
      await startContactWizard(instanceName, targetJid, tenantId, stateKey, transcript, pushName, remoteDigits, matchedAdmin);
      return;
    }

    const targetContactId = currentState?.contactId || (
      await prisma.contact.findFirst({
        where: tenantId ? { tenantId } : {},
        orderBy: { createdAt: 'desc' },
      })
    )?.id;

    if (targetContactId) {
      await prisma.voiceNote.create({
        data: {
          contactId: targetContactId,
          audioUrl: audioPath,
          audioDataUrl: audioPath,
          durationSeconds: 15,
          transcript,
        },
      }).catch(() => {});

      await prisma.contact.update({
        where: { id: targetContactId },
        data: {
          dynamicIcebreaker: `Acuerdo en nota de voz: "${transcript}"`,
        },
      }).catch(() => {});

      await prisma.timelineActivity.create({
        data: {
          contactId: targetContactId,
          type: 'VOICE_NOTE',
          title: 'Nota de Voz Procesada con IA',
          description: `Transcripción: "${transcript}"`,
        },
      }).catch(() => {});
    }

    conversationStates.delete(stateKey);

    await reply(
      instanceName,
      remoteJid,
      tenantId,
      `🎙️ *¡Nota de Voz Transcrita y Guardada en el CRM!*\n\n` +
      `📝 *Transcripción*: "${transcript}"\n\n` +
      `✅ El audio y la transcripción han sido vinculados al perfil del inversor en tu CRM.`
    );
    return;
  }

  // ── Interactive Button / Quick Action Triggers ───────────────────────
  if (lowerText === 'btn_scan' || lowerText.startsWith('/scan') || lowerText.startsWith('/tarjeta') || lowerText === '📸 escanear tarjeta') {
    conversationStates.set(stateKey, { step: 'SCAN_FRONT', data: {}, ts: Date.now() });
    await reply(
      instanceName,
      remoteJid,
      tenantId,
      `📸 *Escáner Inteligente de Tarjetas*\n\nPor favor envía la foto de la tarjeta de presentación aquí.`
    );
    return;
  }

  if (lowerText === 'btn_resumen' || lowerText.includes('resumen') || ['/stats', '/resumen', '📊 resumen crm'].includes(lowerText)) {
    const [totalContacts, totalDeals] = await Promise.all([
      prisma.contact.count({ where: tenantId ? { tenantId } : {} }),
      prisma.deal.count({ where: tenantId ? { tenantId } : {} }),
    ]);
    await reply(
      instanceName,
      remoteJid,
      tenantId,
      `📊 *Panel Ejecutivo Outcrop Silver CRM*\n\n` +
      `• 👤 Total Inversores: *${totalContacts}*\n` +
      `• 💼 Negociaciones Activas: *${totalDeals}*\n` +
      `• 🛡️ Estado: *Bot Activo 24/7 en la Nube*`
    );
    return;
  }

  if (lowerText === 'btn_opciones' || ['opciones', 'menu', 'menú', 'ayuda', 'help', '/help', 'que puedes hacer', 'qué puedes hacer', '❓ ver opciones'].includes(lowerText)) {
    await reply(
      instanceName,
      remoteJid,
      tenantId,
      `📋 *Opciones disponibles en el CRM*:\n\n` +
      `• 📸 *Foto de tarjeta*: Envía la foto de una tarjeta de presentación para registrarla con IA de inmediato.\n` +
      `• 🎙️ *Nota de voz*: Envía un audio para crear contactos o registrar acuerdos de reuniones.\n` +
      `• 📊 *Resumen*: Escribe *"Resumen"* para ver estadísticas del CRM en vivo.\n` +
      `• 👤 *Crear contacto*: Escribe *"Agrega a [Nombre] de [Empresa]"*.\n` +
      `• 💬 *Consultas*: Puedes preguntarme sobre inversores, reuniones o métricas del CRM con total naturalidad.`
    );
    return;
  }

  // ── Contact creation wizard states ───────────────────────────────────
  if (currentState?.step === 'WIZARD_CONTACT') {
    await handleWizardStep(
      instanceName,
      remoteJid,
      tenantId,
      stateKey,
      currentState.data,
      text,
      lowerText,
      pushName,
      remoteDigits,
      matchedAdmin
    );
    return;
  }

  // ── Natural language contact creation trigger ────────────────────────
  if (['agrega', 'agreguemos', '/crear', '/create', 'añadir', 'anadir', 'nuevo contacto', 'crear contacto'].some((k) => lowerText.includes(k))) {
    await startContactWizard(instanceName, remoteJid, tenantId, stateKey, text, pushName, remoteDigits, matchedAdmin);
    return;
  }

  // ── Natural Greeting (Dynamic, time-aware, non-repetitive, with quick buttons) ───
  const isGreeting = ['hola', 'buenas', 'buen dia', 'buen día', 'buenos dias', 'buenos días', 'buenas tardes', 'buenas noches', 'que mas', 'qué más', 'hey', 'hello', 'hi'].some(
    (g) => lowerText === g || lowerText.startsWith(`${g} `)
  );

  if (isGreeting) {
    const greetingText = getDynamicGreeting(firstName);
    await reply(
      instanceName,
      remoteJid,
      tenantId,
      `${greetingText}\n\n` +
      `• 📊 *Resumen*\n` +
      `• 📸 *Escanear Tarjeta*\n` +
      `• ❓ *Opciones*`
    );
    return;
  }

  // ── Natural Conversational AI Response via Gemini 2.5 Flash ──────────
  await handleNaturalConversation(instanceName, remoteJid, tenantId, text, firstName);
}

// ─────────────────────────────────────────────
// NATURAL CONVERSATIONAL AI ENGINE
// ─────────────────────────────────────────────

async function handleNaturalConversation(
  instanceName: string,
  remoteJid: string,
  tenantId: string,
  userMessage: string,
  firstName: string
) {
  const apiKey =
    process.env.GEMINI_DRIVE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    'REDACTED_GCP_KEY';

  const [recentContacts, totalContacts, totalDeals] = await Promise.all([
    prisma.contact.findMany({
      where: tenantId ? { tenantId } : {},
      take: 6,
      orderBy: { updatedAt: 'desc' },
      select: { name: true, company: true, stage: true, location: true, email: true },
    }),
    prisma.contact.count({ where: tenantId ? { tenantId } : {} }),
    prisma.deal.count({ where: tenantId ? { tenantId } : {} }),
  ]);

  if (!apiKey) {
    await reply(
      instanceName,
      remoteJid,
      tenantId,
      `Hola ${firstName}, estoy a tu servicio. Puedes enviarme una foto de tarjeta, nota de voz, o escribir *"Resumen"* para ver tus métricas.`
    );
    return;
  }

  try {
    const systemPrompt = `Eres el asistente ejecutivo de inteligencia artificial de Outcrop Silver CRM, hablando por WhatsApp con ${firstName}.
Responde siempre en español, de forma muy natural, cordial, inteligente, fluida y concisa (1 a 3 oraciones máximo).
Contexto del CRM en vivo:
- Total Inversionistas: ${totalContacts}
- Oportunidades / Negociaciones: ${totalDeals}
- Contactos recientes: ${recentContacts.map((c) => `${c.name} (${c.company || 'Sin empresa'} - ${c.stage})`).join(', ')}

Si te saludan o agradecen, responde cordialmente como un copiloto ejecutivo.
Si preguntan por opciones o qué puedes hacer, diles brevemente que pueden enviarte fotos de tarjetas, notas de voz, o pedir resúmenes.
NO uses formatos rígidos ni repitas siempre el mismo texto.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\nMensaje de ${firstName}: "${userMessage}"` }],
            },
          ],
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (aiReply) {
        await reply(instanceName, remoteJid, tenantId, aiReply);
        return;
      }
    }
  } catch (e: any) {
    console.error('Gemini natural conversation error:', e?.message);
  }

  await reply(
    instanceName,
    remoteJid,
    tenantId,
    `Hola ${firstName}, estoy a tu servicio. Puedes enviarme una foto de tarjeta, un audio o escribir *"Opciones"* para guiarte.`
  );
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function getDynamicGreeting(name?: string): string {
  const cleanName = (name || '').trim();
  const colombiaHour = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' })).getHours();

  let timeWord = '¡Hola';
  let emoji = '👋';
  if (colombiaHour >= 5 && colombiaHour < 12) {
    timeWord = '¡Buenos días';
    emoji = '☀️';
  } else if (colombiaHour >= 12 && colombiaHour < 19) {
    timeWord = '¡Buenas tardes';
    emoji = '🌤️';
  } else {
    timeWord = '¡Buenas noches';
    emoji = '🌙';
  }

  const variations = cleanName
    ? [
        `${timeWord}, ${cleanName}! ${emoji} ¿En qué te puedo colaborar hoy?`,
        `¡Hola ${cleanName}! ${emoji} Qué gusto saludarte. ¿Cómo te puedo apoyar hoy con el CRM?`,
        `¡Un gusto saludarte, ${cleanName}! ${emoji} ¿En qué nos enfocamos hoy?`,
        `${timeWord}, ${cleanName}! ${emoji} ¿Qué gestionamos hoy en el CRM?`,
        `¡Hola ${cleanName}! ${emoji} ¿Cómo puedo facilitarte la gestión hoy?`,
      ]
    : [
        `${timeWord}! ${emoji} ¿Cómo puedo ayudarte hoy con el CRM?`,
        `¡Hola! ${emoji} Qué gusto saludarte. ¿En qué te puedo colaborar hoy?`,
        `¡Un gusto saludarte! ${emoji} ¿En qué nos enfocamos hoy en el CRM?`,
      ];

  const randomIndex = Math.floor(Math.random() * variations.length);
  return variations[randomIndex];
}

async function reply(instanceName: string, remoteJid: string, tenantId: string, text: string) {
  const msgId = await EvoApi.sendText(instanceName, remoteJid, text);
  if (msgId) {
    await prisma.whatsAppMessage.create({
      data: {
        tenantId,
        fromNumber: 'CRM Bot',
        senderName: 'CRM Bot',
        toNumber: remoteJid.replace(/\D/g, ''),
        message: text,
        direction: 'OUTBOUND',
      },
    }).catch(() => {});
  }
}

async function replyButtons(
  instanceName: string,
  remoteJid: string,
  tenantId: string,
  description: string,
  buttons: Array<{ id: string; text: string }>
) {
  const msgId = await EvoApi.sendButtons(instanceName, remoteJid, {
    description,
    buttons,
  });
  if (msgId) {
    await prisma.whatsAppMessage.create({
      data: {
        tenantId,
        fromNumber: 'CRM Bot',
        senderName: 'CRM Bot',
        toNumber: remoteJid.replace(/\D/g, ''),
        message: description,
        direction: 'OUTBOUND',
      },
    }).catch(() => {});
  }
}

async function saveMedia(base64: string, prefix: string, ext: string): Promise<string | null> {
  try {
    const dir = path.join(process.cwd(), 'public', 'uploads', ext === 'ogg' ? 'audio' : 'cards');
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${prefix}_${Date.now()}.${ext}`;
    const filepath = path.join(dir, filename);
    const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
    fs.writeFileSync(filepath, Buffer.from(cleanBase64, 'base64'));
    return `/uploads/${ext === 'ogg' ? 'audio' : 'cards'}/${filename}`;
  } catch (e) {
    console.error('Error saving media:', e);
    return null;
  }
}

async function handleInstantCardScan(
  instanceName: string,
  remoteJid: string,
  tenantId: string,
  stateKey: string,
  imageBase64: string | null | undefined,
  pushName: string,
  adminName: string
) {
  let frontPath: string | null = null;
  let ocr: ExtractedCardInfo = {
    name: pushName || 'Contacto Tarjeta',
    company: null,
    title: null,
    email: null,
    phone: null,
    location: null,
    website: null,
    rawText: '',
  };

  if (imageBase64) {
    frontPath = await saveMedia(imageBase64, 'card_front', 'jpg');
    try {
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      ocr = await parseCardImage(buffer, pushName);
    } catch (e: any) {
      console.error('Gemini Vision OCR error:', e?.message);
    }
  }

  await prisma.timelineActivity.create({ data: { contactId: (await prisma.contact.findFirst())?.id || '', title: 'DEBUG_HICS_1', description: `ocr.name: ${ocr.name}, path: ${frontPath}` }}).catch(() => {});

  const defaultTenant =
    (await prisma.tenant.findFirst({ where: { slug: 'outcrop-silver' } })) ||
    (await prisma.tenant.findFirst());

  const cleanPhone = ocr.phone ? ocr.phone.replace(/[^\d+]/g, '') : null;
  const finalEmail = ocr.email || null;

  // 1. CREATE CONTACT IN DATABASE IMMEDIATELY (Only with real fields)
  const newContact = await prisma.contact.create({
    data: {
      tenantId: tenantId || defaultTenant?.id || null,
      name: ocr.name || 'Contacto Tarjeta',
      company: ocr.company || '',
      title: ocr.title || '',
      email: finalEmail,
      phone: cleanPhone,
      whatsapp: cleanPhone,
      location: ocr.location || null,
      investorType: 'HNW investor',
      stage: 'Meeting Scheduled',
      source: 'WhatsApp Card Scan',
      tags: 'Tarjeta Escaneada, IA Vision',
      customTags: '',
      dynamicIcebreaker: `Contacto escaneado via Gemini Vision en WhatsApp por ${adminName}.`,
      strategicContext: 'Perfil creado automáticamente por escáner OCR de tarjetas de WhatsApp.',
      leadScore: 75,
    },
  });

  // 2. CREATE BUSINESS CARD RECORD
  await prisma.businessCard.create({
    data: {
      contactId: newContact.id,
      frontImageUrl: frontPath,
      extractedTextFront: ocr.rawText || `${ocr.name} ${ocr.company || ''} ${ocr.title || ''}`,
      parsedDataJson: JSON.stringify(ocr),
    },
  }).catch(() => {});

  // 3. LOG ACTIVITY
  await prisma.timelineActivity.create({
    data: {
      contactId: newContact.id,
      type: 'CARD_SCAN',
      title: 'Business Card Scanned (Gemini Vision)',
      description: `Contacto "${newContact.name}" (${newContact.company || 'Sin empresa'}) registrado en el CRM por ${adminName}.`,
    },
  }).catch(() => {});

  // 4. SET CONVERSATION STATE FOR OPTIONAL ENRICHMENT
  conversationStates.set(stateKey, {
    step: 'AWAITING_ENRICHMENT',
    contactId: newContact.id,
    data: { ...ocr, frontImageUrl: frontPath },
    ts: Date.now(),
  });

  // 5. BUILD SUMMARY SHOWING ONLY REAL DATA
  const summaryLines = [
    `• 👤 *Nombre*: ${newContact.name}`,
    newContact.company ? `• 🏢 *Empresa*: ${newContact.company}` : null,
    newContact.title ? `• 💼 *Cargo*: ${newContact.title}` : null,
    newContact.email ? `• 📧 *Correo*: ${newContact.email}` : `• 📧 *Correo*: _(Sin registrar)_`,
    newContact.phone ? `• 📞 *Teléfono*: ${newContact.phone}` : `• 📞 *Teléfono*: _(Sin registrar)_`,
    ocr.location ? `• 📍 *Ubicación*: ${ocr.location}` : null,
    ocr.website ? `• 🌐 *Web*: ${ocr.website}` : null,
  ].filter(Boolean).join('\n');

  const replyText =
    `🎉 *¡Contacto Creado y Guardado en el CRM!*\n\n` +
    `🔍 *Datos Extraídos de la Tarjeta*:\n` +
    summaryLines + '\n' +
    `• 📊 *Etapa Inicial*: Meeting Scheduled (75 pts)\n` +
    `• 🛡️ *Registrado por*: ${adminName}\n\n` +
    `📸 *Opcional*: Envía la foto del **Reverso** o una **Nota de Voz** si deseas agregar datos faltantes o notas de la reunión.\n\n` +
    (cleanPhone || finalEmail ? `📇 *Enviando Ficha de Contacto vCard (.vcf)...*` : '');

  await prisma.timelineActivity.create({ data: { contactId: newContact.id, title: 'DEBUG_HICS_2', description: `Replying to: ${remoteJid}` }}).catch(() => {});

  await reply(instanceName, remoteJid, tenantId, replyText);

  if (cleanPhone || finalEmail) {
    await EvoApi.sendVCard(instanceName, remoteJid, {
      name: newContact.name,
      phone: newContact.phone,
      company: newContact.company,
      email: newContact.email,
    });
  }
}

// ─────────────────────────────────────────────
// CONTACT CREATION WIZARD
// ─────────────────────────────────────────────

async function startContactWizard(
  instanceName: string,
  remoteJid: string,
  tenantId: string,
  stateKey: string,
  text: string,
  pushName: string,
  remoteDigits: string,
  matchedAdmin: any
) {
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const companyMatch = text.match(/\b(?:de|del|from)\s+([A-Za-zÀ-ÿ0-9\s&.,']+?)(?=\s+(?:con\s+correo|correo|email|tel[eé]fono|phone|\+?[\w.-]+@|\d)|\s*$)/i);

  let name = text
    .replace(/(hola|buenas|agreguemos?|crea(?:r)?|a[ñn]adir?|nuevo contacto|\/cre[ae]r?|\/create?)\s*/gi, '')
    .replace(/^a\s+/i, '')
    .replace(emailMatch?.[0] || '', '')
    .replace(phoneMatch?.[0] || '', '')
    .replace(companyMatch?.[0] || '', '')
    .replace(/\b(?:con\s+correo|correo|email|tel[eé]fono|phone|el\s+contacto)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const data: Record<string, any> = {
    name: name.length >= 2 ? name : null,
    company: companyMatch?.[1]?.trim() || null,
    email: emailMatch?.[0] || null,
    phone: phoneMatch?.[0]?.replace(/[^\d+]/g, '') || null,
  };

  conversationStates.set(stateKey, { step: 'WIZARD_CONTACT', data, ts: Date.now() });

  if (data.name && data.company && data.email) {
    await createContactFromWizard(instanceName, remoteJid, tenantId, stateKey, data, pushName);
    return;
  }

  await sendNextWizardPrompt(instanceName, remoteJid, tenantId, data);
}

async function handleWizardStep(
  instanceName: string,
  remoteJid: string,
  tenantId: string,
  stateKey: string,
  data: Record<string, any>,
  text: string,
  lowerText: string,
  pushName: string,
  remoteDigits: string,
  matchedAdmin: any
) {
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const companyMatch = text.match(/\b(?:de|del|from)\s+([A-Za-zÀ-ÿ0-9\s&.,']+?)(?=\s+[\w.-]+@|\s*$)/i);
  const skip = ['saltar', '/skip', 'no', 'n/a', 'ninguno', 'ninguna'].includes(lowerText);

  if (!data.name) {
    data.name = text.replace(/\s+/g, ' ').trim();
    if (companyMatch) data.company = companyMatch[1].trim();
    if (emailMatch) data.email = emailMatch[0];
    if (phoneMatch) data.phone = phoneMatch[0].replace(/[^\d+]/g, '');
  } else if (data.company === undefined || data.company === null) {
    if (!skip) data.company = text.trim();
    else data.company = null;
  } else if (data.email === undefined || data.email === null) {
    if (!skip && emailMatch) data.email = emailMatch[0];
    else if (!skip && text.includes('@')) data.email = text.trim();
    else data.email = null;
  }

  conversationStates.set(stateKey, { step: 'WIZARD_CONTACT', data, ts: Date.now() });

  if (data.name && (data.company !== undefined || skip) && (data.email !== undefined || skip)) {
    await createContactFromWizard(instanceName, remoteJid, tenantId, stateKey, data, pushName);
    return;
  }

  await sendNextWizardPrompt(instanceName, remoteJid, tenantId, data);
}

async function sendNextWizardPrompt(instanceName: string, remoteJid: string, tenantId: string, data: Record<string, any>) {
  if (!data.name) {
    await reply(
      instanceName,
      remoteJid,
      tenantId,
      `➕ *Asistente Ejecutivo para Crear Contactos*\n\n` +
      `👤 *Paso 1 de 3*: ¿Cuál es el **Nombre Completo** del contacto?\n\n` +
      `_(Puedes escribir todos los datos juntos: "Guillermo Flores de Banco Popular guillermo@bancopopular.com")_`
    );
  } else if (data.company === undefined || data.company === null) {
    await reply(
      instanceName,
      remoteJid,
      tenantId,
      `✅ *Nombre registrado*: ${data.name}\n\n` +
      `🏢 *Paso 2 de 3*: ¿A qué **Empresa u Organización** pertenece?\n\n` +
      `_(Responde con el nombre de la empresa, o escribe "Saltar" si no tiene)_`
    );
  } else if (data.email === undefined || data.email === null) {
    await reply(
      instanceName,
      remoteJid,
      tenantId,
      `✅ *Nombre*: ${data.name}\n` +
      (data.company ? `✅ *Empresa*: ${data.company}\n\n` : '\n') +
      `📧 *Paso 3 de 3*: ¿Cuál es su **Correo Electrónico**?\n\n` +
      `_(Responde con el correo, o escribe "Saltar" para dejarlo en blanco)_`
    );
  }
}

async function createContactFromWizard(
  instanceName: string,
  remoteJid: string,
  tenantId: string,
  stateKey: string,
  data: Record<string, any>,
  pushName: string
) {
  conversationStates.delete(stateKey);

  const defaultTenant =
    (await prisma.tenant.findFirst({ where: { slug: 'outcrop-silver' } })) ||
    (await prisma.tenant.findFirst());

  const newC = await prisma.contact.create({
    data: {
      tenantId: tenantId || defaultTenant?.id || null,
      name: data.name,
      company: data.company || '',
      email: data.email || null,
      phone: data.phone || null,
      whatsapp: data.phone || null,
      investorType: 'Institutional Investor',
      stage: 'Lead Prospect',
      source: 'WhatsApp Assistant Wizard',
      tags: 'Creado por WhatsApp',
      customTags: '',
      dynamicIcebreaker: `Contacto registrado via Asistente WhatsApp por ${pushName || 'Administrador'}.`,
      strategicContext: 'Registrado desde chat de WhatsApp sin datos asumidos ni ficticios.',
      leadScore: 65,
    },
  });

  await prisma.timelineActivity.create({
    data: {
      contactId: newC.id,
      type: 'CONTACT_CREATED',
      title: 'Contact Created via WhatsApp Wizard',
      description: `Contact "${newC.name}" (${newC.company || 'Sin empresa'}) created via WhatsApp wizard.`,
    },
  }).catch(() => {});

  const summary = [
    `• 👤 *Nombre*: ${newC.name}`,
    newC.company ? `• 🏢 *Empresa*: ${newC.company}` : null,
    newC.email ? `• 📧 *Correo*: ${newC.email}` : `• 📧 *Correo*: _(Sin registrar)_`,
    newC.phone ? `• 📞 *Teléfono*: ${newC.phone}` : `• 📞 *Teléfono*: _(Sin registrar)_`,
  ].filter(Boolean).join('\n');

  const replyText =
    `🎉 *¡Contacto Creado Exitosamente en el CRM!*\n\n` +
    summary + '\n' +
    `• 📊 *Etapa Inicial*: Lead Prospect (65 pts)\n` +
    `• 🛡️ *Registrado por*: ${pushName || 'Administrador'}\n\n` +
    (newC.phone || newC.email ? `📇 *Enviando Ficha de Contacto vCard (.vcf)...*` : '');

  await reply(instanceName, remoteJid, tenantId, replyText);

  if (newC.phone || newC.email) {
    await EvoApi.sendVCard(instanceName, remoteJid, {
      name: newC.name,
      phone: newC.phone,
      company: newC.company,
      email: newC.email,
    });
  }
}
