import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await prisma.socialPost.findUnique({
      where: { id },
      include: {
        category: true,
        media: true,
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.socialPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    const updated = await prisma.socialPost.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title.trim() : existing.title,
        content: body.content !== undefined ? body.content : existing.content,
        platforms: body.platforms !== undefined ? body.platforms : existing.platforms,
        status: body.status !== undefined ? body.status : existing.status,
        categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : existing.scheduledDate,
        isRecurring: body.isRecurring !== undefined ? !!body.isRecurring : existing.isRecurring,
        recurringFrequency: body.recurringFrequency !== undefined ? body.recurringFrequency : existing.recurringFrequency,
        recurringDay: body.recurringDay !== undefined ? body.recurringDay : existing.recurringDay,
        hashtags: body.hashtags !== undefined ? body.hashtags : existing.hashtags,
      },
      include: {
        category: true,
        media: true,
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Check if it was a date drag & drop shift or general update
    const isDateShift = body.scheduledDate && new Date(body.scheduledDate).getTime() !== new Date(existing.scheduledDate).getTime();
    const actionName = isDateShift ? 'reschedule_post' : 'update_post';
    const detailMsg = isDateShift
      ? `Publicación reprogramada: "${updated.title}" para ${new Date(updated.scheduledDate).toLocaleString('es-CL')}`
      : `Publicación actualizada: "${updated.title}" (${updated.status})`;

    const session = await getSession();
    const username = session?.name || session?.email || 'Admin Outcrop';

    await prisma.socialAuditLog.create({
      data: {
        action: actionName,
        username,
        entityType: 'post',
        entityId: id,
        details: detailMsg,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.socialPost.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    await prisma.socialPost.delete({ where: { id } });

    const session = await getSession();
    const username = session?.name || session?.email || 'Admin Outcrop';

    await prisma.socialAuditLog.create({
      data: {
        action: 'delete_post',
        username,
        entityType: 'post',
        entityId: id,
        details: `Publicación eliminada: "${existing.title}"`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, username } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'El comentario no puede estar vacío' }, { status: 400 });
    }

    const session = await getSession();
    const loggedInUsername = session?.name || session?.email || 'Admin Outcrop';
    const commentUsername = username || loggedInUsername;

    const comment = await prisma.socialComment.create({
      data: {
        postId: id,
        username: commentUsername,
        content: content.trim(),
      },
    });

    await prisma.socialAuditLog.create({
      data: {
        action: 'add_comment',
        username: commentUsername,
        entityType: 'post',
        entityId: id,
        details: `Comentario agregado en post: "${content.substring(0, 40)}..."`,
      },
    });

    return NextResponse.json(comment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
