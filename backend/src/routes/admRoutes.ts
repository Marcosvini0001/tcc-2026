import { Router } from 'express';
import {
  createAdm,
  getAllAdms,
  getAdmById,
  updateAdm,
  deleteAdm,
} from '../controllers/admController';

const router = Router();

router.post('/', createAdm);
router.get('/', getAllAdms);
router.get('/:id', getAdmById);
router.put('/:id', updateAdm);
router.delete('/:id', deleteAdm);

export default router;
