import { Router } from 'express';
import { getIntegrations, saveIntegration } from '../controllers/integration.controller';

const router = Router();

router.get('/', getIntegrations);
router.post('/', saveIntegration);

export default router;
