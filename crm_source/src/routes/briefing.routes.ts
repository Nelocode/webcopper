import { Router } from 'express';
import { sendTestBriefing } from '../controllers/briefing.controller';

const router = Router();

router.post('/test', sendTestBriefing);

export default router;
