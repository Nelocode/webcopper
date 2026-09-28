/**
 * Intelligent Business Card OCR & Audio Transcription Module
 * Powered by Google Gemini 2.5 Flash Vision & Multimodal Audio
 * STRICT INTEGRITY: NO INVENTED DATA. Missing fields remain null.
 */

export interface ExtractedCardInfo {
  name: string;
  company: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  rawText: string;
}

export async function parseCardImage(imageBuffer: Buffer, pushName = ''): Promise<ExtractedCardInfo> {
  const cleanBase64 = imageBuffer.toString('base64');
  const apiKey =
    process.env.GEMINI_DRIVE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    'REDACTED_GCP_KEY';

  const EMPTY: ExtractedCardInfo = {
    name: pushName || 'Contacto Tarjeta',
    company: null,
    title: null,
    email: null,
    phone: null,
    location: null,
    website: null,
    rawText: '',
  };

  if (!apiKey) return EMPTY;

  // ── STEP 1: Literal transcription — Gemini reads the card like a scanner ──
  // No interpretation, no filling in gaps — just copy what is physically printed.
  let literalText = '';
  try {
    const ctrl1 = new AbortController();
    const t1 = setTimeout(() => ctrl1.abort(), 25000);
    const resp1 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl1.signal,
        body: JSON.stringify({
          generationConfig: { temperature: 0 },
          contents: [{
            parts: [
              {
                text: 'You are a high-precision optical character recognition (OCR) engine. Your ONLY job is to read and copy EXACTLY the text that is physically printed or written on this business card image — every word, number, email address, phone number, website URL, and symbol you can see. Do NOT interpret, infer, translate, restructure, or add any information that is not physically visible. Do NOT fill in missing fields. Do NOT guess. Do NOT use any knowledge about the person or company. Just output a plain text verbatim copy of everything visible on the card, preserving line breaks.',
              },
              { inline_data: { mime_type: 'image/jpeg', data: cleanBase64 } },
            ],
          }],
        }),
      }
    ).finally(() => clearTimeout(t1));

    if (resp1.ok) {
      const d1 = await resp1.json();
      literalText = (d1?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    }
  } catch (e: any) {
    console.warn('Gemini OCR step 1 error:', e?.message);
    return EMPTY;
  }

  if (!literalText) return EMPTY;

  // ── STEP 2: Structure the literal text into JSON fields ──
  // Works ONLY from the verbatim transcript — cannot invent new data.
  let parsed: Record<string, string | null> = {};
  try {
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 25000);
    const resp2 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl2.signal,
        body: JSON.stringify({
          generationConfig: { temperature: 0 },
          contents: [{
            parts: [{
              text:
                `You are a data parser. Below is the EXACT verbatim text transcribed from a business card. ` +
                `Parse it into a JSON object with these keys: "name", "company", "title", "email", "phone", "location", "website". ` +
                `CRITICAL RULES:\n` +
                `- Use ONLY text that appears in the transcription below. DO NOT use any outside knowledge.\n` +
                `- If a field is not present in the transcription, set it to null.\n` +
                `- Do NOT infer, guess, or complete partial information.\n` +
                `- Return ONLY the JSON object, no explanation.\n\n` +
                `TRANSCRIPTION:\n"""\n${literalText}\n"""`,
            }],
          }],
        }),
      }
    ).finally(() => clearTimeout(t2));

    if (resp2.ok) {
      const d2 = await resp2.json();
      const raw2 = d2?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = raw2.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }
  } catch (e: any) {
    console.warn('Gemini OCR step 2 error:', e?.message);
    // Still return what we have from the literal transcription at minimum
    return { ...EMPTY, rawText: literalText };
  }

  // ── STEP 3: Validate extracted fields against the literal transcription ──
  // If a value doesn't appear in the raw transcript in some form, discard it.
  const textLower = literalText.toLowerCase();

  function isInTranscript(value: string | null | undefined): boolean {
    if (!value) return false;
    // Check at least the first meaningful token appears verbatim
    const tokens = value.toLowerCase().replace(/[^a-z0-9@.+]/g, ' ').trim().split(/\s+/).filter(t => t.length > 2);
    return tokens.length > 0 && tokens.some(token => textLower.includes(token));
  }

  const safeEmail = isInTranscript(parsed.email) ? (parsed.email || null) : null;
  const safePhone = isInTranscript(parsed.phone) ? (parsed.phone || null) : null;
  const safeWebsite = isInTranscript(parsed.website) ? (parsed.website || null) : null;
  const safeLocation = isInTranscript(parsed.location) ? (parsed.location || null) : null;
  const safeCompany = isInTranscript(parsed.company) ? (parsed.company || null) : null;
  const safeTitle = isInTranscript(parsed.title) ? (parsed.title || null) : null;
  const safeName = isInTranscript(parsed.name) ? (parsed.name || null) : null;

  return {
    name: safeName || pushName || 'Contacto Tarjeta',
    company: safeCompany,
    title: safeTitle,
    email: safeEmail,
    phone: safePhone,
    location: safeLocation,
    website: safeWebsite,
    rawText: literalText,
  };
}


/**
 * Transcribes WhatsApp voice notes (Opus / Ogg / MP4) via Gemini 2.5 Flash
 */
export async function transcribeAudio(audioBase64: string): Promise<string> {
  const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
  const apiKey =
    process.env.GEMINI_DRIVE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    'REDACTED_GCP_KEY';

  if (!apiKey) return '';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Please accurately transcribe this WhatsApp voice note in Spanish. Return ONLY the plain transcribed text, without commentary.',
                },
                {
                  inline_data: {
                    mime_type: 'audio/ogg',
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return text.trim();
    }
  } catch (e: any) {
    console.warn('Gemini Audio transcription error:', e?.message);
  }

  return '';
}
