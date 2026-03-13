import { Router } from 'express';
import { getRanking } from '../controllers/rankingController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, getRanking);

export default router;