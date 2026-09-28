/**
 * Telegram Gateway Library for Hermes Agent Integration
 * Bridges CRM Web Studio with Hermes Agent on Mac Mini via Telegram API
 */

export interface TelegramPayload {
  sessionId: string;
  crmUserId?: string;
  user?: string;
  message: string;
  audioUrl?: string | null;
  audioTranscript?: string | null;
  files?: Array<{ name: string; url: string; mimeType: string }>;
  worker?: string;
  callbackUrl?: string;
}

/** Check if Telegram Bot Token is valid */
export async function testTelegramBot(token: string) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await res.json();
    return {
      ok: data.ok,
      bot: data.result,
    };
  } catch (e: any) {
    return {
      ok: false,
      error: e.message,
    };
  }
}

/** Send structured JSON payload to Hermes in Telegram */
export async function sendPayloadToHermes(
  token: string,
  chatId: string,
  payload: TelegramPayload
) {
  try {
    const jsonString = JSON.stringify(payload, null, 2);

    // Send formatted JSON message that CopperMind can parse
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `@alchemistCU_bot 🤖 CopperMind Task Request:\n${jsonString}`,
      }),
    });

    const data = await res.json();
    return data;
  } catch (e: any) {
    console.error('Error sending payload to Hermes Telegram:', e?.message);
    return { ok: false, error: e?.message };
  }
}

/** Send plain text message */
export async function sendTelegramText(token: string, chatId: string, text: string) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
    return await res.json();
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}

/** Register CRM webhook in Telegram so incoming Hermes responses hit the CRM */
export async function setTelegramWebhook(token: string, webhookUrl: string) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'channel_post'],
      }),
    });
    return await res.json();
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}
