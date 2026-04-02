import { Router } from 'express';
import {
  createAdm,
  loginAdm,
  getAllAdms,
  getAdmById,
  updateAdm,
  deleteAdm,
} from '../controllers/admController';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.post('/', createAdm);
router.post('/login', loginAdm);

router.use(requireAuth(['admin']));
router.use(requireAdmin);

router.get('/', getAllAdms);
router.get('/:id', getAdmById);
router.put('/:id', updateAdm);
router.delete('/:id', deleteAdm);

export default router;
