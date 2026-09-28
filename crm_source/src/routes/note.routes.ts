import { Router } from 'express';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote
} from '../controllers/note.controller';

const router = Router();

router.get('/contact/:contactId', getNotes);
router.post('/contact/:contactId', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
