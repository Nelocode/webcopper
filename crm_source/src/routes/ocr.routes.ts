import { Router } from 'express';
import multer from 'multer';
import { scanCard, previewCard } from '../controllers/ocr.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Accept up to 2 images (front + back of card)
router.post('/scan', upload.array('images', 2), scanCard);
router.post('/preview', upload.array('images', 2), previewCard);

export default router;
