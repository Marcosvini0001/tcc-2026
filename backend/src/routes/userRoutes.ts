import { Router } from 'express';
import {
  createUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getRanking,
  getUserById,
  updateUser,
  deleteUser,
  addFriendByCode,
  getUserFriends,
  removeFriend,
  createTask,
  getUserTasks,
  completeTask,
} from '../controllers/userController';
import { requireAdmin, requireAuth, requireUserAccess } from '../middleware/authMiddleware';

const router = Router();

/**
 * Rotas do recurso de usuário.
 * Inclui autenticação, gerenciamento de amigos, tarefas e ranking.
 */
router.post('/', createUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/ranking', requireAuth(['user']), getRanking);

router.use(requireAuth());

router.get('/', requireAdmin, getAllUsers);
router.get('/:id', requireUserAccess, getUserById);
router.put('/:id', requireUserAccess, updateUser);
router.delete('/:id', requireUserAccess, deleteUser);
router.post('/:id/friends', requireUserAccess, addFriendByCode);
router.get('/:id/friends', requireUserAccess, getUserFriends);
router.delete('/:id/friends/:friendId', requireUserAccess, removeFriend);
router.post('/:id/tasks', requireUserAccess, createTask);
router.get('/:id/tasks', requireUserAccess, getUserTasks);
router.patch('/:id/tasks/:taskId/complete', requireUserAccess, completeTask);

export default router;
