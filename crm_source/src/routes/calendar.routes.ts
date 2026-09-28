import { Router } from 'express';
import {
  saveConfig,
  getStatus,
  syncCalendar,
  getMeetings,
  googleAuth,
  googleCallback,
  disconnectCalendar
} from '../controllers/calendar.controller';

const router = Router();

router.post('/config', saveConfig);
router.delete('/config', disconnectCalendar);
router.get('/status', getStatus);
router.post('/sync', syncCalendar);
router.get('/meetings', getMeetings);
router.get('/auth', googleAuth);
router.get('/callback', googleCallback);

export default router;
