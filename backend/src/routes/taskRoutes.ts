import { Router } from 'express';
import { getTasks, completeTask } from '../controllers/taskController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, getTasks);
router.post('/concluir', authMiddleware, completeTask);

export default router;