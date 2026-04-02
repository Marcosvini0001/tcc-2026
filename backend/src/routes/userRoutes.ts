import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
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
  createTask,
  createTaskByUpload,
  getUserTasks,
  completeTask,
  analyzeTaskPhoto,
} from '../controllers/userController';
import { requireAdmin, requireAuth, requireUserAccess } from '../middleware/authMiddleware';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: path.resolve(process.cwd(), 'uploads'),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `task-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }

    cb(null, true);
  },
});

router.post('/', createUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/ranking', getRanking);

router.use(requireAuth());

router.get('/', requireAdmin, getAllUsers);
router.get('/:id', requireUserAccess, getUserById);
router.put('/:id', requireUserAccess, updateUser);
router.delete('/:id', requireUserAccess, deleteUser);
router.post('/:id/friends', requireUserAccess, addFriendByCode);
router.get('/:id/friends', requireUserAccess, getUserFriends);
router.post('/:id/tasks', requireUserAccess, createTask);
router.post('/:id/tasks/upload', requireUserAccess, upload.single('photo'), createTaskByUpload);
router.get('/:id/tasks', requireUserAccess, getUserTasks);
router.patch('/:id/tasks/:taskId/complete', requireUserAccess, completeTask);
router.post('/:id/tasks/:taskId/analyze', requireUserAccess, analyzeTaskPhoto);

export default router;
