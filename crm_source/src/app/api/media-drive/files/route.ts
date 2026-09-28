import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const folderId = searchParams.get('folderId');
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    const folderWhere: any = {};
    const fileWhere: any = {};

    if (tenantId) {
      folderWhere.tenantId = tenantId;
      fileWhere.tenantId = tenantId;
    }

    if (folderId && folderId !== 'root') {
      fileWhere.folderId = folderId;
    }

    if (search) {
      fileWhere.OR = [
        { name: { contains: search } },
        { originalName: { contains: search } },
        { aiSummary: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    if (category && category !== 'ALL') {
      fileWhere.aiCategory = category;
    }

    // Default system folders if empty - ONLY Sample folder created!
    let folders = await prisma.mediaFolder.findMany({
      where: folderWhere,
      orderBy: { createdAt: 'asc' },
    });

    if (folders.length === 0) {
      await prisma.mediaFolder.create({
        data: { name: 'Sample', color: '#00E5FF', tenantId },
      });
      folders = await prisma.mediaFolder.findMany({
        where: folderWhere,
        orderBy: { createdAt: 'asc' },
      });
    }

    const files = await prisma.mediaFile.findMany({
      where: fileWhere,
      orderBy: { createdAt: 'desc' },
      include: { folder: true },
    });

    return NextResponse.json({
      success: true,
      folders,
      files,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, name, color, folderId, tenantId, fileId, tags, category } = body;

    if (action === 'CREATE_FOLDER') {
      if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });

      const newFolder = await prisma.mediaFolder.create({
        data: {
          name,
          color: color || '#00E5FF',
          tenantId,
        },
      });

      return NextResponse.json({ success: true, folder: newFolder });
    }

    if (action === 'UPDATE_FILE') {
      if (!fileId) return NextResponse.json({ success: false, error: 'fileId is required' }, { status: 400 });

      const updated = await prisma.mediaFile.update({
        where: { id: fileId },
        data: {
          ...(folderId !== undefined ? { folderId } : {}),
          ...(tags !== undefined ? { tags } : {}),
          ...(category !== undefined ? { aiCategory: category } : {}),
        },
      });

      return NextResponse.json({ success: true, file: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const folderId = searchParams.get('folderId');

    if (fileId) {
      await prisma.mediaFile.delete({ where: { id: fileId } });
      return NextResponse.json({ success: true, message: 'File deleted' });
    }

    if (folderId) {
      // Unlink files from folder before deletion so files remain in ALL files
      await prisma.mediaFile.updateMany({
        where: { folderId },
        data: { folderId: null },
      });

      await prisma.mediaFolder.delete({ where: { id: folderId } });
      return NextResponse.json({ success: true, message: 'Folder deleted' });
    }

    return NextResponse.json({ success: false, error: 'Missing fileId or folderId' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
