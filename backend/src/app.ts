import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';

import userRoutes from './routes/userRoutes';
import admRoutes from './routes/admRoutes';
import './models/userModels';
import './models/admModels';
import './models/userFriendModels';
import './models/taskModels';

const app = express();
const uploadsDir = path.resolve(process.cwd(), 'uploads');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/users', userRoutes);
app.use('/adms', admRoutes);

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: error.message });
  }

  if (error instanceof Error && error.message === 'Only image files are allowed') {
    return res.status(400).json({ message: error.message });
  }

  if (error instanceof Error) {
    console.error('Unhandled application error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }

  return next();
});

export default app;