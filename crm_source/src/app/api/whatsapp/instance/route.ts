/**
 * GET  /api/whatsapp/instance  – Get or create instance for caller's tenant
 * POST /api/whatsapp/instance  – Actions: create, disconnect, getQr
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as EvoApi from '@/lib/evolution-api';
import { verifySession } from '@/lib/session';

// Helper: get tenantId from query, session cookie, or default tenant
async function getTenantId(req: NextRequest): Promise<string | null> {
  const queryTenant = req.nextUrl.searchParams.get('tenantId');
  if (queryTenant) return queryTenant;

  try {
    const sessionCookie = req.cookies.get('crm_session')?.value;
    if (sessionCookie) {
      const payload = await verifySession(sessionCookie);
      if (payload?.tenantId) return payload.tenantId;
      if (payload?.userId) {
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (user?.tenantId) return user.tenantId;
      }
    }
  } catch {}

  const defaultTenant =
    (await prisma.tenant.findFirst({ where: { slug: 'outcrop-silver' } })) ||
    (await prisma.tenant.findFirst());
  return defaultTenant?.id || null;
}

export async function GET(req: NextRequest) {
  try {
    if (!EvoApi.isConfigured()) {
      return NextResponse.json({ configured: false, message: 'EVOLUTION_API_URL not set' });
    }

    const tenantId = await getTenantId(req);
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    let session = await prisma.whatsAppSession.findFirst({ where: { tenantId } });

    if (!session) {
      // Auto-create session record + Evolution instance on first call
      const instanceName = EvoApi.instanceNameFor(tenantId);
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/whatsapp/webhook`;
      await EvoApi.createInstance(tenantId, webhookUrl);

      session = await prisma.whatsAppSession.create({
        data: { tenantId, instanceName, status: 'CONNECTING', qrCode: null, phoneNumber: null },
      });
    }

    // Always refresh status from Evolution
    const instanceName = session.instanceName || EvoApi.instanceNameFor(tenantId);
    const evStatus = await EvoApi.getInstanceStatus(instanceName);

    const status =
      evStatus.state === 'open' ? 'CONNECTED' :
      evStatus.state === 'connecting' ? 'CONNECTING' : 'DISCONNECTED';

    // Fetch fresh QR if not connected
    let qrCode = session.qrCode;
    if (status !== 'CONNECTED') {
      const freshQr = await EvoApi.getInstanceQr(instanceName);
      if (freshQr && freshQr !== qrCode) {
        qrCode = freshQr;
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: { qrCode: freshQr, status: 'CONNECTING' },
        });
      }
    } else if (qrCode) {
      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { qrCode: null, status: 'CONNECTED', phoneNumber: evStatus.phoneNumber || session.phoneNumber },
      });
      qrCode = null;
    }

    return NextResponse.json({
      configured: true,
      status,
      phoneNumber: evStatus.phoneNumber || session.phoneNumber,
      qrCode,
      instanceName,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!EvoApi.isConfigured()) {
      return NextResponse.json({ error: 'EVOLUTION_API_URL not configured' }, { status: 503 });
    }

    const tenantId = await getTenantId(req);
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const { action } = await req.json();

    if (action === 'create' || action === 'connect') {
      const instanceName = EvoApi.instanceNameFor(tenantId);
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/whatsapp/webhook`;
      await EvoApi.createInstance(tenantId, webhookUrl);

      const qrCode = await EvoApi.getInstanceQr(instanceName);

      let session = await prisma.whatsAppSession.findFirst({ where: { tenantId } });
      if (session) {
        session = await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: { instanceName, status: 'CONNECTING', qrCode, phoneNumber: null },
        });
      } else {
        session = await prisma.whatsAppSession.create({
          data: { tenantId, instanceName, status: 'CONNECTING', qrCode, phoneNumber: null },
        });
      }

      return NextResponse.json({ status: 'CONNECTING', qrCode, instanceName });
    }

    if (action === 'disconnect') {
      const session = await prisma.whatsAppSession.findFirst({ where: { tenantId } });
      if (session?.instanceName) {
        await EvoApi.deleteInstance(session.instanceName);
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: { status: 'DISCONNECTED', qrCode: null, phoneNumber: null },
        });
      }
      return NextResponse.json({ status: 'DISCONNECTED' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
