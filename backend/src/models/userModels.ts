import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class User extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare password: string;
  declare cpf: string;
  declare friendCode: string;
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  cpf: {
    type: DataTypes.STRING(11),
    allowNull: false,
    unique: true,
  },
  friendCode: {
    type: DataTypes.STRING(5),
    allowNull: false,
    unique: true,
  },
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
});

export default User;