import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Task extends Model {
  declare id: number;
  declare userId: number;
  declare activity: string;
  declare photoUrl: string | null;
  declare points: number;
  declare completed: boolean;
  declare analysis: string | null;
  declare scheduledFor: Date | null;
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    activity: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    photoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    analysis: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'tasks',
    timestamps: true,
  }
);

export default Task;
