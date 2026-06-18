import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isTestEnvironment = process.env.NODE_ENV === 'test';
const databaseType = isTestEnvironment
  ? 'sqlite'
  : process.env.DB_TYPE?.trim().toLowerCase() || 'sqlite';

let sequelize: Sequelize;

if (databaseType === 'mysql') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'tcc_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      dialect: 'mysql',
      logging: false,
    }
  );
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: isTestEnvironment ? ':memory:' : process.env.DB_PATH || 'database.sqlite',
    logging: false,
  });
}

export default sequelize;