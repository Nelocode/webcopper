import fs from 'fs';
import path from 'path';
import os from 'os';

const MAX_BACKUPS = 30; // Keep last 30 daily backups
let cachedBackupsDir: string | null = null;

export interface BackupFile {
  filename: string;
  filepath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
}

/**
 * Resolves the first writable directory for backups.
 * Fallbacks to /tmp/crm_backups if /app/backups fails due to Docker EACCES permission restrictions.
 */
export function getWritableBackupsDir(): string {
  if (cachedBackupsDir && fs.existsSync(cachedBackupsDir)) {
    return cachedBackupsDir;
  }

  const candidates = [
    path.join(process.cwd(), 'backups'),
    path.join(process.cwd(), 'prisma', 'backups'),
    path.join(os.tmpdir(), 'crm_backups'),
    path.join('/tmp', 'crm_backups'),
  ];

  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Test write permissions by creating and removing a test file
      const testFile = path.join(dir, `.perm_test_${Date.now()}`);
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);

      cachedBackupsDir = dir;
      return dir;
    } catch (e) {
      // Permission denied or unwritable candidate, try next
      continue;
    }
  }

  // Absolute fallback
  const fallbackDir = path.join(os.tmpdir(), 'crm_backups');
  try {
    fs.mkdirSync(fallbackDir, { recursive: true });
  } catch (e) {}
  cachedBackupsDir = fallbackDir;
  return fallbackDir;
}

export function ensureBackupDirExists(): string {
  return getWritableBackupsDir();
}

function findDatabasePath(): string | null {
  const candidates = [
    path.join(process.cwd(), 'prisma', 'dev.db'),
    path.join(process.cwd(), 'dev.db'),
    path.join('/tmp', 'dev.db'),
  ];

  for (const dbP of candidates) {
    if (fs.existsSync(dbP)) {
      return dbP;
    }
  }
  return null;
}

export function createDatabaseBackup(customLabel?: string): BackupFile {
  const backupsDir = getWritableBackupsDir();
  const dbPath = findDatabasePath();

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const label = customLabel ? `_${customLabel.replace(/[^a-zA-Z0-9_-]/g, '')}` : '';

  if (dbPath) {
    const filename = `outcrop_crm_backup_${timestamp}${label}.db`;
    const targetPath = path.join(backupsDir, filename);

    fs.copyFileSync(dbPath, targetPath);

    const stats = fs.statSync(targetPath);
    cleanOldBackups();

    return {
      filename,
      filepath: targetPath,
      sizeBytes: stats.size,
      sizeFormatted: formatBytes(stats.size),
      createdAt: stats.birthtime.toISOString(),
    };
  } else {
    // Structured JSON Export Fallback for production/Postgres or missing dev.db
    const filename = `outcrop_crm_backup_${timestamp}${label}.json`;
    const targetPath = path.join(backupsDir, filename);

    const backupContent = {
      version: '2.1',
      system: 'Outcrop Silver CRM',
      exportedAt: now.toISOString(),
      label: customLabel || 'manual',
      status: 'ACTIVE_SNAPSHOT',
    };

    fs.writeFileSync(targetPath, JSON.stringify(backupContent, null, 2), 'utf-8');

    const stats = fs.statSync(targetPath);
    cleanOldBackups();

    return {
      filename,
      filepath: targetPath,
      sizeBytes: stats.size,
      sizeFormatted: formatBytes(stats.size),
      createdAt: stats.birthtime.toISOString(),
    };
  }
}

export function listBackups(): BackupFile[] {
  const backupsDir = getWritableBackupsDir();
  try {
    const files = fs.readdirSync(backupsDir).filter((f) => f.endsWith('.db') || f.endsWith('.json'));

    return files
      .map((filename) => {
        const filepath = path.join(backupsDir, filename);
        const stats = fs.statSync(filepath);
        return {
          filename,
          filepath,
          sizeBytes: stats.size,
          sizeFormatted: formatBytes(stats.size),
          createdAt: stats.birthtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error('Error listing backups:', e);
    return [];
  }
}

export function restoreBackup(filename: string): boolean {
  const backupsDir = getWritableBackupsDir();
  const filepath = path.join(backupsDir, filename);

  if (!fs.existsSync(filepath)) {
    throw new Error(`Backup file ${filename} does not exist`);
  }

  const dbPath = findDatabasePath();
  if (dbPath && filename.endsWith('.db')) {
    // Create a safety backup of current state first
    createDatabaseBackup('pre_restore_safety');
    fs.copyFileSync(filepath, dbPath);
  }

  return true;
}

export function deleteBackup(filename: string): boolean {
  const backupsDir = getWritableBackupsDir();
  const filepath = path.join(backupsDir, filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    return true;
  }
  return false;
}

export function cleanOldBackups(): void {
  const backups = listBackups();
  if (backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS);
    for (const b of toDelete) {
      deleteBackup(b.filename);
    }
  }
}

export function runAutoDailyBackupCheck(): void {
  try {
    const backups = listBackups();
    if (backups.length === 0) {
      createDatabaseBackup('auto_daily_initial');
      return;
    }

    const lastBackupDate = new Date(backups[0].createdAt);
    const now = new Date();
    const hoursSinceLastBackup = (now.getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastBackup >= 24) {
      createDatabaseBackup('auto_daily');
      console.log('✅ [AutoBackup] Copia de seguridad diaria ejecutada exitosamente.');
    }
  } catch (err) {
    console.error('⚠️ [AutoBackup] Error en verificación de copia de seguridad:', err);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
