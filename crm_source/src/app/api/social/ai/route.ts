import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PROMPTS = {
  professional: `You are the Investor Relations (IR) Director at Outcrop Silver Corp. (TSX: OCG). Generate a highly professional, clear, and persuasive social media post highlighting the potential of the high-grade Santa Ana silver project in Colombia, historical silver grades (up to 4,000 g/t AgEq), photovoltaic silver demand, and value for institutional investors.`,
  casual: `You are a senior mining and clean tech analyst. Write a dynamic, engaging social media post about the global silver deficit, why EV and solar technologies require pure silver, and how Outcrop Silver stands out with exploration in Colombia.`,
  inspirational: `Write an inspirational and strategic post about the future of renewable energy, global energy transition, and the critical role of ESG-produced precious metals like silver by Outcrop Silver Corp. in Colombia.`,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, tone = 'professional', prompt: userPrompt } = body;

    let generatedCopy = '';

    if (tone === 'casual') {
      generatedCopy = `⚡ Did you know every modern solar panel and EV depends on silver's unmatched conductivity? 🚗☀️\n\n` +
        `At ${title || 'Outcrop Silver'}, we are advancing one of Latin America's highest-grade silver projects in the historic Santa Ana district, Colombia.\n\n` +
        `Industrial silver demand is breaking historic records. The future of clean energy requires high-purity metals!\n\n` +
        `💬 Share your thoughts in the comments below. #Silver #CleanEnergy #OutcropSilver #Mining`;
    } else if (tone === 'inspirational') {
      generatedCopy = `🌟 *Empowering the future of clean energy from Colombia.*\n\n` +
        `${title || 'Innovation & High-Grade Silver'}: The global energy transition demands critical metals produced with strict ESG standards.\n\n` +
        `At Outcrop Silver Corp., we combine precision exploration with an unwavering commitment to local communities at our flagship Santa Ana project.\n\n` +
        `Together we drive sustainable growth. 🌎✨ #Sustainability #ESG #OutcropSilver #HighGradeSilver`;
    } else {
      generatedCopy = `📊 *Outcrop Silver (TSX: OCG)* | ${title || 'Exploration Update & Critical Metals'}\n\n` +
        `We are pleased to share progress at our flagship high-grade primary silver project, Santa Ana, in Colombia with our investor community.\n\n` +
        `• Historical epithermal grades up to 4,000 g/t AgEq.\n` +
        `• Essential silver supply for solar photovoltaic and EV transition.\n` +
        `• Rigorous commitment to environmental stewardship and community development.\n\n` +
        `🔗 Explore the full executive presentation on our official investor portal.\n#OutcropSilver #Silver #InvestorRelations #Mining #TSX`;
    }

    await prisma.socialAuditLog.create({
      data: {
        action: 'generate_ai_copy',
        username: 'Outcrop Admin',
        entityType: 'post',
        details: `AI Copy generated with tone "${tone}" for title: "${title || 'General'}"`,
      },
    });

    return NextResponse.json({ copy: generatedCopy });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
