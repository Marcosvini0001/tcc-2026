import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import sequelize from './config/database';
import userRoutes from './routes/userRoutes';
import admRoutes from './routes/admRoutes';
import './models/userModels';
import './models/admModels';
import './models/userFriendModels';

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/users', userRoutes);
app.use('/adms', admRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

void startServer();
