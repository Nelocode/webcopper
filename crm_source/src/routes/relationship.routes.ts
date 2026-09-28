import { Router } from 'express';
import {
  getRelationships,
  getAllRelationships,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  autoDetectRelationships
} from '../controllers/relationship.controller';

const router = Router();

router.get('/all', getAllRelationships);
router.get('/', getRelationships);
router.post('/', createRelationship);
router.put('/:id', updateRelationship);
router.delete('/:id', deleteRelationship);
router.post('/auto-detect', autoDetectRelationships);

export default router;
