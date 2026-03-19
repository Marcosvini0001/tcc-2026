import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class UserFriend extends Model {
  public id!: number;
  public userId!: number;
  public friendId!: number;
}

UserFriend.init(
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
    friendId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'user_friends',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'friendId'],
      },
    ],
  }
);

export default UserFriend;
