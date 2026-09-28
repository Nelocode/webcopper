import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, getEffectiveTenantId } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const platform = searchParams.get('platform');
    const categoryId = searchParams.get('category_id');
    const requestedTenantId = searchParams.get('tenantId');

    const effectiveTenantId = getEffectiveTenantId(session, requestedTenantId);

    const where: any = {};

    if (effectiveTenantId) {
      where.tenantId = effectiveTenantId;
    }

    if (startDate && endDate) {
      where.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    if (platform && platform !== 'all') {
      where.platforms = {
        contains: platform,
      };
    }

    const posts = await prisma.socialPost.findMany({
      where,
      include: {
        category: true,
        media: true,
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    return NextResponse.json({ posts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const {
      title,
      content,
      platforms,
      status,
      categoryId,
      scheduledDate,
      isRecurring,
      recurringFrequency,
      recurringDay,
      hashtags,
      mediaIds,
      tenantId: bodyTenantId,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
    }

    const effectiveTenantId = getEffectiveTenantId(session, bodyTenantId);

    const newPost = await prisma.socialPost.create({
      data: {
        tenantId: effectiveTenantId || null,
        title: title.trim(),
        content: content || '',
        platforms: platforms || 'instagram,x,linkedin',
        status: status || 'scheduled',
        categoryId: categoryId || null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        isRecurring: !!isRecurring,
        recurringFrequency: recurringFrequency || 'weekly',
        recurringDay: recurringDay || null,
        hashtags: hashtags || '',
        authorName: 'Equipo IR',
      },
      include: {
        category: true,
        media: true,
        comments: true,
      },
    });

    // Associate media if provided
    if (mediaIds && Array.isArray(mediaIds) && mediaIds.length > 0) {
      await prisma.socialMedia.updateMany({
        where: { id: { in: mediaIds } },
        data: { postId: newPost.id },
      });
    }

    const updatedPost = await prisma.socialPost.findUnique({
      where: { id: newPost.id },
      include: { category: true, media: true, comments: true },
    });

    const username = session?.name || session?.email || 'Admin Outcrop';

    // Record Audit Log
    await prisma.socialAuditLog.create({
      data: {
        action: 'create_post',
        username,
        entityType: 'post',
        entityId: newPost.id,
        details: `Publicación creada: "${newPost.title}" (${newPost.status})`,
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
