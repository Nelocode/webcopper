import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let file: File | null = null;
    let folderId: string | null = null;
    let tenantId: string | null = null;
    let importUrl: string | null = null;
    let accessLevel: string = 'PUBLIC';

    const driveDir = path.join(process.cwd(), 'public', 'uploads', 'drive');
    if (!fs.existsSync(driveDir)) {
      fs.mkdirSync(driveDir, { recursive: true });
    }

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      file = formData.get('file') as File | null;
      folderId = (formData.get('folderId') as string) || null;
      tenantId = (formData.get('tenantId') as string) || null;
      accessLevel = (formData.get('accessLevel') as string) || 'PUBLIC';
    } else {
      const body = await request.json();
      importUrl = body.importUrl || null;
      folderId = body.folderId || null;
      tenantId = body.tenantId || null;
      accessLevel = body.accessLevel || 'PUBLIC';
    }

    let fileName = '';
    let mimeType = 'application/octet-stream';
    let size = 0;
    let fileUrl = '';

    // Handle Direct File Upload
    if (file) {
      fileName = file.name;
      mimeType = file.type || 'application/octet-stream';
      size = file.size;

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileExt = path.extname(file.name);
      const sanitizedBase = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filenameOnDisk = `drive_${Date.now()}_${sanitizedBase}${fileExt}`;
      const filePath = path.join(driveDir, filenameOnDisk);

      fs.writeFileSync(filePath, buffer);
      fileUrl = `/uploads/drive/${filenameOnDisk}`;
    } else if (importUrl) {
      // Handle Cloud / Remote URL Import (Google Drive / Public Links)
      const res = await fetch(importUrl);
      if (!res.ok) {
        return NextResponse.json({ success: false, error: 'Could not fetch remote URL' }, { status: 400 });
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const parsedUrl = new URL(importUrl);
      const urlBasename = path.basename(parsedUrl.pathname) || 'imported_file.pdf';
      const fileExt = path.extname(urlBasename) || '.pdf';

      fileName = urlBasename;
      mimeType = res.headers.get('content-type') || 'application/octet-stream';
      size = buffer.length;

      const filenameOnDisk = `drive_import_${Date.now()}_${urlBasename}`;
      const filePath = path.join(driveDir, filenameOnDisk);

      fs.writeFileSync(filePath, buffer);
      fileUrl = `/uploads/drive/${filenameOnDisk}`;
    } else {
      return NextResponse.json({ success: false, error: 'No file or importUrl provided' }, { status: 400 });
    }

    // Auto-derive Category from extension / mimeType
    let aiCategory = 'General';
    if (mimeType.startsWith('image/')) aiCategory = 'Imágenes & Medios de Prensa';
    else if (mimeType.includes('pdf') || mimeType.includes('presentation')) aiCategory = 'Presentaciones IR & Pitch Decks';
    else if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) aiCategory = 'Reportes Técnicos Santa Ana';
    else if (mimeType.includes('word') || mimeType.includes('document')) aiCategory = 'Documentos Legales & Contratos';

    const normalizedFolderId = folderId && folderId !== 'root' && folderId !== 'ALL' ? folderId : null;

    // CHECK FOR VERSIONING (File with same name in same folder)
    const existingFile = await prisma.mediaFile.findFirst({
      where: {
        name: fileName,
        folderId: normalizedFolderId,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    if (existingFile) {
      const newVersion = (existingFile.version || 1) + 1;
      let prevList: any[] = [];
      try {
        if (existingFile.previousVersionsJson) prevList = JSON.parse(existingFile.previousVersionsJson);
      } catch (e) {}

      prevList.push({
        version: existingFile.version || 1,
        url: existingFile.url,
        size: existingFile.size,
        createdAt: existingFile.updatedAt || existingFile.createdAt,
      });

      const updatedFile = await prisma.mediaFile.update({
        where: { id: existingFile.id },
        data: {
          url: fileUrl,
          size,
          mimeType,
          version: newVersion,
          previousVersionsJson: JSON.stringify(prevList),
          accessLevel,
          aiCategory,
        },
      });

      return NextResponse.json({
        success: true,
        isNewVersion: true,
        version: newVersion,
        file: updatedFile,
      });
    }

    // Create New File Record
    const newMediaFile = await prisma.mediaFile.create({
      data: {
        name: fileName,
        originalName: fileName,
        mimeType,
        size,
        url: fileUrl,
        folderId: normalizedFolderId,
        tenantId,
        accessLevel,
        aiCategory,
        version: 1,
        tags: `${path.extname(fileName).replace('.', '')}, upload`,
      },
    });

    return NextResponse.json({
      success: true,
      file: newMediaFile,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
