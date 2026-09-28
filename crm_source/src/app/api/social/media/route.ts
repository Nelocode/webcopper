import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where: any = {};
    if (search && search.trim()) {
      where.OR = [
        { fileName: { contains: search } },
        { filePath: { contains: search } },
      ];
    }

    const media = await prisma.socialMedia.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ media });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const postId = formData.get('postId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'social');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.name) || (file.type.startsWith('video/') ? '.mp4' : '.jpg');
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/social/${filename}`;
    const fileType = file.type.startsWith('video/') ? 'video' : 'image';

    const mediaRecord = await prisma.socialMedia.create({
      data: {
        postId: postId || null,
        filePath: relativeUrl,
        fileType,
        fileName: file.name,
        fileSize: file.size,
      },
    });

    const session = await getSession();
    const username = session?.name || session?.email || 'Admin Outcrop';

    await prisma.socialAuditLog.create({
      data: {
        action: 'upload_media',
        username,
        entityType: 'media',
        entityId: mediaRecord.id,
        details: `Archivo cargado: "${file.name}" (${fileType})`,
      },
    });

    return NextResponse.json(mediaRecord);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de archivo requerido' }, { status: 400 });
    }

    const mediaRecord = await prisma.socialMedia.findUnique({ where: { id } });

    if (mediaRecord) {
      const fullPath = path.join(process.cwd(), 'public', mediaRecord.filePath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (e) {
          console.error('Error unlinking file:', e);
        }
      }
      await prisma.socialMedia.delete({ where: { id } });

      const session = await getSession();
      const username = session?.name || session?.email || 'Admin Outcrop';

      await prisma.socialAuditLog.create({
        data: {
          action: 'delete_media',
          username,
          entityType: 'media',
          entityId: id,
          details: `Archivo eliminado: "${mediaRecord.fileName}"`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
