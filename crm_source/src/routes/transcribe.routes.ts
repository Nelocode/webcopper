import { Router } from 'express';
import multer from 'multer';
import { transcribeAudio } from '../controllers/transcribe.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/transcribe
router.post('/', upload.single('audio'), transcribeAudio);

export default router;
