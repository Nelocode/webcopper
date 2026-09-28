import { Router } from 'express';
import {
  getTags,
  createTag,
  deleteTag,
  assignTag,
  removeTag
} from '../controllers/tag.controller';

const router = Router();

router.get('/', getTags);
router.post('/', createTag);
router.delete('/:id', deleteTag);
router.post('/:tagId/contacts/:contactId', assignTag);
router.delete('/:tagId/contacts/:contactId', removeTag);

export default router;
