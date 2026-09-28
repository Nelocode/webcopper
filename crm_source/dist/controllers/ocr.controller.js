"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewCard = exports.scanCard = void 0;
const sharp_1 = __importDefault(require("sharp"));
const openai_1 = __importDefault(require("openai"));
const index_1 = require("../index");
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
// POST /api/ocr/scan
// Accepts 1-2 images (front + back of a business card)
// Returns extracted data + AI categorization + optionally creates contact
const scanCard = async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No images provided' });
    }
    const imageUrls = [];
    try {
        for (const file of files) {
            if (!file.buffer) {
                throw new Error('File buffer missing. Ensure multer is using memoryStorage.');
            }
            const imageBuffer = await (0, sharp_1.default)(file.buffer)
                .resize(1200)
                .jpeg({ quality: 85 })
                .toBuffer();
            const base64Image = imageBuffer.toString('base64');
            imageUrls.push({
                type: 'image_url',
                image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: 'high',
                },
            });
        }
        const hasBack = imageUrls.length > 1;
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not configured on server');
        }
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert business card OCR and categorizer. You receive 1 or 2 images (front + optional back).

Extract ALL visible information from the card images. If the back image has handwritten notes, extract those as "backNotes".

Then categorize the person and company based on the data found.

Return ONLY a valid JSON object matching this exact structure, with no markdown formatting or extra text:

{
  "name": "Full Name or null",
  "role": "Job Title or null",
  "company": "Company Name or null",
  "email": "Email or null",
  "phone": "Phone or null",
  "website": "Website URL or null",
  "linkedin": "LinkedIn URL or null",
  "location": "City, Country or null",
  "department": "Likely department (engineering, sales, marketing, finance, operations, legal, hr, other) or null",
  "seniority": "Likely seniority level: c-suite, vp, director, manager, individual or null",
  "industry": "Industry sector (tech, finance, mining, healthcare, energy, real-estate, education, legal, consulting, manufacturing, non-profit, government, other) or null",
  "backNotes": "If a second image (back of card) is present, extract any handwritten or printed notes, doodles, reminders, or secondary contact info found there. If no second image, return null.",
  "confidence": "high|medium|low based on clarity of the card text"
}

Do NOT make up information. If a field is unclear or not visible, return null for it.`,
                },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: `Extract details from this business card. ${hasBack ? 'Image 1 = front, Image 2 = back (handwritten notes area).' : 'Single image (front of card).'}` },
                        ...imageUrls,
                    ],
                },
            ],
            max_tokens: 800,
            response_format: { type: 'json_object' },
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('OpenAI returned an empty response');
        }
        const extracted = JSON.parse(content);
        // Resolve/create organization by name
        let organizationId = null;
        if (extracted.company) {
            let org = await index_1.prisma.organization.findFirst({
                where: { name: { contains: extracted.company } },
            });
            if (!org) {
                org = await index_1.prisma.organization.create({
                    data: {
                        name: extracted.company,
                        industry: extracted.industry || null,
                    },
                });
            }
            organizationId = org.id;
        }
        // Create the contact
        const contact = await index_1.prisma.contact.create({
            data: {
                name: extracted.name || 'Unknown',
                role: extracted.role || null,
                email: extracted.email || null,
                phone: extracted.phone || null,
                linkedin: extracted.linkedin || null,
                location: extracted.location || null,
                department: extracted.department || null,
                seniority: extracted.seniority || null,
                organizationId,
                engagementLevel: 'warm',
                relationshipScore: 30,
                captureSource: 'card_scan',
                capturedAt: new Date(),
                personalNotes: extracted.backNotes || null,
            },
        });
        res.json({
            contact,
            extracted: {
                name: extracted.name,
                role: extracted.role,
                company: extracted.company,
                email: extracted.email,
                phone: extracted.phone,
                website: extracted.website,
                linkedin: extracted.linkedin,
                location: extracted.location,
                department: extracted.department,
                seniority: extracted.seniority,
                industry: extracted.industry,
                backNotes: extracted.backNotes,
                confidence: extracted.confidence,
            },
        });
    }
    catch (error) {
        console.error('OCR Controller Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.scanCard = scanCard;
// GET /api/ocr/preview
// Same as scan but does NOT persist — returns preview for user review
const previewCard = async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No images provided' });
    }
    const imageUrls = [];
    try {
        for (const file of files) {
            if (!file.buffer) {
                throw new Error('File buffer missing.');
            }
            const imageBuffer = await (0, sharp_1.default)(file.buffer)
                .resize(1200)
                .jpeg({ quality: 85 })
                .toBuffer();
            const base64Image = imageBuffer.toString('base64');
            imageUrls.push({
                type: 'image_url',
                image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: 'high',
                },
            });
        }
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert business card OCR. Extract all visible information from the card images.

Return ONLY a valid JSON object with no markdown:

{
  "name": "Full Name or null",
  "role": "Job Title or null",
  "company": "Company Name or null",
  "email": "Email or null",
  "phone": "Phone or null",
  "website": "Website URL or null",
  "linkedin": "LinkedIn URL or null",
  "location": "City, Country or null",
  "department": "Likely department or null",
  "seniority": "c-suite, vp, director, manager, individual or null",
  "industry": "Industry sector or null",
  "backNotes": "Notes from back of card or null",
  "confidence": "high|medium|low"
}`,
                },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Extract details from this business card.' },
                        ...imageUrls,
                    ],
                },
            ],
            max_tokens: 800,
            response_format: { type: 'json_object' },
        });
        const content = response.choices[0]?.message?.content;
        if (!content)
            throw new Error('Empty response');
        const extracted = JSON.parse(content);
        res.json(extracted);
    }
    catch (error) {
        console.error('OCR Preview Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.previewCard = previewCard;
