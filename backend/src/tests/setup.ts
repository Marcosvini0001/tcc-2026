/**
 * Configuração de testes
 * Usa SQLite em memória para testes isolados
 */

import { Sequelize } from 'sequelize';
import path from 'path';

/**
 * Cria uma instância Sequelize para testes
 * Por padrão usa SQLite em memória (mais rápido e isolado)
 */
export function createTestDatabase(): Sequelize {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:', // Banco em memória
    logging: false, // Desabilitar logs SQL durante testes
    // Alternativa: usar arquivo temporário
    // storage: path.join(process.cwd(), 'test-db.sqlite')
  });

  return sequelize;
}

/**
 * Cria uma instância para testes com MariaDB/MySQL
 * Útil para testes de integração que precisam do BD real
 */
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

/**
 * Limpa todas as tabelas (útil para limpeza entre testes)
 */
export async function truncateAllTables(sequelize: Sequelize): Promise<void> {
  const tables = Object.values(sequelize.models);
  for (const table of tables) {
    await table.destroy({ where: {} });
  }
}

/**
 * Fecha a conexão com o banco
 */
export async function closeDatabase(sequelize: Sequelize): Promise<void> {
  await sequelize.close();
}
