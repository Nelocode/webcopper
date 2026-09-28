/**
 * Evolution API Client - Multi-Tenant WhatsApp Gateway
 * Connects the CRM to an Evolution API instance running on EasyPanel VPS
 */

const BASE_URL = (process.env.EVOLUTION_API_URL || 'https://herramientas-evolution-api.wu48i0.easypanel.host').replace(/\/$/, '');
const GLOBAL_KEY = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

function headers() {
  return { 'Content-Type': 'application/json', apikey: GLOBAL_KEY };
}

/** Derives a safe Evolution API instance name from a tenantId */
export function instanceNameFor(tenantId: string): string {
  if (!tenantId || tenantId === 'default-tenant') return 'OutcropBot';
  return `crm-${tenantId.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 40)}`;
}

// ─────────────────────────────────────────────
// INSTANCE MANAGEMENT
// ─────────────────────────────────────────────

/** Create a new instance for a tenant. Safe to call even if it already exists. */
export async function createInstance(tenantId: string, webhookUrl: string) {
  const instanceName = instanceNameFor(tenantId);
  const res = await fetch(`${BASE_URL}/instance/create`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhook: webhookUrl,
      webhookByEvents: false,
      webhookBase64: true,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED', 'MESSAGES_UPDATE'],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (!text.includes('already exists') && !text.includes('já existe')) {
      console.warn(`createInstance note: ${res.status} ${text}`);
    }
  }
  return instanceName;
}

/** Get QR code for an instance (returns base64 data URL or null if already connected) */
export async function getInstanceQr(instanceName: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/instance/connect/${instanceName}`, {
      headers: headers(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.base64) {
      const clean = data.base64.replace(/^data:image\/[a-z]+;base64,/, '');
      return `data:image/png;base64,${clean}`;
    }
    if (data?.code) return data.code;
    return null;
  } catch {
    return null;
  }
}

/** Get connection state of an instance */
export async function getInstanceStatus(instanceName: string): Promise<{
  state: 'open' | 'close' | 'connecting' | string;
  phoneNumber?: string;
}> {
  try {
    const res = await fetch(`${BASE_URL}/instance/connectionState/${instanceName}`, {
      headers: headers(),
    });
    if (!res.ok) return { state: 'close' };
    const data = await res.json();
    return {
      state: data?.instance?.state || data?.state || 'close',
      phoneNumber: data?.instance?.profileName || data?.phoneNumber || undefined,
    };
  } catch {
    return { state: 'close' };
  }
}

/** Delete / logout an instance */
export async function deleteInstance(instanceName: string) {
  try {
    await fetch(`${BASE_URL}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: headers(),
    });
  } catch {}
}

// ─────────────────────────────────────────────
// MESSAGING
// ─────────────────────────────────────────────

/** Send a plain text message (handles @lid, @s.whatsapp.net and raw numbers) */
export async function sendText(instanceName: string, to: string, text: string) {
  const number = to.includes('@') ? to : to.replace(/\D/g, '');
  try {
    const res = await fetch(`${BASE_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ number, text, delay: 500 }),
    });
    const data = await res.json();
    console.log(`✅ [Evolution] Text sent to ${number} via ${instanceName}:`, data?.key?.id || data?.status || 'OK');
    return data?.key?.id as string | undefined;
  } catch (e: any) {
    console.error(`❌ [Evolution] sendText error:`, e?.message);
    return undefined;
  }
}

/** Send interactive quick reply buttons */
export async function sendButtons(
  instanceName: string,
  to: string,
  options: {
    title?: string;
    description: string;
    footer?: string;
    buttons: Array<{ id: string; text: string }>;
  }
) {
  const number = to.includes('@') ? to : to.replace(/\D/g, '');
  try {
    const res = await fetch(`${BASE_URL}/message/sendButtons/${instanceName}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        number,
        title: options.title || 'Outcrop Silver CRM',
        description: options.description,
        footer: options.footer || 'Asistente Ejecutivo',
        buttons: options.buttons.map((b) => ({
          type: 'reply',
          displayText: b.text,
          id: b.id,
        })),
      }),
    });
    const data = await res.json();
    return data?.key?.id as string | undefined;
  } catch (e: any) {
    console.error(`❌ [Evolution] sendButtons error:`, e?.message);
    return await sendText(instanceName, to, options.description);
  }
}

/** Send a native vCard contact (handles @lid and raw numbers) */
export async function sendVCard(
  instanceName: string,
  to: string,
  contact: {
    name: string;
    phone?: string | null;
    company?: string | null;
    email?: string | null;
  }
) {
  const number = to.includes('@') ? to : to.replace(/\D/g, '');
  const contactPhone = (contact.phone || number).replace(/\D/g, '');
  try {
    const res = await fetch(`${BASE_URL}/message/sendContact/${instanceName}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        number,
        contact: [
          {
            fullName: contact.name,
            wuid: contactPhone,
            phoneNumber: `+${contactPhone}`,
            organization: contact.company || 'Outcrop Silver',
            email: contact.email || '',
          },
        ],
      }),
    });
    const data = await res.json();
    console.log(`✅ [Evolution] vCard sent to ${number} via ${instanceName}`);
    return data;
  } catch (e: any) {
    console.error(`❌ [Evolution] sendVCard error:`, e?.message);
  }
}

/** Download media from Evolution API (returns Buffer or null) */
export async function downloadMedia(instanceName: string, messageKey: any): Promise<Buffer | null> {
  try {
    const res = await fetch(`${BASE_URL}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ message: { key: messageKey }, convertToMp4: false }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.base64) return Buffer.from(data.base64, 'base64');
    return null;
  } catch {
    return null;
  }
}

/** Download media base64 string from Evolution API */
export async function downloadMediaBase64(instanceName: string, messageKeyOrObject: any): Promise<string | null> {
  if (!messageKeyOrObject) return null;
  try {
    const key = messageKeyOrObject?.key || messageKeyOrObject;

    // Attempt 1: Standard Evolution API v2 message key payload (20s timeout)
    const ctrl1 = new AbortController();
    const t1 = setTimeout(() => ctrl1.abort(), 20000);
    let res = await fetch(`${BASE_URL}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ message: { key: key }, convertToMp4: false }),
      signal: ctrl1.signal,
    }).finally(() => clearTimeout(t1));

    if (res.ok) {
      const data = await res.json();
      if (data?.base64) return data.base64;
    }

    // Attempt 2: Direct message object payload (20s timeout)
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 20000);
    res = await fetch(`${BASE_URL}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ message: messageKeyOrObject, convertToMp4: false }),
      signal: ctrl2.signal,
    }).finally(() => clearTimeout(t2));

    if (res.ok) {
      const data = await res.json();
      if (data?.base64) return data.base64;
    }
  } catch (e: any) {
    console.error('Error in downloadMediaBase64:', e?.message);
  }
  return null;
}

export function isConfigured(): boolean {
  return !!BASE_URL && BASE_URL !== '';
}
