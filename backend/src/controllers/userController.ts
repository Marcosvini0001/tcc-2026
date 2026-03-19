import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/userModels';
import UserFriend from '../models/userFriendModels';

const sanitizeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  cpf: user.cpf,
  friendCode: user.friendCode,
  createdAt: user.get('createdAt'),
  updatedAt: user.get('updatedAt'),
});

const generateFriendCode = async (): Promise<string> => {
  while (true) {
    const length = Math.random() < 0.5 ? 4 : 5;
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    const code = String(Math.floor(Math.random() * (max - min + 1)) + min);

    const existing = await User.findOne({ where: { friendCode: code } });
    if (!existing) {
      return code;
    }
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, cpf } = req.body;

    if (!name || !email || !password || !cpf) {
      return res.status(400).json({ message: 'name, email, password and cpf are required' });
    }

    const friendCode = await generateFriendCode();
    const user = await User.create({ name, email, password, cpf, friendCode });
    return res.status(201).json(sanitizeUser(user));
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ where: { email, password } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll();
    return res.json(users.map((user) => sanitizeUser(user)));
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRanking = async (_req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name'],
      order: [['createdAt', 'ASC']],
    });

    const relations = await UserFriend.findAll({ attributes: ['userId'] });
    const friendsCountMap = new Map<number, number>();

    relations.forEach((relation) => {
      const count = friendsCountMap.get(relation.userId) ?? 0;
      friendsCountMap.set(relation.userId, count + 1);
    });

    const ranking = users
      .map((user) => {
        const friendsCount = friendsCountMap.get(user.id) ?? 0;
        const points = friendsCount * 100;
        const level = Math.max(1, Math.floor(points / 300) + 1);

        return {
          id: user.id,
          name: user.name,
          friendsCount,
          points,
          level,
        };
      })
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }

        return a.name.localeCompare(b.name);
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return res.json(ranking);
  } catch (error) {
    console.error('Error fetching ranking:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id as string);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, cpf } = req.body;

    const user = await User.findByPk(id as string);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.password = password ?? user.password;
    user.cpf = cpf ?? user.cpf;

    await user.save();
    return res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const addFriendByCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { friendCode } = req.body;

    if (!friendCode) {
      return res.status(400).json({ message: 'friendCode is required' });
    }

    const user = await User.findByPk(id as string);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const friend = await User.findOne({ where: { friendCode } });
    if (!friend) {
      return res.status(404).json({ message: 'Friend code not found' });
    }

    if (friend.id === user.id) {
      return res.status(400).json({ message: 'Cannot add yourself as friend' });
    }

    const existingRelation = await UserFriend.findOne({
      where: {
        [Op.or]: [
          { userId: user.id, friendId: friend.id },
          { userId: friend.id, friendId: user.id },
        ],
      },
    });

    if (existingRelation) {
      return res.status(409).json({ message: 'Users are already friends' });
    }

    await UserFriend.create({ userId: user.id, friendId: friend.id });
    await UserFriend.create({ userId: friend.id, friendId: user.id });

    return res.status(201).json({
      message: 'Friend added successfully',
      friend: sanitizeUser(friend),
    });
  } catch (error) {
    console.error('Error adding friend by code:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserFriends = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id as string);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const relations = await UserFriend.findAll({ where: { userId: user.id } });
    const friendIds = relations.map((relation) => relation.friendId);

    if (friendIds.length === 0) {
      return res.json([]);
    }

    const friends = await User.findAll({ where: { id: friendIds } });
    return res.json(friends.map((friend) => sanitizeUser(friend)));
  } catch (error) {
    console.error('Error fetching user friends:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id as string);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
