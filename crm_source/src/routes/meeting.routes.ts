import { Router } from 'express';
import multer from 'multer';
import { processMeetingAudio } from '../controllers/meeting.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/meetings/contact/:contactId/process-audio
router.post('/contact/:contactId/process-audio', upload.single('audio'), processMeetingAudio);

export default router;
