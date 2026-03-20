import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
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
  createTask,
  createTaskByUpload,
  getUserTasks,
  completeTask,
  analyzeTaskPhoto,
} from '../controllers/userController';

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
router.get('/', getAllUsers);
router.get('/ranking', getRanking);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/friends', addFriendByCode);
router.get('/:id/friends', getUserFriends);
router.post('/:id/tasks', createTask);
router.post('/:id/tasks/upload', upload.single('photo'), createTaskByUpload);
router.get('/:id/tasks', getUserTasks);
router.patch('/:id/tasks/:taskId/complete', completeTask);
router.post('/:id/tasks/:taskId/analyze', analyzeTaskPhoto);

export default router;
