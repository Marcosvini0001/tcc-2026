import { Router } from 'express';
import { getProfile } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/profile', authMiddleware, getProfile);

export default router;
