/**
 * POST /api/whatsapp/webhook
 * Evolution API sends all WhatsApp events here.
 * Robust message extraction for all Evolution API v1 & v2 payload structures.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processMessage } from '@/lib/whatsapp-processor';

// Prevent duplicate processing
const recentMsgIds = new Set<string>();

async function extractInboundMessage(m: any, instanceName: string, tenantId: string) {
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

  const text = (
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
    }
    // NOTE: jpegThumbnail is intentionally skipped — it's too low-res for OCR.
    // processMessage will download the full-resolution image via downloadMediaBase64().
  }

  let audioBase64: string | null = null;
  if (isAudio) {
    if (msgContent.audioMessage?.base64) {
      audioBase64 = msgContent.audioMessage.base64;
    } else if (m.base64 || m?.data?.base64) {
      audioBase64 = m.base64 || m?.data?.base64;
    }
    // NOTE: processMessage will download the full audio via downloadMediaBase64().
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body?.event;

    // ── CONNECTION_UPDATE: update session status in DB ──────────────────
    if (event === 'connection.update' || event === 'CONNECTION_UPDATE') {
      const instanceName: string = body?.instance || body?.instanceName || '';
      const state: string = body?.data?.state || body?.state || '';
      const phoneNumber: string = body?.data?.wuid || body?.data?.phoneNumber || body?.phoneNumber || '';

      const session = await prisma.whatsAppSession.findFirst({
        where: { OR: [{ instanceName }, { status: 'CONNECTED' }] },
      });

      if (session) {
        let status = 'DISCONNECTED';
        if (state === 'open') status = 'CONNECTED';
        else if (state === 'connecting') status = 'CONNECTING';

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

    // ── QRCODE_UPDATED: save new QR to DB ──────────────────────────────
    if (event === 'qrcode.updated' || event === 'QRCODE_UPDATED') {
      const instanceName: string = body?.instance || body?.instanceName || '';
      const base64: string = body?.data?.qrcode?.base64 || body?.qrcode?.base64 || '';

      const session = await prisma.whatsAppSession.findFirst({
        where: { instanceName },
      });
      if (session && base64) {
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            qrCode: base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`,
            status: 'CONNECTING',
          },
        });
      }
      return NextResponse.json({ ok: true });
    }

    // ── MESSAGES_UPSERT: process inbound messages ───────────────────────
    if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
      const instanceName: string = body?.instance || body?.instanceName || 'OutcropBot';
      const msgData = body?.data;

      await prisma.timelineActivity.create({ data: { contactId: (await prisma.contact.findFirst())?.id || '', title: 'DEBUG_WEBHOOK_START', description: `Event: ${event}, msgData exists: ${!!msgData}` }}).catch(() => {});

      if (!msgData) return NextResponse.json({ ok: true });

      let messages: any[] = [];
      if (Array.isArray(msgData)) {
        messages = msgData;
      } else if (Array.isArray(msgData?.messages)) {
        messages = msgData.messages;
      } else {
        messages = [msgData];
      }

      // Proceso en background para evitar timeouts
      (async () => {
        try {
          const defaultTenant =
            (await prisma.tenant.findFirst({ where: { slug: 'outcrop-silver' } })) ||
            (await prisma.tenant.findFirst());
          const tenantId = defaultTenant?.id || 'default-tenant';

          for (const m of messages) {
            if (m.key?.fromMe) continue; // Ignore bot's own messages

            const msgId = m.key?.id || m.id;
            if (recentMsgIds.has(msgId)) continue;
            recentMsgIds.add(msgId);
            if (recentMsgIds.size > 1000) recentMsgIds.clear();

            await prisma.timelineActivity.create({ data: { contactId: (await prisma.contact.findFirst())?.id || '', title: 'DEBUG_WEBHOOK_MSG', description: `Extracting message ID: ${msgId}, remoteJid: ${m.key?.remoteJid}` }}).catch(() => {});

            const parsed = await extractInboundMessage(m, instanceName, tenantId);
            if (parsed) {
              await processMessage(parsed);
            }
          }
        } catch (e: any) {
          console.error('[Background Processing Error]', e);
          await prisma.timelineActivity.create({
            data: {
              contactId: (await prisma.contact.findFirst())?.id || '',
              title: 'DEBUG_ERROR',
              description: `Background error: ${e?.message || String(e)}`.slice(0, 500),
            },
          }).catch(() => {});
        }
      })();

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[Webhook] Error:', err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

// Evolution API verifies the webhook with a GET request
export async function GET() {
  return NextResponse.json({ status: 'Evolution API Webhook Active', crm: 'Outcrop Silver CRM v20.2' });
}
