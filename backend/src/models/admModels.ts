import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Adm extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
}

Adm.init({
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
 
}, {
  sequelize,
  tableName: 'adms',
  timestamps: true,
});

export default Adm;