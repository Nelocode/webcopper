import { Request, Response } from 'express';
import { prisma } from '../index';
import OpenAI, { toFile } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const processMeetingAudio = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    console.log(`[Meeting AI] Transcribing audio for contact: ${contact.name}...`);
    const file = await toFile(req.file.buffer, req.file.originalname, { type: req.file.mimetype });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      prompt: 'Transcripción de reunión o llamada de negocios con un contacto. El usuario habla de acuerdos, compromisos, fechas y notas estratégicas en inglés y español.',
    });

    let text = transcription.text.trim();

    // Prevent Whisper hallucinations on silence
    if (/[\u3131-\uD79D]/.test(text) || text.toLowerCase().includes('amara.org') || text.toLowerCase() === 'gracias.' || text.toLowerCase() === 'thank you.') {
      text = '';
    }

    if (!text) {
      return res.status(400).json({ error: 'Audio silencioso o no se pudo extraer texto. Inténtalo de nuevo hablando claro.' });
    }

    console.log(`[Meeting AI] Transcript: "${text.substring(0, 100)}..."`);
    console.log('[Meeting AI] Running strategic extraction...');

    const systemPrompt = `You are an elite Chief of Staff AI assistant.
Analyze this voice recording transcript from a business meeting or phone call.
Extract strategic details and format them exactly in a JSON object.
Today is ${new Date().toISOString().split('T')[0]}.

JSON structure:
{
  "summary": "A concise executive summary of what was discussed (string in Spanish)",
  "sentiment": "positive" or "neutral" or "negative",
  "duration": estimated duration in minutes based on transcript details, default to 15 (integer),
  "actionItems": "Bullet points detailing all agreed commitments and next steps (string in Spanish)",
  "followUpDue": "Suggested ISO date for the next follow-up call/meeting (YYYY-MM-DD) or null",
  "scoreChange": integer between -10 and 15 representing relationship score change (positive if productive/friendly, negative if conflict/stalled, neutral 0)
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transcript:\n"${text}"` }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'Failed to generate meeting analysis' });
    }

    const analysis = JSON.parse(content);
    console.log('[Meeting AI] Extracted Analysis:', analysis);

    // Calculate new relationship score (bounded 0-100)
    const currentScore = contact.relationshipScore;
    const scoreChange = analysis.scoreChange ?? 0;
    const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));

    // Determine followUpDue Date if present
    let followUpDate: Date | null = null;
    if (analysis.followUpDue) {
      try {
        followUpDate = new Date(analysis.followUpDue);
      } catch (e) {
        console.warn('[Meeting AI] Failed to parse followUpDue date:', analysis.followUpDue);
      }
    }

    // Create the interaction
    const summaryCombined = analysis.summary + 
      (analysis.actionItems ? `\n\nCompromisos acordados:\n${analysis.actionItems}` : '');

    const newInteraction = await prisma.interaction.create({
      data: {
        contactId,
        type: 'meeting',
        date: new Date(),
        summary: summaryCombined,
        sentiment: analysis.sentiment || 'neutral',
        duration: analysis.duration || 15,
        location: 'Grabación de Voz IA',
        isRemote: true,
        followUpDue: followUpDate,
        followUpDone: false,
        outcome: analysis.actionItems || null
      }
    });

    // Update the contact's relationshipScore
    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: { relationshipScore: newScore },
      include: {
        organization: true,
        tags: { include: { tag: true } },
        notes: { orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] },
        interactions: { orderBy: { date: 'desc' } }
      }
    });

    // Format updated contact for client compatibility
    const formattedContact = {
      ...updatedContact,
      hobbies: updatedContact.hobbies ? updatedContact.hobbies.split(',').map((h: string) => h.trim()).filter(Boolean) : [],
      aiKeyInterests: updatedContact.aiKeyInterests ? updatedContact.aiKeyInterests.split(',').map((i: string) => i.trim()).filter(Boolean) : [],
      tags: updatedContact.tags?.map((ct: any) => ct.tag) ?? [],
      company: updatedContact.organization?.name ?? null,
      website: updatedContact.organization?.website ?? null,
      interactions: updatedContact.interactions ?? [],
      family: updatedContact.spouseName || updatedContact.childrenCount
        ? { spouse: updatedContact.spouseName, children: updatedContact.childrenCount }
        : null
    };

    res.status(201).json({
      success: true,
      interaction: newInteraction,
      contact: formattedContact,
      transcript: text,
      analysis
    });

  } catch (error: any) {
    console.error('[Meeting AI] Error processing meeting audio:', error);
    res.status(500).json({ error: 'Failed to process meeting audio', details: error.message });
  }
};
