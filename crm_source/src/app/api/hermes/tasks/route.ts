import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // Fetch messages from user that haven't been answered yet in active sessions
    const pendingSessions = await prisma.hermesSession.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
      },
    });

    const tasks: any[] = [];

    for (const session of pendingSessions) {
      const msgs = session.messages || [];
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        // If the latest message is from user, it's a pending task for the Mac
        if (lastMsg.role === 'user') {
          // All prior messages in this session before the current prompt
          const priorMessages = msgs.slice(0, msgs.length - 1).map((m) => ({
            role: m.role,
            content: m.content,
            workerName: m.workerName,
          }));

          tasks.push({
            taskId: lastMsg.id,
            sessionId: session.id,
            prompt: lastMsg.content,
            history: priorMessages,
            workerName: lastMsg.workerName || 'GENERAL',
            attachments: lastMsg.attachments,
            audioUrl: lastMsg.audioUrl,
            createdAt: lastMsg.createdAt,
          });
        }
      }
    }

    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
