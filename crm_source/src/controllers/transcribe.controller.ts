import { Request, Response } from 'express';
import OpenAI, { toFile } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const transcribeAudio = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const file = await toFile(req.file.buffer, req.file.originalname, { type: req.file.mimetype });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      prompt: 'Transcription of voice notes. Transcripción de notas de voz. El usuario está dictando información de un contacto en inglés y español. The user is dictating contact info.',
    });

    let text = transcription.text.trim();

    // Prevent Whisper hallucinations on silence (Korean characters or common English subtitle hallucinations)
    if (/[\u3131-\uD79D]/.test(text) || text.toLowerCase().includes('amara.org') || text.toLowerCase() === 'gracias.' || text.toLowerCase() === 'thank you.') {
      text = '';
    }

    res.json({ text });
  } catch (error: any) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio', details: error.message });
  }
};
