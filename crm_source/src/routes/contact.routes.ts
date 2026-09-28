import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  getContactChangeLog
} from '../controllers/contact.controller';
import { batchCreateContacts } from '../controllers/batch.controller';

const router = Router();

const batchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Demasiados imports por minuto. Esperá 60s.' }
});

router.get('/', getContacts);
router.get('/:id', getContactById);
router.post('/batch', batchLimiter, batchCreateContacts);
router.post('/', createContact);
router.put('/:id', updateContact);
router.get('/:id/changelog', getContactChangeLog);
router.delete('/:id', deleteContact);

export default router;

