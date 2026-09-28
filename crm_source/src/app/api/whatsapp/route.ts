import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';
import * as EvoApi from '@/lib/evolution-api';

// Global session state
let globalSession = {
  status: 'DISCONNECTED', // DISCONNECTED, CONNECTING, CONNECTED
  phoneNumber: null as string | null,
  qrCode: null as string | null,
  botEnabled: true,
  lastActivity: new Date().toISOString(),
};

async function getPendingRequests(whitelist: any[]) {
  const inboundMsgs = await prisma.whatsAppMessage.findMany({
    where: { direction: 'INBOUND' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const whitelistNumbers = new Set(
    whitelist.map((w: any) => (w.phoneNumber || '').replace(/\D/g, ''))
  );

  const pendingMap = new Map();

  for (const msg of inboundMsgs) {
    const digits = (msg.fromNumber || '').replace(/\D/g, '');
    if (!digits || digits === 'CRMBot') continue;

    const isWhitelisted = Array.from(whitelistNumbers).some(
      (wDigits: string) => wDigits && (digits.endsWith(wDigits) || wDigits.endsWith(digits) || digits === wDigits)
    );

    if (!isWhitelisted && !pendingMap.has(msg.fromNumber)) {
      let nameToUse = (msg as any).senderName || null;
      if (!nameToUse || nameToUse === 'Usuario WhatsApp' || nameToUse === 'WhatsApp User') {
        const namedMsg = await prisma.whatsAppMessage.findFirst({
          where: {
            fromNumber: msg.fromNumber,
          },
        });
        if (namedMsg && (namedMsg as any).senderName && (namedMsg as any).senderName !== 'Usuario WhatsApp' && (namedMsg as any).senderName !== 'WhatsApp User') {
          nameToUse = (namedMsg as any).senderName;
        }
      }

      pendingMap.set(msg.fromNumber, {
        fromNumber: msg.fromNumber,
        senderName: nameToUse || 'New Contact (WhatsApp)',
        lastMessage: msg.message,
        createdAt: msg.createdAt,
      });
    }
  }

  return Array.from(pendingMap.values());
}

function extractInboundMessage(m: any, instanceName: string, tenantId: string) {
  if (!m) return null;

  const key = m?.key || m?.data?.key || {};
  const msgId: string = key.id || m?.id || '';
  const fromMe: boolean = key.fromMe || m?.fromMe || false;
  const remoteJid: string = key.remoteJid || m?.remoteJid || '';

  if (!msgId || fromMe || !remoteJid) return null;

  let msgContent = m?.message || m?.data?.message || {};
  if (msgContent.ephemeralMessage?.message) msgContent = msgContent.ephemeralMessage.message;
  if (msgContent.viewOnceMessage?.message) msgContent = msgContent.viewOnceMessage.message;
  if (msgContent.viewOnceMessageV2?.message) msgContent = msgContent.viewOnceMessageV2.message;
  if (msgContent.documentWithCaptionMessage?.message) msgContent = msgContent.documentWithCaptionMessage.message;

  const isImage = !!(
    msgContent.imageMessage ||
    (msgContent.documentMessage?.mimetype && msgContent.documentMessage.mimetype.startsWith('image/')) ||
    m.messageType === 'imageMessage' ||
    m.messageType === 'image' ||
    m?.data?.messageType === 'imageMessage'
  );

  const isAudio = !!(
    msgContent.audioMessage ||
    (msgContent.documentMessage?.mimetype && msgContent.documentMessage.mimetype.startsWith('audio/')) ||
    m.messageType === 'audioMessage' ||
    m.messageType === 'audio' ||
    m?.data?.messageType === 'audioMessage'
  );

  let buttonId = '';
  if (msgContent.buttonsResponseMessage?.selectedButtonId) {
    buttonId = msgContent.buttonsResponseMessage.selectedButtonId;
  } else if (msgContent.templateButtonReplyMessage?.selectedId) {
    buttonId = msgContent.templateButtonReplyMessage.selectedId;
  } else if (msgContent.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
    try {
      const parsedParams = JSON.parse(msgContent.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
      buttonId = parsedParams.id || '';
    } catch {}
  }

  const text = (
    buttonId ||
    msgContent.conversation ||
    msgContent.extendedTextMessage?.text ||
    msgContent.imageMessage?.caption ||
    msgContent.documentMessage?.caption ||
    m.text ||
    m?.data?.text ||
    ''
  ).trim();

  let imageBase64: string | null = null;
  if (isImage) {
    if (msgContent.imageMessage?.base64) {
      imageBase64 = msgContent.imageMessage.base64;
    } else if (m.base64 || m?.data?.base64) {
      imageBase64 = m.base64 || m?.data?.base64;
    } else if (msgContent.imageMessage?.jpegThumbnail) {
      const thumb = msgContent.imageMessage.jpegThumbnail;
      imageBase64 = typeof thumb === 'string' ? thumb : Buffer.from(thumb).toString('base64');
    }
  }

  let audioBase64: string | null = null;
  if (isAudio) {
    if (msgContent.audioMessage?.base64) {
      audioBase64 = msgContent.audioMessage.base64;
    } else if (m.base64 || m?.data?.base64) {
      audioBase64 = m.base64 || m?.data?.base64;
    }
  }

  const remoteJidAlt: string = key.remoteJidAlt || m.remoteJidAlt || m.participant || '';

  return {
    instanceName,
    tenantId,
    remoteJid,
    remoteJidAlt,
    pushName: (m.pushName || m?.data?.pushName || '').trim(),
    text,
    isImage,
    isAudio,
    imageBase64,
    audioBase64,
    fromMe: false,
    msgId,
    messageKey: key,
    rawMessage: m,
  };
}

export async function GET() {
  try {
    const defaultTenant =
      (await prisma.tenant.findFirst({ where: { slug: 'outcrop-silver' } })) ||
      (await prisma.tenant.findFirst());

    const tenantId = defaultTenant?.id || 'default-tenant';

    let dbSession = await prisma.whatsAppSession.findFirst({
      where: { tenantId },
    });

    if (!dbSession) {
      dbSession = await prisma.whatsAppSession.create({
        data: { tenantId, status: 'CONNECTED', qrCode: null, phoneNumber: '+573124031892', instanceName: 'OutcropBot' },
      });
    }

    if (EvoApi.isConfigured()) {
      const instanceName = dbSession.instanceName || 'OutcropBot';
      const evStatus = await EvoApi.getInstanceStatus(instanceName);
      const isConnected = evStatus.state === 'open';
      const isConnecting = evStatus.state === 'connecting';

      // Keep current QR in DB, don't regenerate every 2s while user is scanning!
      let freshQr = dbSession.qrCode;
      if (isConnected) {
        freshQr = null;
      } else if (!freshQr && isConnecting) {
        freshQr = await EvoApi.getInstanceQr(instanceName);
      }

      const newStatus = isConnected ? 'CONNECTED' : isConnecting ? 'CONNECTING' : 'DISCONNECTED';
      if (newStatus !== dbSession.status || (isConnected && evStatus.phoneNumber) || (isConnected && dbSession.qrCode !== null)) {
        dbSession = await prisma.whatsAppSession.update({
          where: { id: dbSession.id },
          data: {
            status: newStatus,
            phoneNumber: isConnected && evStatus.phoneNumber ? `+${evStatus.phoneNumber.replace(/\D/g, '')}` : dbSession.phoneNumber,
            qrCode: freshQr,
          },
        });
      }
    }

    globalSession.status = dbSession.status;
    globalSession.qrCode = dbSession.qrCode;
    globalSession.phoneNumber = dbSession.phoneNumber;

    let whitelist = await prisma.whatsAppWhitelist.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (whitelist.length === 0) {
      await prisma.whatsAppWhitelist.createMany({
        data: [
          { phoneNumber: '+573012954278', name: 'Sara', role: 'Admin', isActive: true, tenantId },
          { phoneNumber: '+573207116676', name: 'Nelson', role: 'Admin', isActive: true, tenantId },
          { phoneNumber: '+573124031892', name: 'Administrador WhatsApp', role: 'Admin', isActive: true, tenantId },
        ],
      });
      whitelist = await prisma.whatsAppWhitelist.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    const pendingRequests = await getPendingRequests(whitelist);

    const messages = await prisma.whatsAppMessage.findMany({
      take: 25,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      session: globalSession,
      whitelist,
      pendingRequests,
      messages,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ── EVOLUTION API WEBHOOK EVENT DISPATCH ──
    const event = body?.event;
    if (event) {
      const instanceName: string = body?.instance || body?.instanceName || 'OutcropBot';

      if (event === 'connection.update' || event === 'CONNECTION_UPDATE') {
        const state: string = body?.data?.state || body?.state || '';
        const phoneNumber: string = body?.data?.wuid || body?.data?.phoneNumber || body?.phoneNumber || '';

        const session = await prisma.whatsAppSession.findFirst({
          where: { OR: [{ instanceName }, { status: 'CONNECTED' }] },
        });

        if (session) {
          const status = state === 'open' ? 'CONNECTED' : state === 'connecting' ? 'CONNECTING' : 'DISCONNECTED';
          await prisma.whatsAppSession.update({
            where: { id: session.id },
            data: {
              status,
              phoneNumber: state === 'open' && phoneNumber ? `+${phoneNumber.replace(/\D/g, '')}` : session.phoneNumber,
              qrCode: state === 'open' ? null : session.qrCode,
            },
          });
        }
        return NextResponse.json({ ok: true });
      }

      if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
        const msgData = body?.data;
        if (!msgData) return NextResponse.json({ ok: true });

        const messages = Array.isArray(msgData) ? msgData : [msgData];
        const defaultTenant =
          (await prisma.tenant.findFirst({ where: { slug: 'outcrop-silver' } })) ||
          (await prisma.tenant.findFirst());
        const tenantId = defaultTenant?.id || 'default-tenant';

        const { processMessage } = await import('@/lib/whatsapp-processor');

        for (const m of messages) {
          const parsed = extractInboundMessage(m, instanceName, tenantId);
          if (parsed) {
            await processMessage(parsed);
          }
        }
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    const { action, message, phoneNumber, fromNumber, id, name, role, mediaUrl } = body;

    const defaultTenant =
      (await prisma.tenant.findFirst({ where: { slug: 'outcrop-silver' } })) ||
      (await prisma.tenant.findFirst());
    const tenantId = defaultTenant?.id || 'default-tenant';

    // 1. APPROVE PENDING ACCESS REQUEST WITH EDITABLE NAME
    if (action === 'APPROVE_REQUEST') {
      const targetPhone = (fromNumber || phoneNumber || '').trim();
      if (!targetPhone) {
        return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
      }

      const cleanPhone = targetPhone.startsWith('+') ? targetPhone : `+${targetPhone.replace(/\D/g, '')}`;
      const finalName = (name || '').trim() || 'Nuevo Administrador';

      const entry = await prisma.whatsAppWhitelist.upsert({
        where: { phoneNumber: cleanPhone },
        update: { name: finalName, role: role || 'Admin', isActive: true, tenantId },
        create: { phoneNumber: cleanPhone, name: finalName, role: role || 'Admin', isActive: true, tenantId },
      });

      const updatedWhitelist = await prisma.whatsAppWhitelist.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const pendingRequests = await getPendingRequests(updatedWhitelist);

      return NextResponse.json({
        success: true,
        message: `Acceso concedido a ${finalName} (${cleanPhone})`,
        entry,
        whitelist: updatedWhitelist,
        pendingRequests,
      });
    }

    // 2. Add Phone to Whitelist
    if (action === 'ADD_WHITELIST') {
      if (!phoneNumber) {
        return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
      }

      const cleanPhone = phoneNumber.trim().startsWith('+') ? phoneNumber.trim() : `+${phoneNumber.replace(/\D/g, '')}`;

      const entry = await prisma.whatsAppWhitelist.upsert({
        where: { phoneNumber: cleanPhone },
        update: { name: name || 'CRM Administrator', role: role || 'Admin', isActive: true, tenantId },
        create: { phoneNumber: cleanPhone, name: name || 'CRM Administrator', role: role || 'Admin', isActive: true, tenantId },
      });

      const updatedWhitelist = await prisma.whatsAppWhitelist.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const pendingRequests = await getPendingRequests(updatedWhitelist);

      return NextResponse.json({
        success: true,
        message: `Phone ${cleanPhone} successfully added to Whitelist.`,
        entry,
        whitelist: updatedWhitelist,
        pendingRequests,
      });
    }

    if (action === 'REMOVE_WHITELIST') {
      if (id) {
        await prisma.whatsAppWhitelist.deleteMany({ where: { id } });
      } else if (phoneNumber) {
        await prisma.whatsAppWhitelist.deleteMany({ where: { phoneNumber: phoneNumber.trim() } });
      }

      const updatedWhitelist = await prisma.whatsAppWhitelist.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const pendingRequests = await getPendingRequests(updatedWhitelist);

      return NextResponse.json({
        success: true,
        message: `Administrator removed from Whitelist.`,
        whitelist: updatedWhitelist,
        pendingRequests,
      });
    }

    // 3. QR Generation & Connection via Evolution API
    if (action === 'CONNECT' || action === 'REGENERATE_QR' || action === 'DISCONNECT') {
      let qrCode: string | null = null;
      if (EvoApi.isConfigured()) {
        const instanceName = EvoApi.instanceNameFor(tenantId);
        if (action === 'DISCONNECT') {
          await EvoApi.deleteInstance(instanceName);
        } else {
          qrCode = await EvoApi.getInstanceQr(instanceName);
        }
      }

      globalSession.status = action === 'DISCONNECT' ? 'DISCONNECTED' : qrCode ? 'CONNECTING' : 'CONNECTED';
      globalSession.qrCode = qrCode;

      let session = await prisma.whatsAppSession.findFirst({ where: { tenantId } });
      if (session) {
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: { status: globalSession.status, qrCode },
        });
      } else {
        await prisma.whatsAppSession.create({
          data: { tenantId, status: globalSession.status, qrCode, phoneNumber: null },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'WhatsApp Session updated.',
        session: globalSession,
      });
    }

    // 4. Instant 1-Click Direct Pairing
    if (action === 'DIRECT_PAIR' || action === 'SIMULATE_PAIRING' || action === 'REQUEST_PAIRING_CODE') {
      const targetPhone = (phoneNumber || '+573124031892').trim();

      await prisma.whatsAppWhitelist.upsert({
        where: { phoneNumber: targetPhone },
        update: { name: name || 'Administrador WhatsApp', role: 'Admin', isActive: true, tenantId },
        create: { phoneNumber: targetPhone, name: name || 'Administrador WhatsApp', role: 'Admin', isActive: true, tenantId },
      });

      let session = await prisma.whatsAppSession.findFirst({ where: { tenantId } });
      if (session) {
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: { status: 'CONNECTED', qrCode: null, phoneNumber: targetPhone },
        });
      } else {
        await prisma.whatsAppSession.create({
          data: { tenantId, status: 'CONNECTED', qrCode: null, phoneNumber: targetPhone },
        });
      }

      globalSession.status = 'CONNECTED';
      globalSession.phoneNumber = targetPhone;
      globalSession.qrCode = null;

      const updatedWhitelist = await prisma.whatsAppWhitelist.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const pendingRequests = await getPendingRequests(updatedWhitelist);

      return NextResponse.json({
        success: true,
        message: `✅ Dispositivo ${targetPhone} vinculado exitosamente. Bot activo.`,
        session: globalSession,
        whitelist: updatedWhitelist,
        pendingRequests,
      });
    }

    // 5. Send message via Evolution API
    if (action === 'SEND_MESSAGE') {
      if (!message || !phoneNumber) {
        return NextResponse.json({ success: false, error: 'Phone and message are required' }, { status: 400 });
      }

      const inputDigits = phoneNumber.replace(/\D/g, '');
      const allWhitelist = await prisma.whatsAppWhitelist.findMany({ where: { isActive: true } });

      const isAuthorized = allWhitelist.find((w) => {
        const wDigits = w.phoneNumber.replace(/\D/g, '');
        return wDigits && (inputDigits.endsWith(wDigits) || wDigits.endsWith(inputDigits) || inputDigits === wDigits);
      });

      const outbound = await prisma.whatsAppMessage.create({
        data: {
          tenantId,
          fromNumber: phoneNumber,
          senderName: 'Sandbox User',
          toNumber: 'Outcrop Silver CRM Bot',
          message,
          mediaUrl: mediaUrl || null,
          direction: 'INBOUND',
        },
      });

      if (EvoApi.isConfigured()) {
        await EvoApi.sendText('OutcropBot', phoneNumber, message);
      }

      return NextResponse.json({ success: true, messageSent: outbound, isAuthorized: !!isAuthorized });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
