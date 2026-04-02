import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';

import app from './app';
import sequelize from './config/database';

const PORT = Number(process.env.PORT || 3000);
const uploadsDir = path.resolve(process.cwd(), 'uploads');

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

    const syncMode = process.env.DB_SYNC_MODE || (process.env.NODE_ENV === 'production' ? 'safe' : 'alter');

    if (syncMode === 'force') {
      await sequelize.sync({ force: true });
    } else if (syncMode === 'alter') {
      await sequelize.sync({ alter: true });
    } else {
      await sequelize.sync();
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

void startServer();
