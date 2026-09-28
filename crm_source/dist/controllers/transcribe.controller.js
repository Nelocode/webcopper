"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeAudio = void 0;
const openai_1 = __importStar(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const transcribeAudio = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }
        const file = await (0, openai_1.toFile)(req.file.buffer, req.file.originalname, { type: req.file.mimetype });
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
    }
    catch (error) {
        console.error('Transcription error:', error);
        res.status(500).json({ error: 'Failed to transcribe audio', details: error.message });
    }
};
exports.transcribeAudio = transcribeAudio;
