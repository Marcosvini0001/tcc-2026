import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Task extends Model {
  public id!: number;
  public userId!: number;
  public photoUrl!: string;
  public completed!: boolean;
  public analysis!: string | null;
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
    photoUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
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
  },
  {
    sequelize,
    tableName: 'tasks',
    timestamps: true,
  }
);

export default Task;
