import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';

import sequelize from './config/database';
import userRoutes from './routes/userRoutes';
import admRoutes from './routes/admRoutes';
import './models/userModels';
import './models/admModels';
import './models/userFriendModels';
import './models/taskModels';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const uploadsDir = path.resolve(process.cwd(), 'uploads');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/users', userRoutes);
app.use('/adms', admRoutes);

const ensureDatabaseExists = async () => {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = Number(process.env.DB_PORT || 3306);
  const dbUser = process.env.DB_USER || 'root';
  const dbPass = process.env.DB_PASS || '';
  const dbName = process.env.DB_NAME || 'tcc_db';

  const connection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPass,
  });

  try {
    const escapedDbName = dbName.replace(/`/g, '``');
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${escapedDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
  } finally {
    await connection.end();
  }
};

const startServer = async () => {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    await ensureDatabaseExists();
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
