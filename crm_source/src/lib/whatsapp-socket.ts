import { prisma } from '@/lib/prisma';
import * as EvoApi from '@/lib/evolution-api';

export async function getOrInitWhatsAppSocket() {
  return { sock: null, qrCodeDataUrl: null, pairingCode: null };
}
