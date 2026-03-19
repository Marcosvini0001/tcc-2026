import { Router } from 'express';
import {
  createUser,
  loginUser,
  getAllUsers,
  getRanking,
  getUserById,
  updateUser,
  deleteUser,
  addFriendByCode,
  getUserFriends,
} from '../controllers/userController';

const router = Router();

router.post('/', createUser);
router.post('/login', loginUser);
router.get('/', getAllUsers);
router.get('/ranking', getRanking);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/friends', addFriendByCode);
router.get('/:id/friends', getUserFriends);

export default router;
