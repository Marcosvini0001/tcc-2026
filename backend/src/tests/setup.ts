

import { Sequelize } from 'sequelize';
import path from 'path';

export function createTestDatabase(): Sequelize {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:', // Banco em memória
    logging: false, // Desabilitar logs SQL durante testes

  });

  return sequelize;
}

export function createTestDatabaseMySQL(): Sequelize {
  return new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: `${process.env.DB_NAME || 'tcc_db'}_test`,
    logging: false,
  });
}

export async function truncateAllTables(sequelize: Sequelize): Promise<void> {
  const tables = Object.values(sequelize.models);
  for (const table of tables) {
    await table.destroy({ where: {} });
  }
}

export async function closeDatabase(sequelize: Sequelize): Promise<void> {
  await sequelize.close();
}
