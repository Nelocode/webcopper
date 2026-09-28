import { Router } from 'express';
import {
  getInteractions,
  getAllInteractions,
  createInteraction,
  updateInteraction,
  deleteInteraction,
  getPendingFollowUps
} from '../controllers/interaction.controller';

const router = Router();

// Global interactions list
router.get('/', getAllInteractions);

// Global: all pending follow-ups
router.get('/follow-ups', getPendingFollowUps);

// Per-contact interactions
router.get('/contact/:contactId', getInteractions);
router.post('/contact/:contactId', createInteraction);
router.put('/:id', updateInteraction);
router.delete('/:id', deleteInteraction);

export default router;
