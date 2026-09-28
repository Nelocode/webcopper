import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const update = await request.json();
    const message = update.message || update.channel_post || update.edited_message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const text = (message.text || '').trim();
    const chatId = String(message.chat?.id || '');

    // Check if message is a JSON response or plain text from Hermes
    let parsedJson: any = null;
    try {
      if (text.startsWith('{') && text.endsWith('}')) {
        parsedJson = JSON.parse(text);
      } else {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          parsedJson = JSON.parse(jsonMatch[1]);
        }
      }
    } catch (e) {}

    let targetSessionId = parsedJson?.sessionId;

    // If no sessionId in message, find the latest active HermesSession
    if (!targetSessionId) {
      const latestSession = await prisma.hermesSession.findFirst({
        orderBy: { updatedAt: 'desc' },
      });
      targetSessionId = latestSession?.id;
    }

    if (targetSessionId) {
      const content = parsedJson?.content || parsedJson?.message || text;
      const workerName = parsedJson?.worker?.name || parsedJson?.workerName || null;
      const workerStatus = parsedJson?.worker?.status || parsedJson?.workerStatus || 'completed';
      const workerData = parsedJson?.worker?.data ? JSON.stringify(parsedJson.worker.data) : null;
      const attachments = parsedJson?.attachments ? JSON.stringify(parsedJson.attachments) : null;

      await prisma.hermesMessage.create({
        data: {
          sessionId: targetSessionId,
          role: 'assistant',
          content,
          attachments,
          workerName,
          workerStatus,
          workerData,
        },
      });

      await prisma.hermesSession.update({
        where: { id: targetSessionId },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error processing Telegram webhook update:', error?.message);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Hermes Telegram Webhook Active',
    gateway: 'Outcrop Silver CRM v14.2',
  });
}
