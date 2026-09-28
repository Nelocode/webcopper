import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('x-hermes-key') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    // Check auth
    if (token && token !== 'hermes_outcrop_secret_2026') {
      const config = await prisma.hermesConfig.findFirst({
        where: { apiKey: token },
      });
      if (!config && token !== 'hermes_outcrop_secret_2026') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const payload = await request.json();
    const { sessionId, tenantId, role = 'assistant', content = '', worker, attachments = [] } = payload;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 });
    }

    // Ensure session exists
    let session = await prisma.hermesSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      session = await prisma.hermesSession.create({
        data: {
          id: sessionId,
          tenantId: tenantId || null,
          title: content ? content.slice(0, 30) + '...' : 'Sesión de Hermes',
        },
      });
    } else {
      await prisma.hermesSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
    }

    // Save message to database
    const savedMessage = await prisma.hermesMessage.create({
      data: {
        sessionId,
        role: role || 'assistant',
        content: content || (worker?.summary ? `⚙️ **${worker.name || 'Worker'}**: ${worker.summary}` : 'Tarea completada.'),
        attachments: attachments && attachments.length > 0 ? JSON.stringify(attachments) : null,
        workerName: worker?.name || null,
        workerStatus: worker?.status || (worker ? 'completed' : null),
        workerData: worker?.data ? JSON.stringify(worker.data) : null,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: savedMessage.id,
      sessionId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
