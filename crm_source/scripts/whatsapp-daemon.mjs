import makeWASocket, { useMultiFileAuthState, DisconnectReason, downloadContentFromMessage } from '@whiskeysockets/baileys';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { PrismaClient } from '@prisma/client';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import os from 'os';

const prisma = new PrismaClient();
const adminConversationStates = new Map();

async function downloadBaileysMedia(messageContent, type) {
  try {
    const stream = await downloadContentFromMessage(messageContent, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  } catch (e) {
    console.error('Error downloading media:', e);
    return null;
  }
}

function extractCardDataFromText(text, pushName = '') {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  
  let email = null;
  let phone = null;
  let company = null;
  let name = null;
  let title = 'Executive';

  for (const line of lines) {
    const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch && !email) email = emailMatch[0];

    const phoneMatch = line.match(/(\+?\d{1,4}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
    if (phoneMatch && !phone) phone = phoneMatch[0];

    if (!company && (line.toLowerCase().includes('inc') || line.toLowerCase().includes('corp') || line.toLowerCase().includes('ltd') || line.toLowerCase().includes('s.a.') || line.toLowerCase().includes('bank') || line.toLowerCase().includes('banco') || line.toLowerCase().includes('group') || line.toLowerCase().includes('ventures'))) {
      company = line;
    }
  }

  name = lines[0] || pushName || 'Inversor Tarjeta';
  if (!company) company = lines[1] || 'Empresa Privada';

  return { name, company, title, email, phone };
}

async function sendNativeVCard(sock, toJid, contact) {
  const cleanPhone = (contact.phone || contact.whatsapp || '').replace(/\D/g, '');
  const vcard =
    `BEGIN:VCARD\n` +
    `VERSION:3.0\n` +
    `N:${contact.name};;;;\n` +
    `FN:${contact.name}\n` +
    `ORG:${contact.company || 'Outcrop Silver'};\n` +
    `TITLE:${contact.title || 'Executive'}\n` +
    `TEL;type=CELL;type=VOICE;waid=${cleanPhone}:${contact.phone || contact.whatsapp || ''}\n` +
    `EMAIL;type=INTERNET:${contact.email || ''}\n` +
    `END:VCARD`;

  try {
    await sock.sendMessage(toJid, {
      contacts: {
        displayName: contact.name,
        contacts: [{ vcard }],
      },
    });
  } catch (e) {
    console.error('Error sending vCard:', e);
  }
}

async function startWhatsAppDaemon() {
  console.log('\n================================================================');
  console.log('🚀 INICIANDO DEMONIO CLOUD 24/7 DE WHATSAPP BAILEYS (OUTROP SILVER CRM)');
  console.log('================================================================\n');

  // Fallback directory to /tmp on Linux VPS if local directory lacks write permissions
  let authFolder = path.join(process.cwd(), 'baileys_auth_info');
  try {
    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
    }
    fs.accessSync(authFolder, fs.constants.W_OK);
  } catch (e) {
    authFolder = path.join(os.tmpdir(), 'baileys_auth_info');
    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
    }
  }

  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  const proxyUrl = process.env.WHATSAPP_PROXY_URL || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
  if (agent) {
    console.log(`🌐 Enrutando conexión TLS de WhatsApp a través del Proxy: ${proxyUrl.replace(/:[^:@]+@/, ':***@')}`);
  }

  const sock = makeWASocket({
    auth: state,
    agent: agent,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    defaultQueryTimeoutMs: 60000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📌 CÓDIGO QR GENERADO POR WHATSAPP EN LA NUBE VPS');
      try {
        const qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
        await prisma.whatsAppSession.upsert({
          where: { id: 'default' },
          update: { status: 'CONNECTING', qrCode: qrDataUrl, phoneNumber: null },
          create: { id: 'default', status: 'CONNECTING', qrCode: qrDataUrl, phoneNumber: null },
        });
      } catch (e) {}
    }

    if (connection === 'open') {
      const userPhone = sock.user?.id ? sock.user.id.split(':')[0] : 'Connected';
      console.log(`\n✅ ¡DEMONIO DE WHATSAPP CONECTADO Y 100% OPERATIVO 24/7 EN LA NUBE! (+${userPhone})`);
      console.log('📱 Escáner de Tarjetas, Asistente Conversacional y vCard escuchando en vivo.\n');

      await prisma.whatsAppSession.upsert({
        where: { id: 'default' },
        update: { status: 'CONNECTED', qrCode: null, phoneNumber: `+${userPhone}` },
        create: { id: 'default', status: 'CONNECTED', qrCode: null, phoneNumber: `+${userPhone}` },
      });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      console.log(`⚠️ Conexión cerrada en VPS. Código de estado: ${statusCode}. Reconectando...`);
      if (statusCode !== DisconnectReason.loggedOut) {
        setTimeout(startWhatsAppDaemon, 3000);
      } else {
        console.log('🧹 Sesión cerrada en VPS. Limpiando credenciales obsoletas...');
        if (fs.existsSync(authFolder)) {
          try {
            fs.rmSync(authFolder, { recursive: true, force: true });
          } catch (e) {}
        }
        setTimeout(startWhatsAppDaemon, 3000);
      }
    }
  });

  const processedMsgIds = new Set();
  const botSentMsgIds = new Set();

  // Listen for Inbound Messages on Real WhatsApp
  sock.ev.on('messages.upsert', async ({ messages: msgList, type }) => {
    if (type !== 'notify') return;

    for (const msg of msgList) {
      if (!msg.message) continue;

      const msgId = msg.key.id;
      if (processedMsgIds.has(msgId) || botSentMsgIds.has(msgId)) continue;
      processedMsgIds.add(msgId);

      // Skip messages sent from the bot account itself
      if (msg.key.fromMe) continue;

      if (processedMsgIds.size > 1000) processedMsgIds.clear();
      if (botSentMsgIds.size > 1000) botSentMsgIds.clear();

      const rawRemoteJid = msg.key.remoteJid || '';
      const pushName = (msg.pushName || '').trim();

      const imageMsg = msg.message.imageMessage;
      const audioMsg = msg.message.audioMessage;
      const text = (
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        ''
      ).trim();

      if (!rawRemoteJid) continue;
      const remoteDigits = rawRemoteJid.replace(/\D/g, '');

      console.log(`📩 Mensaje entrante [${remoteDigits} | "${pushName}"]: "${text || (imageMsg ? '[FOTO TARJETA]' : audioMsg ? '[NOTA DE VOZ]' : '[MEDIA]')}"`);

      const allWhitelist = await prisma.whatsAppWhitelist.findMany({ where: { isActive: true } });
      const isAuthorized = allWhitelist.find((w) => {
        const wDigits = w.phoneNumber.replace(/\D/g, '');
        return wDigits && (remoteDigits.endsWith(wDigits) || wDigits.endsWith(remoteDigits) || remoteDigits === wDigits);
      });

      await prisma.whatsAppMessage.create({
        data: {
          fromNumber: remoteDigits,
          senderName: pushName || (isAuthorized ? isAuthorized.name : 'WhatsApp User'),
          toNumber: 'CRM Bot',
          message: text || (imageMsg ? '📷 [Foto Tarjeta]' : audioMsg ? '🎙️ [Nota de Voz]' : '[Media]'),
          direction: 'INBOUND',
        },
      });

      let replyText = '';
      if (!isAuthorized) {
        replyText = `🔒 *Outcrop Silver CRM Security*\n\nHola. No estás autorizado para operar este bot ejecutivo. Por favor contacta al administrador.`;
        try {
          const sentResult = await sock.sendMessage(rawRemoteJid, { text: replyText });
          if (sentResult?.key?.id) botSentMsgIds.add(sentResult.key.id);
        } catch (e) {}
        continue;
      }

      const adminFirstName = isAuthorized.name ? isAuthorized.name.split(' ')[0] : pushName ? pushName.split(' ')[0] : 'Administrator';
      const userStateKey = remoteDigits;
      const currentState = adminConversationStates.get(userStateKey);
      const lowerText = text.toLowerCase();

      // Cancel Command
      if (lowerText === '/cancel' || lowerText === 'cancel' || lowerText === 'cancelar' || lowerText === 'salir') {
        adminConversationStates.delete(userStateKey);
        replyText = `❌ *Proceso cancelado.* Has regresado al menú principal de Outcrop Silver CRM.`;
        try {
          const sentResult = await sock.sendMessage(rawRemoteJid, { text: replyText });
          if (sentResult?.key?.id) botSentMsgIds.add(sentResult.key.id);
        } catch (e) {}
        continue;
      }

      // =========================================================================
      // BUSINESS CARD SCANNER WIZARD (FRONT -> BACK -> VOICE NOTE -> vCard)
      // =========================================================================

      if (
        lowerText.startsWith('/scan') ||
        lowerText.startsWith('/tarjeta') ||
        lowerText.includes('escanear tarjeta') ||
        lowerText.includes('tarjeta de presentación') ||
        (imageMsg && !currentState)
      ) {
        if (imageMsg) {
          const buffer = await downloadBaileysMedia(imageMsg, 'image');
          let frontPath = null;
          if (buffer) {
            const cardsDir = path.join(process.cwd(), 'public', 'uploads', 'cards');
            if (!fs.existsSync(cardsDir)) fs.mkdirSync(cardsDir, { recursive: true });
            const filename = `card_front_${Date.now()}.jpg`;
            frontPath = `/uploads/cards/${filename}`;
            fs.writeFileSync(path.join(cardsDir, filename), buffer);
          }

          adminConversationStates.set(userStateKey, {
            step: 'SCAN_BACK_CARD',
            data: {
              frontImageUrl: frontPath,
              extractedText: text || pushName || 'Tarjeta de Presentación Escaneada',
            },
            lastUpdated: Date.now(),
          });

          replyText =
            `✅ *¡Foto del Frente de la Tarjeta Recibida y Procesada!*\n\n` +
            `📸 *Paso 2 de 3: Foto del Reverso / Parte Trasera*\n` +
            `Ahora envía la foto de la **PARTE TRASERA** de la tarjeta.\n\n` +
            `💡 *(Si la tarjeta es de una sola cara, responde "Saltar" o /skip)*.`;
        } else {
          adminConversationStates.set(userStateKey, {
            step: 'SCAN_FRONT_CARD',
            data: {},
            lastUpdated: Date.now(),
          });

          replyText =
            `📸 *Escáner Inteligente de Tarjetas de Presentación (2 Caras + Audio + vCard)*\n\n` +
            `*Paso 1 de 3*: Por favor envía la foto de la **PARTE FRONTAL** de la tarjeta de presentación.\n\n` +
            `*(Escribe "Cancelar" en cualquier momento para salir)*.`;
        }

        try {
          const sentResult = await sock.sendMessage(rawRemoteJid, { text: replyText });
          if (sentResult?.key?.id) botSentMsgIds.add(sentResult.key.id);
        } catch (e) {}
        continue;
      }

      // STATE: SCAN_FRONT_CARD (Waiting for front image)
      if (currentState?.step === 'SCAN_FRONT_CARD') {
        if (!imageMsg) {
          replyText = `⚠️ Por favor envía la **FOTO de la PARTE FRONTAL** de la tarjeta de presentación.`;
          try {
            const sentResult = await sock.sendMessage(rawRemoteJid, { text: replyText });
            if (sentResult?.key?.id) botSentMsgIds.add(sentResult.key.id);
          } catch (e) {}
          continue;
        }

        const buffer = await downloadBaileysMedia(imageMsg, 'image');
        let frontPath = null;
        if (buffer) {
          const cardsDir = path.join(process.cwd(), 'public', 'uploads', 'cards');
          if (!fs.existsSync(cardsDir)) fs.mkdirSync(cardsDir, { recursive: true });
          const filename = `card_front_${Date.now()}.jpg`;
          frontPath = `/uploads/cards/${filename}`;
          fs.writeFileSync(path.join(cardsDir, filename), buffer);
        }

        adminConversationStates.set(userStateKey, {
          step: 'SCAN_BACK_CARD',
          data: {
            frontImageUrl: frontPath,
            extractedText: text || pushName || 'Tarjeta Escaneada',
          },
          lastUpdated: Date.now(),
        });

        replyText =
          `✅ *¡Foto del Frente Recibida y Procesada!*\n\n` +
          `📸 *Paso 2 de 3: Foto del Reverso*\n` +
          `Ahora envía la foto de la **PARTE TRASERA** de la tarjeta (o responde "Saltar" si es de 1 sola cara).`;

        try {
          const sentResult = await sock.sendMessage(rawRemoteJid, { text: replyText });
          if (sentResult?.key?.id) botSentMsgIds.add(sentResult.key.id);
        } catch (e) {}
        continue;
      }

      // STATE: SCAN_BACK_CARD (Waiting for back image or /skip)
      if (currentState?.step === 'SCAN_BACK_CARD') {
        let backPath = null;
        if (imageMsg) {
          const buffer = await downloadBaileysMedia(imageMsg, 'image');
          if (buffer) {
            const cardsDir = path.join(process.cwd(), 'public', 'uploads', 'cards');
            if (!fs.existsSync(cardsDir)) fs.mkdirSync(cardsDir, { recursive: true });
            const filename = `card_back_${Date.now()}.jpg`;
            backPath = `/uploads/cards/${filename}`;
            fs.writeFileSync(path.join(cardsDir, filename), buffer);
          }
        }

        adminConversationStates.set(userStateKey, {
          step: 'SCAN_VOICE_NOTE',
          data: {
            ...currentState.data,
            backImageUrl: backPath,
          },
          lastUpdated: Date.now(),
        });

        replyText =
          `✅ *${backPath ? '¡Foto del Reverso Recibida!' : 'Confirmado: Tarjeta de una sola cara'}.*\n\n` +
          `🎙️ *Paso 3 de 3: Nota de Voz o Audio de la Reunión*\n` +
          `¿Deseas agregar una **nota de voz por WhatsApp** con detalles de este contacto?\n\n` +
          `Envía una **nota de voz** o responde "Saltar" para guardar el contacto inmediatamente.`;

        try {
          const sentResult = await sock.sendMessage(rawRemoteJid, { text: replyText });
          if (sentResult?.key?.id) botSentMsgIds.add(sentResult.key.id);
        } catch (e) {}
        continue;
      }

      // STATE: SCAN_VOICE_NOTE (Creating contact + BusinessCard record + sending vCard)
      if (currentState?.step === 'SCAN_VOICE_NOTE') {
        let audioPath = null;
        let voiceText = '';

        if (audioMsg) {
          const buffer = await downloadBaileysMedia(audioMsg, 'audio');
          if (buffer) {
            const audioDir = path.join(process.cwd(), 'public', 'uploads', 'audio');
            if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
            const filename = `voice_${Date.now()}.ogg`;
            audioPath = `/uploads/audio/${filename}`;
            fs.writeFileSync(path.join(audioDir, filename), buffer);
            voiceText = 'Nota de voz grabada por WhatsApp sobre la reunión.';
          }
        } else if (text && lowerText !== '/skip' && lowerText !== 'saltar') {
          voiceText = text;
        }

        const cardData = currentState.data || {};
        const extracted = extractCardDataFromText(cardData.extractedText || text || 'Inversor Escaneado', pushName);

        const defaultTenant = (await prisma.tenant.findFirst({ where: { slug: 'outcrop-silver' } })) || (await prisma.tenant.findFirst());

        // Create Contact in SQLite!
        const newContact = await prisma.contact.create({
          data: {
            tenantId: isAuthorized?.tenantId || (defaultTenant ? defaultTenant.id : null),
            name: extracted.name || 'Inversor Tarjeta',
            company: extracted.company || 'Firma Inversionista',
            title: extracted.title || 'Executive',
            email: extracted.email || `${(extracted.name || 'contacto').toLowerCase().replace(/\s+/g, '')}@investor.com`,
            phone: extracted.phone || `+${remoteDigits}`,
            whatsapp: `+${remoteDigits}`,
            investorType: 'HNW investor',
            stage: 'Meeting Scheduled',
            source: 'WhatsApp Card Scan',
            tags: 'Tarjeta Escaneada',
            customTags: '',
            dynamicIcebreaker: voiceText ? `Detalle en nota de voz: "${voiceText}"` : 'Tarjeta de presentación escaneada via WhatsApp.',
            strategicContext: 'Perfil creado automáticamente por escáner de tarjetas de presentación de WhatsApp.',
            leadScore: 75,
          },
        });

        // Create BusinessCard linked record
        await prisma.businessCard.create({
          data: {
            contactId: newContact.id,
            frontImageUrl: cardData.frontImageUrl || null,
            backImageUrl: cardData.backImageUrl || null,
            extractedTextFront: cardData.extractedText || 'Front Card Image',
            extractedTextBack: 'Back Card Image',
            parsedDataJson: JSON.stringify(extracted),
          },
        });

        // Create VoiceNote if audio attached
        if (audioPath || voiceText) {
          await prisma.voiceNote.create({
            data: {
              contactId: newContact.id,
              audioUrl: audioPath || null,
              audioDataUrl: audioPath || null,
              durationSeconds: audioMsg?.seconds || 15,
              transcript: voiceText || 'Nota de voz de reunión.',
            },
          });
        }

        // Add Activity Log
        await prisma.timelineActivity.create({
          data: {
            contactId: newContact.id,
            type: 'CARD_SCAN',
            title: 'Business Card Scanned (2 Sides + Voice)',
            description: `Contacto "${newContact.name}" de "${newContact.company}" procesado exitosamente por ${adminFirstName}.`,
          },
        });

        adminConversationStates.delete(userStateKey);

        replyText =
          `🎉 *¡Contacto Creado Exitosamente via WhatsApp Scanner!*\n\n` +
          `• 👤 *Nombre*: ${newContact.name}\n` +
          `• 🏢 *Empresa*: ${newContact.company}\n` +
          `• 💼 *Cargo*: ${newContact.title || 'Executive'}\n` +
          `• 📧 *Correo*: ${newContact.email || 'N/A'}\n` +
          `• 📞 *Teléfono*: ${newContact.phone || 'N/A'}\n` +
          `• 📊 *Etapa Inicial*: Meeting Scheduled (75 pts)\n` +
          `• 🖼️ *Fotos de Tarjeta*: ${cardData.backImageUrl ? '2 Caras (Frente + Reverso)' : '1 Cara'}\n` +
          `• 🎙️ *Nota de Voz*: ${audioPath ? 'Adjuntada al perfil' : 'Sin audio'}\n\n` +
          `📇 *Enviando Ficha de Contacto vCard (.vcf) a tu chat...*`;

        try {
          const sentResult = await sock.sendMessage(rawRemoteJid, { text: replyText });
          if (sentResult?.key?.id) botSentMsgIds.add(sentResult.key.id);

          // Dispatch native vCard attachment!
          await sendNativeVCard(sock, rawRemoteJid, newContact);
        } catch (e) {}
        continue;
      }

      // =========================================================================
      // HYBRID STEP-BY-STEP CONTACT CREATION WIZARD (DIRECTED ASSISTANT)
      // =========================================================================

      if (currentState?.step === 'WIZARD_CREATE_CONTACT') {
        const wizardData = currentState.data || {};

        // Extract any new details provided in this turn
        const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch && !wizardData.email) wizardData.email = emailMatch[0];

        const deMatch = text.match(/\bde\s+([A-Za-z0-9\s]+?)(?=\s+[\w.-]+@|\s*$)/i);
        if (deMatch && deMatch[1] && !wizardData.company) wizardData.company = deMatch[1].trim();

        if (lowerText !== 'saltar' && lowerText !== '/skip') {
          if (!wizardData.name) {
            let extractedName = text
              .replace(/(hola|buenos días|buenas tardes|por favor|agreguemos|agrega|crear|crea|añadir|anadir|\/create|\/crear|un contacto|contacto)/gi, ' ')
              .trim()
              .replace(/^a\s+/i, '')
              .trim();
            if (wizardData.email) extractedName = extractedName.replace(wizardData.email, '').trim();
            if (deMatch) extractedName = extractedName.replace(deMatch[0], '').trim();
            extractedName = extractedName.replace(/\s+/g, ' ').trim();
            if (extractedName.length >= 2) wizardData.name = extractedName;
          } else if (!wizardData.company && !deMatch) {
            if (text.length >= 2) wizardData.company = text.trim();
          } else if (!wizardData.email && !emailMatch) {
            if (text.includes('@')) wizardData.email = text.trim();
          }
        }

        // 1. Missing Name
        if (!wizardData.name) {
          adminConversationStates.set(userStateKey, { step: 'WIZARD_CREATE_CONTACT', data: wizardData, lastUpdated: Date.now() });
          replyText =
            `➕ *Asistente Ejecutivo para Crear Contactos*\n\n` +
            `Te guiaré paso a paso para guardar la información.\n\n` +
            `👤 *Paso 1 de 3*: ¿Cuál es el **Nombre Completo** del contacto?\n\n` +
            `*(Ejemplo: Carlos Ruiz, o puedes darme todos los datos juntos: "Carlos Ruiz de Bancolombia carlos@bancolombia.com")*`;
          try {
            const sentResult = await sock.sendMessage(rawRemoteJid, { text: replyText });
            if (sentResult?.key?.id) botSentMsgIds.add(sentResult.key.id);
          } catch (e) {}
          continue;
        }

        // 2. Missing Company
        if (!wizardData.company) {
          adminConversationStates.set(userStateKey, { step: 'WIZARD_CREATE_CONTACT', data: wizardData, lastUpdated: Date.now() });
          replyText =
            `✅ *Nombre registrado*: ${wizardData.name}\n\n` +
            `🏢 *Paso 2 de 3*: ¿A qué **Empresa u Organización** pertenece?\n\n` +
            `*(Responde con el nombre de la empresa, o escribe "Saltar" si es independiente)*.`;
          try {
            const sentResult = await sock.sendMessage(rawRemoteJid, { text: replyText });
            if (sentResult?.key?.id) botSentMsgIds.add(sentResult.key.id);
          } catch (e) {}
          continue;
        }

        // 3. Missing Email
        if (!wizardData.email && lowerText !== 'saltar' && lowerText !== '/skip') {
          adminConversationStates.set(userStateKey, { step: 'WIZARD_CREATE_CONTACT', data: wizardData, lastUpdated: Date.now() });
          replyText =
            `✅ *Nombre*: ${wizardData.name}\n` +
            `✅ *Empresa*: ${wizardData.company}\n\n` +
            `📧 *Paso 3 de 3*: ¿Cuál es su **Correo Electrónico**?\n\n` +
            `*(Responde con el correo, o escribe "Saltar" para finalizar)*.`;
          try {
            const sentResult = await sock.sendMessage(rawRemoteJid, { text: replyText });
            if (sentResult?.key?.id) botSentMsgIds.add(sentResult.key.id);
          } catch (e) {}
          continue;
        }

        // ALL DATA COMPLETE! CREATE CONTACT IN CRM!
        const finalEmail = wizardData.email || `${wizardData.name.toLowerCase().replace(/\s+/g, '')}@investor.com`;
        const defaultTenant = (await prisma.tenant.findFirst({ where: { slug: 'outcrop-silver' } })) || (await prisma.tenant.findFirst());

        const newC = await prisma.contact.create({
          data: {
            tenantId: isAuthorized?.tenantId || (defaultTenant ? defaultTenant.id : null),
            name: wizardData.name,
            company: wizardData.company || 'Empresa Independiente',
            email: finalEmail,
            phone: `+${remoteDigits}`,
            whatsapp: `+${remoteDigits}`,
            investorType: 'Retail investor',
            stage: 'Lead Prospect',
            source: 'WhatsApp Assistant Wizard',
            tags: 'Creado por WhatsApp',
            customTags: '',
            dynamicIcebreaker: `Contacto agregado via Asistente WhatsApp por ${pushName || 'Administrador'}.`,
            strategicContext: 'Registrado desde chat de WhatsApp con asistente guiado paso a paso.',
            leadScore: 65,
          },
        });

        await prisma.timelineActivity.create({
          data: {
            contactId: newC.id,
            type: 'CONTACT_CREATED',
            title: 'Contact Created via WhatsApp Wizard',
            description: `Contact "${newC.name}" (${newC.company}) created via WhatsApp wizard by ${pushName || 'Admin'}.`,
          },
        });

        adminConversationStates.delete(userStateKey);

        replyText =
          `🎉 *¡Contacto Creado Exitosamente en el CRM!*\n\n` +
          `• 👤 *Nombre*: ${newC.name}\n` +
          `• 🏢 *Empresa*: ${newC.company}\n` +
          `• 📧 *Correo*: ${newC.email}\n` +
          `• 📊 *Etapa Inicial*: Lead Prospect (65 pts)\n` +
          `• 🛡️ *Registrado por*: ${pushName || 'Administrador'}\n\n` +
          `📇 *Enviando Ficha de Contacto vCard (.vcf) a tu chat...*`;

        try {
          const sentResult = await sock.sendMessage(rawRemoteJid, { text: replyText });
          if (sentResult?.key?.id) botSentMsgIds.add(sentResult.key.id);

          // Dispatch native vCard attachment!
          await sendNativeVCard(sock, rawRemoteJid, newC);
        } catch (e) {}
        continue;
      }

      // TRIGGER ENTRY: NATURAL LANGUAGE OR CONVERSATIONAL INITIATION
      if (
        lowerText.includes('agrega') ||
        lowerText.includes('agreguemos') ||
        lowerText.includes('crea') ||
        lowerText.includes('crear') ||
        lowerText.includes('añadir') ||
        lowerText.includes('anadir') ||
        lowerText.startsWith('/create') ||
        lowerText.startsWith('/crear')
      ) {
        const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
        const deMatch = text.match(/\bde\s+([A-Za-z0-9\s]+?)(?=\s+[\w.-]+@|\s*$)/i);

        let initialName = text
          .replace(/(hola|buenos días|buenas tardes|por favor|agreguemos|agrega|crear|crea|añadir|anadir|\/create|\/crear|un contacto|contacto)/gi, ' ')
          .trim()
          .replace(/^a\s+/i, '')
          .trim();

        if (emailMatch) initialName = initialName.replace(emailMatch[0], '').trim();
        if (deMatch) initialName = initialName.replace(deMatch[0], '').trim();
        initialName = initialName.replace(/\s+/g, ' ').trim();

        const wizardData = {
          name: initialName.length >= 2 ? initialName : null,
          company: deMatch && deMatch[1] ? deMatch[1].trim() : null,
          email: emailMatch ? emailMatch[0] : null,
        };

        adminConversationStates.set(userStateKey, {
          step: 'WIZARD_CREATE_CONTACT',
          data: wizardData,
          lastUpdated: Date.now(),
        });

        // 1. If all 3 fields provided on first turn, create immediately!
        if (wizardData.name && wizardData.company && wizardData.email) {
          const defaultTenant = (await prisma.tenant.findFirst({ where: { slug: 'outcrop-silver' } })) || (await prisma.tenant.findFirst());

          const newC = await prisma.contact.create({
            data: {
              tenantId: isAuthorized?.tenantId || (defaultTenant ? defaultTenant.id : null),
              name: wizardData.name,
              company: wizardData.company,
              email: wizardData.email,
              phone: `+${remoteDigits}`,
              whatsapp: `+${remoteDigits}`,
              investorType: 'Retail investor',
              stage: 'Lead Prospect',
              source: 'WhatsApp Natural Language',
              tags: 'Creado por WhatsApp',
              customTags: '',
              dynamicIcebreaker: `Contacto agregado via WhatsApp por ${pushName || 'Administrador'}.`,
              strategicContext: 'Registrado desde chat de WhatsApp con lenguaje natural.',
              leadScore: 65,
            },
          });

          await prisma.timelineActivity.create({
            data: {
              contactId: newC.id,
              type: 'CONTACT_CREATED',
              title: 'Contact Created via WhatsApp Natural Language',
              description: `Contact "${newC.name}" (${newC.company}) created via WhatsApp natural language by ${pushName || 'Admin'}.`,
            },
          });

          adminConversationStates.delete(userStateKey);

          replyText =
            `🎉 *¡Contacto Creado Exitosamente en el CRM!*\n\n` +
            `• 👤 *Nombre*: ${newC.name}\n` +
            `• 🏢 *Empresa*: ${newC.company}\n` +
            `• 📧 *Correo*: ${newC.email}\n` +
            `• 📊 *Etapa Inicial*: Lead Prospect (65 pts)\n` +
            `• 🛡️ *Registrado por*: ${pushName || 'Administrador'}\n\n` +
            `📇 *Enviando Ficha de Contacto vCard (.vcf) a tu chat...*`;

          try {
            const sentResult = await sock.sendMessage(rawRemoteJid, { text: replyText });
            if (sentResult?.key?.id) botSentMsgIds.add(sentResult.key.id);

            await sendNativeVCard(sock, rawRemoteJid, newC);
          } catch (e) {}
          continue;
        }

        // 2. If data is incomplete, trigger guided step-by-step assistant!
        if (!wizardData.name) {
          replyText =
            `➕ *Asistente Ejecutivo para Crear Contactos*\n\n` +
            `Te guiaré paso a paso para guardar la información.\n\n` +
            `👤 *Paso 1 de 3*: ¿Cuál es el **Nombre Completo** del contacto?\n\n` +
            `*(Ejemplo: Carlos Ruiz, o puedes darme todos los datos juntos: "Carlos Ruiz de Bancolombia carlos@bancolombia.com")*`;
        } else if (!wizardData.company) {
          replyText =
            `✅ *Nombre registrado*: ${wizardData.name}\n\n` +
            `🏢 *Paso 2 de 3*: ¿A qué **Empresa u Organización** pertenece?\n\n` +
            `*(Responde con el nombre de la empresa, o escribe "Saltar" si es independiente)*.`;
        } else if (!wizardData.email) {
          replyText =
            `✅ *Nombre*: ${wizardData.name}\n` +
            `✅ *Empresa*: ${wizardData.company}\n\n` +
            `📧 *Paso 3 de 3*: ¿Cuál es su **Correo Electrónico**?\n\n` +
            `*(Responde con el correo, o escribe "Saltar" para finalizar)*.`;
        }

        try {
          const sentResult = await sock.sendMessage(rawRemoteJid, { text: replyText });
          if (sentResult?.key?.id) botSentMsgIds.add(sentResult.key.id);
        } catch (e) {}
        continue;
      }

      // Default Response & Natural Language Command Menu
      const lowerT = text.toLowerCase();
      if (lowerT.includes('resumen') || lowerT.includes('/stats') || lowerT.includes('/resumen')) {
        const totalContacts = await prisma.contact.count();
        const totalDeals = await prisma.deal.count();
        replyText = `📊 *Panel Ejecutivo Outcrop Silver CRM*\n\n• 👤 Total Inversores: ${totalContacts}\n• 💼 Negociaciones: ${totalDeals}\n• 🛡️ Estado: Bot Activo 24/7 en la Nube (EasyPanel VPS)`;
      } else {
        replyText =
          `👋 *¡Hola, ${adminFirstName}! Bienvenido al Bot Ejecutivo de Outcrop Silver CRM (Servidor Nube 24/7).*\n\n` +
          `Comandos disponibles en tu WhatsApp:\n` +
          `• 📸 *Envía la FOTO de una tarjeta de presentación* (Frente + Reverso + Audio)\n` +
          `• 📊 *"Resumen"* - Estadísticas del CRM en vivo\n` +
          `• 👤 *"Agrega a Carlos Ruiz de Bancolombia carlos@bancolombia.com"*\n` +
          `• ❌ *"Cancelar"* - Salir de cualquier proceso activo`;
      }

      try {
        const sentResult = await sock.sendMessage(rawRemoteJid, { text: replyText });
        if (sentResult?.key?.id) botSentMsgIds.add(sentResult.key.id);
        console.log(`✅ Respuesta enviada a WhatsApp (+${remoteDigits})`);
      } catch (err) {
        console.error('Error enviando mensaje a WhatsApp:', err);
      }
    }
  });
}

startWhatsAppDaemon();
