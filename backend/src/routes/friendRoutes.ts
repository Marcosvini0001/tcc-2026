import { Router } from 'express';
import { searchUsers, addFriend, getFriends } from '../controllers/friendController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/buscar', authMiddleware, searchUsers);
router.post('/adicionar', authMiddleware, addFriend);
router.get('/lista', authMiddleware, getFriends);

export default router;