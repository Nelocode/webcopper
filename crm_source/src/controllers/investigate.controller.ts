import { Request, Response } from 'express';
import OpenAI from 'openai';
import { prisma } from '../index';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const investigateContact = async (req: Request, res: Response) => {
  try {
    const { name, company, role, location, website, contactId } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required for investigation' });
    }

    const tavilyKey = process.env.TAVILY_API_KEY;
    let searchResults = '';

    // 1. Perform Web Search with Tavily if available
    if (tavilyKey) {
      try {
        const roleStr = role ? `"${role}"` : '';
        const companyStr = company ? `"${company}"` : '';
        const locationStr = location ? `"${location}"` : '';
        const websiteStr = website ? `site:${website} OR "${website}"` : '';
        // Create a highly precise query string avoiding empty quotes
        const queryParts = [`"${name}"`, roleStr, companyStr, locationStr, websiteStr, 'professional profile bio linkedin'];
        const query = queryParts.filter(Boolean).join(' ');

        const tavilyResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: tavilyKey,
            query,
            search_depth: 'basic',
            include_answer: true,
            max_results: 3
          }),
        });

        if (tavilyResponse.ok) {
          const searchData = await tavilyResponse.json();
          searchResults = `Answer: ${searchData.answer}\nResults: ${searchData.results.map((r: any) => r.content).join('\n')}`;
        }
      } catch (searchError) {
        console.error('Tavily search failed:', searchError);
      }
    }

    // 2. Synthesize using OpenAI
    const systemPrompt = `You are a high-level executive assistant AI. 
Analyze the provided web search context about the person "${name}" 
${company ? `from the company "${company}"` : ''} 
${role ? `with the role of "${role}"` : ''} 
${location ? `based in "${location}"` : ''}
${website ? `associated with website "${website}"` : ''}.
Extract or infer the following details to build a highly precise CRM profile.
You must return ONLY a valid JSON object matching this exact structure:
{
  "avatar": "url to a profile picture if found, otherwise null",
  "location": "Physical location or city/country (string or null)",
  "hobbies": ["array of strings representing hobbies, passions or interests. Infer if not explicitly stated (e.g. Golf, Tech)"],
  "notes": "A brief summary of their current professional focus, recent news, or an interesting fact",
  "role": "Their exact current job title if found, otherwise null",
  "icebreaker": "A specific sentence or topic to break the ice based on their hobbies or notes. E.g. 'I saw you are into Golf, did you catch the Masters?'",
  "strategicContext": "A concise paragraph about their company's current strategic position, market trends affecting them, or recent corporate developments relevant to a business relationship",
  "sentiment": "positive if the overall tone about them/their company is favorable, neutral if mixed, negative if concerning. Use null if unknown"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: searchResults ? `Search context:\n${searchResults}` : `No internet connection. Use your pre-trained knowledge to infer a likely executive profile for ${name} at ${company || 'Unknown'}.` }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty content');
    }

    const parsedData = JSON.parse(content);

    // Auto-persist intelligence to contact if contactId is provided
    if (contactId) {
      try {
        await prisma.contact.update({
          where: { id: contactId },
          data: {
            aiIcebreaker: parsedData.icebreaker ?? null,
            aiStrategicContext: parsedData.strategicContext ?? null,
            aiSentiment: parsedData.sentiment ?? null,
            aiKeyInterests: Array.isArray(parsedData.hobbies)
              ? parsedData.hobbies.join(', ')
              : null,
            location: parsedData.location ?? undefined,
            role: parsedData.role ?? undefined,
            avatar: parsedData.avatar ?? undefined,
            hobbies: Array.isArray(parsedData.hobbies)
              ? parsedData.hobbies.join(', ')
              : undefined,
            personalNotes: parsedData.notes ?? undefined
          }
        });
        console.log(`[Investigate] ✓ Intelligence persisted for contact ${contactId}`);
      } catch (persistError) {
        console.error('[Investigate] Failed to persist intelligence:', persistError);
        // Don't fail the request — return data anyway
      }
    }

    res.json(parsedData);

  } catch (error: any) {
    console.error('Investigate Controller Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// ─── Batch Enrichment ──────────────────────────────────────────────────────────
// POST /api/investigate/batch
// Body: { contactIds?: string[] } — if omitted, processes ALL contacts with empty intelligence
// Procesa secuencialmente (1 por segundo) y persiste cada resultado
export const batchInvestigate = async (req: Request, res: Response) => {
  try {
    const { contactIds } = req.body;

    // Find contacts to process
    const where = contactIds?.length
      ? { id: { in: contactIds } }
      : {
          OR: [
            { aiIcebreaker: null },
            { aiStrategicContext: null },
            { aiSentiment: null },
            { aiKeyInterests: null },
          ],
        };

    const contacts = await prisma.contact.findMany({ where, take: 50 }); // max 50 per batch

    if (contacts.length === 0) {
      return res.json({ processed: 0, total: 0, message: 'No contacts need enrichment' });
    }

    const results: { contactId: string; name: string; status: string; error?: string }[] = [];
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const tavilyKey = process.env.TAVILY_API_KEY;

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      try {
        const name = contact.name || contact.email || 'Unknown';

        // Resolve company name via Organization or fallback fields
        let companyForSearch = '';
        if (contact.organizationId) {
          try {
            const org = await prisma.organization.findUnique({ where: { id: contact.organizationId } });
            if (org) companyForSearch = org.name;
          } catch {}
        }

        let searchResults = '';
        if (tavilyKey) {
          const query = `"${name}"${companyForSearch ? ` "${companyForSearch}"` : ''} professional profile bio`;
          const resp = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: tavilyKey, query, search_depth: 'basic', include_answer: true, max_results: 3 }),
          });
          if (resp.ok) {
            const data: any = await resp.json();
            searchResults = `Answer: ${data.answer}\nResults: ${data.results.map((r: any) => r.content).join('\n')}`;
          }
        }

        // OpenAI synthesis
        const systemPrompt = `Analyze the web context about "${name}"${companyForSearch ? ` from "${companyForSearch}"` : ''}. Return ONLY valid JSON:
{
  "icebreaker": "conversation starter sentence",
  "strategicContext": "1-2 paragraph market/company context",
  "sentiment": "positive|neutral|negative|null",
  "keyInterests": ["interest1", "interest2"],
  "hobbies": ["hobby1", "hobby2"],
  "notes": "short professional summary"
}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: searchResults || `Pre-trained knowledge about ${name}${companyForSearch ? ` at ${companyForSearch}` : ''}` }
          ],
          response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('Empty response from OpenAI');

        const data = JSON.parse(content);

        // Persist
        await prisma.contact.update({
          where: { id: contact.id },
          data: {
            aiIcebreaker: data.icebreaker ?? null,
            aiStrategicContext: data.strategicContext ?? null,
            aiSentiment: data.sentiment ?? null,
            aiKeyInterests: Array.isArray(data.keyInterests) ? data.keyInterests.join(', ') : (Array.isArray(data.hobbies) ? data.hobbies.join(', ') : null),
            hobbies: Array.isArray(data.hobbies) ? data.hobbies.join(', ') : undefined,
            personalNotes: data.notes ?? undefined,
          }
        });

        results.push({ contactId: contact.id, name, status: 'ok' });

        // Rate limit: 1 second between contacts
        if (i < contacts.length - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err: any) {
        results.push({ contactId: contact.id, name: contact.name || contact.email || '?', status: 'error', error: err.message });
      }
    }

    const okCount = results.filter(r => r.status === 'ok').length;
    res.json({
      processed: contacts.length,
      succeeded: okCount,
      failed: contacts.length - okCount,
      results,
      message: `Enriched ${okCount}/${contacts.length} contacts`,
    });

  } catch (error: any) {
    console.error('Batch Investigate Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
