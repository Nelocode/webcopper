import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  listBackups,
  createDatabaseBackup,
  restoreBackup,
  deleteBackup,
  runAutoDailyBackupCheck,
  getWritableBackupsDir,
} from '@/lib/backup';
import { getSession, requireRole } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!requireRole(session, 'SUPER_ADMIN', 'TENANT_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Run auto daily backup check on GET requests
    runAutoDailyBackupCheck();

    const backups = listBackups();
    return NextResponse.json({
      success: true,
      backups,
      totalCount: backups.length,
      retentionDays: 30,
      autoBackupStatus: 'ACTIVE',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!requireRole(session, 'SUPER_ADMIN', 'TENANT_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, filename, label } = body;

    if (action === 'CREATE') {
      const newBackup = createDatabaseBackup(label || 'manual');
      return NextResponse.json({
        success: true,
        message: 'Copia de seguridad creada exitosamente.',
        backup: newBackup,
      });
    }

    if (action === 'RESTORE' && filename) {
      restoreBackup(filename);
      return NextResponse.json({
        success: true,
        message: `Base de datos restaurada exitosamente desde ${filename}.`,
      });
    }

    if (action === 'DELETE' && filename) {
      deleteBackup(filename);
      return NextResponse.json({
        success: true,
        message: `Copia de seguridad ${filename} eliminada.`,
      });
    }

    if (action === 'DOWNLOAD' && filename) {
      const backupsDir = getWritableBackupsDir();
      const filepath = path.join(backupsDir, filename);

      if (!fs.existsSync(filepath)) {
        return NextResponse.json({ success: false, error: 'Backup file not found' }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(filepath);
      return new Response(fileBuffer, {
        headers: {
          'Content-Type': 'application/x-sqlite3',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
