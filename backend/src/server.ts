import 'dotenv/config';
import mysql from 'mysql2/promise';
import { DataTypes } from 'sequelize';

import app from './app';
import sequelize from './config/database';
import logger from './utils/logger';
import Adm from './models/admModels';
import { hashPassword } from './services/authService';
import { FRIENDSHIP_STATUS } from './models/userFriendModels';

const PORT = Number(process.env.PORT || 3000);
const dbType = process.env.DB_TYPE?.trim().toLowerCase() || 'sqlite';

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
    connectTimeout: 5000,
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

const ensureAdminExists = async () => {
  try {
    const admCount = await Adm.count();

    if (admCount === 0) {
      const passwordHash = await hashPassword('Admin123!');
      await Adm.create({
        name: 'Admin',
        email: 'admin@neuroxp.com',
        password: passwordHash,
      });
      console.log('startServer: admin user created (email: admin@neuroxp.com, password: Admin123!)');
      logger.info('Admin user created on first startup', {
        email: 'admin@neuroxp.com',
        temporaryPassword: 'Admin123!',
      });
    } else {
      console.log('startServer: admin user already exists');
    }
  } catch (err) {
    logger.warn('startServer: ensureAdminExists failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

const ensureCompatibilitySchema = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const userFriendsTable = await queryInterface.describeTable('user_friends');

  if (!('status' in userFriendsTable)) {
    await queryInterface.addColumn('user_friends', 'status', {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: FRIENDSHIP_STATUS.PENDING,
    });
    console.log('startServer: added missing user_friends.status column');
  }
};

const startServer = async () => {
  try {
    if (dbType === 'mysql') {
      try {
        await Promise.race([
          ensureDatabaseExists(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('ensureDatabaseExists timeout')), 5000)),
        ]);
        console.log('startServer: database exists (or created)');
      } catch (err) {
        console.warn('startServer: ensureDatabaseExists failed or timed out, continuing startup', err instanceof Error ? String(err) : 'unknown error');
      }
    } else {
      console.log('startServer: sqlite selected, skipping MySQL database creation');
    }

    await sequelize.authenticate();
    console.log('startServer: sequelize authenticated');

    const syncMode = process.env.DB_SYNC_MODE || (process.env.NODE_ENV === 'production' ? 'safe' : 'alter');

    try {
      if (syncMode === 'force') {
        await Promise.race([
          sequelize.sync({ force: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('sequelize.sync timeout')), 10000)),
        ]);
      } else if (syncMode === 'alter') {
        await Promise.race([
          sequelize.sync({ alter: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('sequelize.sync timeout')), 10000)),
        ]);
      } else {
        await Promise.race([
          sequelize.sync(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('sequelize.sync timeout')), 10000)),
        ]);
      }
      console.log('startServer: sequelize synced');
    } catch (err) {
      console.warn('startServer: sequelize.sync failed or timed out, continuing startup', err instanceof Error ? err.message : String(err));
    }

    try {
      await ensureCompatibilitySchema();
    } catch (err) {
      console.warn(
        'startServer: compatibility schema update failed, continuing startup',
        err instanceof Error ? err.message : String(err)
      );
    }

    await ensureAdminExists();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

void startServer();
