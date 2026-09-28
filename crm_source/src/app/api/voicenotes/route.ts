import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contactId, audioDataUrl, durationSeconds, transcript } = body;

    if (!contactId || !audioDataUrl) {
      return NextResponse.json({ success: false, error: 'Contact ID and audio data are required' }, { status: 400 });
    }

    let finalTranscript = transcript || 'Audio grabado en el CRM.';
    let summary = '';
    let sentiment = 'neutral';
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey && audioDataUrl && audioDataUrl.startsWith('data:audio')) {
      try {
        const base64Data = audioDataUrl.split(',')[1];
        if (base64Data) {
          const audioBuffer = Buffer.from(base64Data, 'base64');
          const blob = new Blob([audioBuffer], { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('file', blob, 'audio.webm');
          formData.append('model', 'whisper-1');

          const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}` },
            body: formData,
          });
          if (whisperRes.ok) {
            const whisperData = await whisperRes.json();
            finalTranscript = whisperData.text || finalTranscript;

            const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                  { role: 'system', content: 'You summarize transcripts and extract sentiment (positive, neutral, negative). Respond with JSON: { "summary": "", "sentiment": "" }' },
                  { role: 'user', content: finalTranscript }
                ],
                response_format: { type: 'json_object' }
              })
            });
            if (gptRes.ok) {
              const gptData = await gptRes.json();
              const gptParsed = JSON.parse(gptData.choices[0]?.message?.content || '{}');
              summary = gptParsed.summary || '';
              sentiment = gptParsed.sentiment || sentiment;
            }
          }
        }
      } catch (e) {
        console.error('Whisper/GPT Error:', e);
      }
    }

    const voiceNote = await prisma.voiceNote.create({
      data: {
        contactId,
        audioDataUrl,
        durationSeconds: durationSeconds || 0,
        transcript: finalTranscript,
      },
    });

    // Synthesize updated AI Executive Briefing fields
    const transcriptExcerpt = finalTranscript ? finalTranscript.slice(0, 120) : 'Actualización de voz registrada.';
    const newIcebreaker = `En nota de voz reciente: "${transcriptExcerpt}..."`;
    const newStrategicContext = `Inteligencia de voz procesada: ${summary || finalTranscript || 'Audio grabado'}. Sentimiento: ${sentiment}.`;

    await prisma.contact.update({
      where: { id: contactId },
      data: {
        dynamicIcebreaker: newIcebreaker,
        strategicContext: newStrategicContext,
        leadScore: { increment: sentiment === 'positive' ? 10 : 5 },
      },
    });

    // Add activity to timeline
    await prisma.timelineActivity.create({
      data: {
        contactId,
        type: 'VOICE_NOTE',
        title: 'Nota de Voz Agregada',
        description: transcript || `Duración: ${durationSeconds || 0} segundos`,
      },
    });

    return NextResponse.json({ success: true, voiceNote });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
