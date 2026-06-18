import 'dotenv/config';
import mysql from 'mysql2/promise';

import app from './app';
import sequelize from './config/database';
import logger from './utils/logger';

const PORT = Number(process.env.PORT || 3000);
const dbType = process.env.DB_TYPE?.trim().toLowerCase() || 'sqlite';

/**
 * Garante que o banco de dados do sistema exista antes de iniciar a aplicação.
 * Este passo é necessário apenas para MySQL; SQLite é criado automaticamente.
 */
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

/**
 * Inicia o servidor Express, garantindo diretório de uploads e sincronizando o banco.
 * Usa timeout em operações demoradas para não travar o startup indefinidamente.
 */
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

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

void startServer();
