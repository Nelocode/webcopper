import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tenantId = (formData.get('tenantId') as string) || session?.tenantId;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64 Data URI for universal instant rendering across environments
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || 'image/png';
    const logoDataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // Optionally save file locally if needed
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const ext = path.extname(file.name) || '.png';
      const filename = `logo_${Date.now()}${ext}`;
      const localFilePath = path.join(uploadDir, filename);
      fs.writeFileSync(localFilePath, buffer);
    } catch (e) {
      console.log('Local disk logo save skipped:', e);
    }

    // Update tenant logoUrl in Prisma if tenantId exists
    if (tenantId) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { logoUrl: logoDataUrl },
      });
    }

    return NextResponse.json({
      success: true,
      logoUrl: logoDataUrl,
      message: 'Logo corporativo subido y aplicado exitosamente.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
