import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export const FRIENDSHIP_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
} as const;

export type FriendshipStatus = (typeof FRIENDSHIP_STATUS)[keyof typeof FRIENDSHIP_STATUS];

class UserFriend extends Model {
  declare id: number;
  declare userId: number;
  declare friendId: number;
  declare status: FriendshipStatus;
  declare createdAt: Date;
  declare updatedAt: Date;
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
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: FRIENDSHIP_STATUS.PENDING,
      validate: {
        isIn: [[FRIENDSHIP_STATUS.PENDING, FRIENDSHIP_STATUS.ACCEPTED]],
      },
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
