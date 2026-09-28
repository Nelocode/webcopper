import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { frontImageUrl, backImageUrl, contactId } = body;

    if (!frontImageUrl) {
      return NextResponse.json({ success: false, error: 'Front card image is required' }, { status: 400 });
    }

    // Standard pattern extractors for card text
    // In browser client or server, OCR text is processed; here we provide standard extraction parsing & storage
    const extractedFrontText = body.extractedFrontText || 'Business Card Front Text';
    const extractedBackText = body.extractedBackText || 'Business Card Back Text';

    // Heuristic entity extraction regex
    const emailMatch = (extractedFrontText + ' ' + extractedBackText).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = (extractedFrontText + ' ' + extractedBackText).match(/(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    
    let parsedData: any = {
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0] : null,
      rawFront: extractedFrontText,
      rawBack: extractedBackText,
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: 'You are an OCR text parser. Extract contact details from business card text into JSON format: { "name": "", "title": "", "company": "", "email": "", "phone": "", "location": "", "website": "" }.' },
              { role: 'user', content: `Front: ${extractedFrontText}\nBack: ${extractedBackText}` }
            ],
            response_format: { type: 'json_object' }
          })
        });
        if (res.ok) {
          const data = await res.json();
          const gptParsed = JSON.parse(data.choices[0]?.message?.content || '{}');
          parsedData = { ...parsedData, ...gptParsed };
        }
      } catch (e) {
        // Fallback to regex parsedData if GPT fails
      }
    }

    const card = await prisma.businessCard.create({
      data: {
        contactId: contactId || null,
        frontImageUrl,
        backImageUrl: backImageUrl || null,
        extractedTextFront: extractedFrontText,
        extractedTextBack: extractedBackText,
        parsedDataJson: JSON.stringify(parsedData),
      },
    });

    if (contactId) {
      await prisma.timelineActivity.create({
        data: {
          contactId,
          type: 'CARD_SCAN',
          title: 'Tarjeta de Presentación Escaneada (2 Caras)',
          description: `Datos escaneados: ${parsedData.email || 'Email detectado'}, ${parsedData.phone || 'Teléfono'}.`,
        },
      });
    }

    return NextResponse.json({ success: true, card, parsedData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
