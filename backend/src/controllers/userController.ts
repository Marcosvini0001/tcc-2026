import { Request, Response } from 'express';
import { Op, col, fn, literal } from 'sequelize';
import sequelize from '../config/database';
import User from '../models/userModels';
import UserFriend, { FRIENDSHIP_STATUS } from '../models/userFriendModels';
import Task from '../models/taskModels';
import { sanitizeTask } from '../serializers/taskSerializers';
import { sanitizeUser } from '../serializers/userSerializers';
import logger from '../utils/logger';
import {
  createAccessToken,
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from '../services/authService';
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetExpired,
} from '../services/passwordResetService';
import {
  buildTaskProgressSummary,
  getUserProgressSummaryFromStats,
  parseScheduledFor,
} from '../services/progressService';
import { createTaskForUser, TaskServiceError } from '../services/taskService';
import { EMAIL_REGEX, normalizeCpf, normalizeEmail, normalizeText } from '../utils/validation';

const toSafeNumber = (value: unknown) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const name = normalizeText(req.body.name);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password ?? '');
    const cpf = normalizeCpf(req.body.cpf);

    if (!name || !email || !password || !cpf) {
      return res.status(400).json({ message: 'name, email, password and cpf are required' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'email invalido' });
    }

    if (cpf.length !== 11) {
      return res.status(400).json({ message: 'cpf invalido' });
    }

    const passwordValidation = validatePasswordStrength(password);
    if (passwordValidation) {
      return res.status(400).json({ message: passwordValidation });
    }

    const [existingEmail, existingCpf] = await Promise.all([
      User.findOne({ where: { email } }),
      User.findOne({ where: { cpf } }),
    ]);

    if (existingEmail) {
      return res.status(409).json({ message: 'email ja cadastrado' });
    }

    if (existingCpf) {
      return res.status(409).json({ message: 'cpf ja cadastrado' });
    }

    const passwordHash = await hashPassword(password);

    const createdUser = await sequelize.transaction(async (transaction) => {
      let friendCode: string;
      let maxAttempts = 10;

      do {
        const length = Math.random() < 0.5 ? 4 : 5;
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;
        friendCode = String(Math.floor(Math.random() * (max - min + 1)) + min);

        const existing = await User.findOne({ where: { friendCode }, transaction });
        if (!existing) {
          break;
        }
        maxAttempts--;
      } while (maxAttempts > 0);

      if (maxAttempts === 0) {
        throw new Error('Unable to generate unique friend code');
      }

      return User.create({ name, email, password: passwordHash, cpf, friendCode }, { transaction });
    });

    logger.info('User created successfully', {
      requestId: req.requestId,
      userId: createdUser.id,
      email
    });

    return res.status(201).json({
      token: createAccessToken({ userId: createdUser.id, role: 'user' }),
      user: sanitizeUser(createdUser),
    });
  } catch (error) {
    logger.error('Error creating user', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error)
    });
    const maybeSequelizeError = error as {
      name?: string;
      message?: string;
      original?: { code?: string; sqlMessage?: string };
      errors?: Array<{ path?: string }>;
    };
    if (maybeSequelizeError.name === 'SequelizeUniqueConstraintError') {
      const duplicateField = maybeSequelizeError.errors?.[0]?.path;
      if (duplicateField === 'email') {
        return res.status(409).json({ message: 'email ja cadastrado' });
      }

      if (duplicateField === 'cpf') {
        return res.status(409).json({ message: 'cpf ja cadastrado' });
      }

      return res.status(409).json({ message: 'registro duplicado' });
    }

    const sqlDuplicateMessage =
      maybeSequelizeError.original?.sqlMessage?.toLowerCase() ||
      maybeSequelizeError.message?.toLowerCase() ||
      '';

    if (
      maybeSequelizeError.original?.code === 'ER_DUP_ENTRY' ||
      sqlDuplicateMessage.includes('duplicate entry')
    ) {
      if (sqlDuplicateMessage.includes('cpf')) {
        return res.status(409).json({ message: 'cpf ja cadastrado' });
      }

      if (sqlDuplicateMessage.includes('email')) {
        return res.status(409).json({ message: 'email ja cadastrado' });
      }

      return res.status(409).json({ message: 'registro duplicado' });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password ?? '');

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais invalidas' });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciais invalidas' });
    }

    return res.json({
      token: createAccessToken({ userId: user.id, role: 'user' }),
      user: sanitizeUser(user),
    });
  } catch (error) {
    logger.error('Error logging in user', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'email invalido' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({
        message: 'Se o e-mail existir, enviaremos instrucoes para redefinir a senha.',
      });
    }

    const { token, tokenHash, expiresAt } = createPasswordResetToken();
    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = expiresAt;
    await user.save();

    return res.json({
      message: 'Se o e-mail existir, enviaremos instrucoes para redefinir a senha.',
      resetTokenPreview: process.env.NODE_ENV === 'production' ? undefined : token,
      expiresAt,
    });
  } catch (error) {
    logger.error('Error requesting password reset:', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const token = normalizeText(req.body.token);
    const newPassword = String(req.body.newPassword ?? '');

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'token and newPassword are required' });
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (passwordValidation) {
      return res.status(400).json({ message: passwordValidation });
    }

    const tokenHash = hashPasswordResetToken(token);
    const user = await User.findOne({ where: { resetPasswordTokenHash: tokenHash } });

    if (!user || isPasswordResetExpired(user.resetPasswordExpiresAt)) {
      return res.status(400).json({ message: 'Token de redefinicao invalido ou expirado' });
    }

    user.password = await hashPassword(newPassword);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    await user.save();

    return res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    logger.error('Error resetting password:', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll();
    return res.json(users.map((user) => sanitizeUser(user)));
  } catch (error) {
    logger.error('Error fetching users:', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRanking = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const currentUserId = req.auth.userId;
    const currentUserRelations = await UserFriend.findAll({
      where: { userId: currentUserId, status: FRIENDSHIP_STATUS.ACCEPTED },
      attributes: ['friendId'],
      raw: true,
    });

    const rankingUserIds = currentUserRelations.map((relation) =>
      toSafeNumber((relation as { friendId?: unknown }).friendId)
    );

    if (rankingUserIds.length === 0) {
      return res.json([]);
    }

    const [users, relations, taskStats] = await Promise.all([
      User.findAll({
        where: { id: { [Op.in]: rankingUserIds } },
        attributes: ['id', 'name'],
        order: [['createdAt', 'ASC']],
      }),
      UserFriend.findAll({
        where: { userId: { [Op.in]: rankingUserIds }, status: FRIENDSHIP_STATUS.ACCEPTED },
        attributes: ['userId', [fn('COUNT', col('friendId')), 'friendsCount']],
        group: ['userId'],
        raw: true,
      }),
      Task.findAll({
        where: { userId: { [Op.in]: rankingUserIds } },
        attributes: [
          'userId',
          [fn('COUNT', col('id')), 'totalTasks'],
          [fn('SUM', literal('CASE WHEN completed = 1 THEN 1 ELSE 0 END')), 'completedTasks'],
          [fn('SUM', literal('CASE WHEN completed = 1 THEN points ELSE 0 END')), 'taskPoints'],
        ],
        group: ['userId'],
        raw: true,
      }),
    ]);

    const friendsCountMap = new Map<number, number>();
    const taskSummaryByUserMap = new Map<number, ReturnType<typeof buildTaskProgressSummary>>();

    relations.forEach((relation) => {
      const relationUserId = toSafeNumber((relation as { userId?: unknown }).userId);
      const friendsCount = toSafeNumber((relation as { friendsCount?: unknown }).friendsCount);
      friendsCountMap.set(relationUserId, friendsCount);
    });

    taskStats.forEach((taskStat) => {
      const rawTaskStat = taskStat as {
        userId?: unknown;
        totalTasks?: unknown;
        completedTasks?: unknown;
        taskPoints?: unknown;
      };
      const userId = toSafeNumber(rawTaskStat.userId);

      taskSummaryByUserMap.set(
        userId,
        buildTaskProgressSummary(
          toSafeNumber(rawTaskStat.totalTasks),
          toSafeNumber(rawTaskStat.completedTasks),
          toSafeNumber(rawTaskStat.taskPoints)
        )
      );
    });

    const ranking = users
      .map((user) => {
        const userId = user.get('id') as number;
        const friendsCount = friendsCountMap.get(userId) ?? 0;
        const summary = getUserProgressSummaryFromStats(
          taskSummaryByUserMap.get(userId) ?? buildTaskProgressSummary(0, 0, 0),
          friendsCount
        );

        return {
          id: userId,
          name: user.get('name') as string,
          ...summary,
        };
      })
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }

        if (b.completedTasks !== a.completedTasks) {
          return b.completedTasks - a.completedTasks;
        }

        if (b.friendsCount !== a.friendsCount) {
          return b.friendsCount - a.friendsCount;
        }

        return a.name.localeCompare(b.name);
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return res.json(ranking);
  } catch (error) {
    logger.error('Error fetching ranking:', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
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

    const userId = user.get('id') as number;

    const [friendsCount, totalTasks, completedTasks, taskPoints] = await Promise.all([
      UserFriend.count({ where: { userId, status: FRIENDSHIP_STATUS.ACCEPTED } }),
      Task.count({ where: { userId } }),
      Task.count({ where: { userId, completed: true } }),
      Task.sum('points', { where: { userId, completed: true } }),
    ]);

    return res.json({
      ...sanitizeUser(user),
      ...getUserProgressSummaryFromStats(
        buildTaskProgressSummary(totalTasks, completedTasks, toSafeNumber(taskPoints)),
        friendsCount
      ),
    });
  } catch (error) {
    logger.error('Error fetching user:', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = typeof req.body.name === 'string' ? normalizeText(req.body.name) : '';
    const email = typeof req.body.email === 'string' ? normalizeEmail(req.body.email) : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const cpf = typeof req.body.cpf === 'string' ? normalizeCpf(req.body.cpf) : '';

    const user = await User.findByPk(id as string);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email) {
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ message: 'email invalido' });
      }

      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail && existingEmail.id !== user.id) {
        return res.status(409).json({ message: 'email ja cadastrado' });
      }

      user.email = email;
    }

    if (cpf) {
      if (cpf.length !== 11) {
        return res.status(400).json({ message: 'cpf invalido' });
      }

      const existingCpf = await User.findOne({ where: { cpf } });
      if (existingCpf && existingCpf.id !== user.id) {
        return res.status(409).json({ message: 'cpf ja cadastrado' });
      }

      user.cpf = cpf;
    }

    if (password) {
      const passwordValidation = validatePasswordStrength(password);
      if (passwordValidation) {
        return res.status(400).json({ message: passwordValidation });
      }

      user.password = await hashPassword(password);
    }

    if (name) {
      user.name = name;
    }

    await user.save();
    return res.json(sanitizeUser(user));
  } catch (error) {
    logger.error('Error updating user:', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const addFriendByCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const friendCode = normalizeText(req.body.friendCode);

    if (!friendCode) {
      return res.status(400).json({ message: 'friendCode is required' });
    }

    const user = await User.findByPk(id as string);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const friend = await User.findOne({ where: { friendCode } });
    if (!friend) {
      return res.status(404).json({ message: 'Codigo de amigo nao encontrado' });
    }

    const userId = user.get('id') as number;
    const friendId = friend.get('id') as number;

    if (friendId === userId) {
      return res.status(400).json({ message: 'Voce nao pode se adicionar como amigo' });
    }

    const inviteResult = await sequelize.transaction(async (transaction) => {
      const [existingDirectRelation, reverseRelation] = await Promise.all([
        UserFriend.findOne({
          where: { userId, friendId },
          transaction,
          lock: true,
        }),
        UserFriend.findOne({
          where: { userId: friendId, friendId: userId },
          transaction,
          lock: true,
        }),
      ]);

      if (existingDirectRelation?.status === FRIENDSHIP_STATUS.ACCEPTED) {
        throw new Error('Amigo ja adicionado');
      }

      if (existingDirectRelation?.status === FRIENDSHIP_STATUS.PENDING) {
        throw new Error('Convite ja enviado');
      }

      if (reverseRelation?.status === FRIENDSHIP_STATUS.PENDING) {
        reverseRelation.status = FRIENDSHIP_STATUS.ACCEPTED;
        await reverseRelation.save({ transaction });

        if (existingDirectRelation) {
          existingDirectRelation.status = FRIENDSHIP_STATUS.ACCEPTED;
          await existingDirectRelation.save({ transaction });
        } else {
          await UserFriend.create(
            { userId, friendId, status: FRIENDSHIP_STATUS.ACCEPTED },
            { transaction }
          );
        }

        return { status: FRIENDSHIP_STATUS.ACCEPTED, message: 'Convite aceito automaticamente' };
      }

      if (reverseRelation?.status === FRIENDSHIP_STATUS.ACCEPTED) {
        if (existingDirectRelation) {
          existingDirectRelation.status = FRIENDSHIP_STATUS.ACCEPTED;
          await existingDirectRelation.save({ transaction });
        } else {
          await UserFriend.create(
            { userId, friendId, status: FRIENDSHIP_STATUS.ACCEPTED },
            { transaction }
          );
        }

        return { status: FRIENDSHIP_STATUS.ACCEPTED, message: 'Amigo ja adicionado' };
      }

      if (existingDirectRelation) {
        existingDirectRelation.status = FRIENDSHIP_STATUS.PENDING;
        await existingDirectRelation.save({ transaction });
      } else {
        await UserFriend.create(
          { userId, friendId, status: FRIENDSHIP_STATUS.PENDING },
          { transaction }
        );
      }

      return { status: FRIENDSHIP_STATUS.PENDING, message: 'Convite enviado com sucesso' };
    });

    logger.info('Friend invitation processed', {
      requestId: req.requestId,
      userId,
      friendId,
      status: inviteResult.status
    });

    return res.status(201).json({
      message: inviteResult.message,
      status: inviteResult.status,
      friend: sanitizeUser(friend),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Amigo ja adicionado') {
      return res.status(409).json({ message: 'Amigo ja adicionado' });
    }
    if (error instanceof Error && error.message === 'Convite ja enviado') {
      return res.status(409).json({ message: 'Convite ja enviado' });
    }
    logger.error('Error adding friend by code', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
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

    const userId = user.get('id') as number;
    const relations = await UserFriend.findAll({ where: { userId, status: FRIENDSHIP_STATUS.ACCEPTED } });
    const friendIds = relations.map((relation) => relation.get('friendId') as number);

    if (friendIds.length === 0) {
      return res.json([]);
    }

    const friends = await User.findAll({ where: { id: friendIds } });
    return res.json(friends.map((friend) => sanitizeUser(friend)));
  } catch (error) {
    logger.error('Error fetching user friends:', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const removeFriend = async (req: Request, res: Response) => {
  try {
    const { id, friendId } = req.params;

    const user = await User.findByPk(id as string);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = user.get('id') as number;
    const parsedFriendId = Number(friendId);

    if (!Number.isFinite(parsedFriendId) || parsedFriendId <= 0) {
      return res.status(400).json({ message: 'Invalid friend id' });
    }

    const deleted = await UserFriend.destroy({
      where: {
        [Op.or]: [
          { userId, friendId: parsedFriendId },
          { userId: parsedFriendId, friendId: userId },
        ],
      },
    });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    return res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    logger.error('Error removing friend:', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPendingFriendRequests = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id as string);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = user.get('id') as number;
    const pendingRelations = await UserFriend.findAll({
      where: { friendId: userId, status: FRIENDSHIP_STATUS.PENDING },
      order: [['createdAt', 'DESC']],
    });

    if (pendingRelations.length === 0) {
      return res.json([]);
    }

    const requesterIds = pendingRelations.map((relation) => relation.userId);
    const requesters = await User.findAll({
      where: { id: { [Op.in]: requesterIds } },
    });

    const requesterMap = new Map<number, ReturnType<typeof sanitizeUser>>();
    requesters.forEach((requester) => {
      requesterMap.set(requester.id, sanitizeUser(requester));
    });

    const requests = pendingRelations
      .map((relation) => {
        const requester = requesterMap.get(relation.userId);
        if (!requester) {
          return null;
        }

        return {
          requestId: relation.id,
          status: relation.status,
          createdAt: relation.createdAt,
          requester,
        };
      })
      .filter((request): request is NonNullable<typeof request> => request !== null);

    return res.json(requests);
  } catch (error) {
    logger.error('Error fetching pending friend requests:', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const requestId = Number(req.params.requestId);

    if (!Number.isFinite(userId) || userId <= 0 || !Number.isFinite(requestId) || requestId <= 0) {
      return res.status(400).json({ message: 'Invalid friend request data' });
    }

    const result = await sequelize.transaction(async (transaction) => {
      const pendingRequest = await UserFriend.findOne({
        where: { id: requestId, friendId: userId, status: FRIENDSHIP_STATUS.PENDING },
        transaction,
        lock: true,
      });

      if (!pendingRequest) {
        throw new Error('Friend request not found');
      }

      pendingRequest.status = FRIENDSHIP_STATUS.ACCEPTED;
      await pendingRequest.save({ transaction });

      const reverseRelation = await UserFriend.findOne({
        where: {
          userId,
          friendId: pendingRequest.userId,
        },
        transaction,
        lock: true,
      });

      if (reverseRelation) {
        reverseRelation.status = FRIENDSHIP_STATUS.ACCEPTED;
        await reverseRelation.save({ transaction });
      } else {
        await UserFriend.create(
          {
            userId,
            friendId: pendingRequest.userId,
            status: FRIENDSHIP_STATUS.ACCEPTED,
          },
          { transaction }
        );
      }

      return pendingRequest;
    });

    const requester = await User.findByPk(result.userId as number);

    return res.json({
      message: 'Convite aceito com sucesso',
      friend: requester ? sanitizeUser(requester) : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Friend request not found') {
      return res.status(404).json({ message: 'Convite nao encontrado' });
    }
    logger.error('Error accepting friend request:', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const rejectFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const requestId = Number(req.params.requestId);

    if (!Number.isFinite(userId) || userId <= 0 || !Number.isFinite(requestId) || requestId <= 0) {
      return res.status(400).json({ message: 'Invalid friend request data' });
    }

    const deleted = await UserFriend.destroy({
      where: {
        id: requestId,
        friendId: userId,
        status: FRIENDSHIP_STATUS.PENDING,
      },
    });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Convite nao encontrado' });
    }

    return res.json({ message: 'Convite recusado com sucesso' });
  } catch (error) {
    logger.error('Error rejecting friend request:', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const { activity, scheduledFor, description } = req.body;
    const normalizedActivity = normalizeText(activity);
    if (!normalizedActivity) {
      return res.status(400).json({ message: 'activity is required' });
    }

    const parsedScheduledFor = parseScheduledFor(scheduledFor);
    const normalizedDescription = normalizeText(description) || null;

    const task = await createTaskForUser(userId, normalizedActivity, normalizedDescription, parsedScheduledFor);
    return res.status(201).json(sanitizeTask(task));
  } catch (error) {
    if (error instanceof TaskServiceError) {
      return res.status(error.status).json({ message: error.message });
    }
    logger.error('Error creating task:', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserTasks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id as string);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tasks = await Task.findAll({
      where: { userId: user.get('id') as number },
      order: [['createdAt', 'DESC']],
    });

    return res.json(tasks.map((task) => sanitizeTask(task)));
  } catch (error) {
    logger.error('Error fetching user tasks:', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const completeTask = async (req: Request, res: Response) => {
  try {
    const { id, taskId } = req.params;

    const user = await User.findByPk(id as string);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = user.get('id') as number;
    const result = await sequelize.transaction(async (transaction) => {
      const task = await Task.findOne({
        where: { id: taskId, userId },
        transaction,
        lock: true,
      });

      if (!task) {
        throw new Error('Task not found');
      }

      if (task.get('completed')) {
        return task;
      }

      task.set('completed', true);
      await task.save({ transaction });
      return task;
    });

    logger.info('Task completed successfully', {
      requestId: req.requestId,
      userId,
      taskId
    });

    return res.json(sanitizeTask(result));
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      return res.status(404).json({ message: 'Task not found' });
    }
    logger.error('Error completing task', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id, taskId } = req.params;

    const user = await User.findByPk(id as string);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = user.get('id') as number;
    const parsedTaskId = Number(taskId);

    if (!Number.isFinite(parsedTaskId) || parsedTaskId <= 0) {
      return res.status(400).json({ message: 'Invalid task id' });
    }

    const deleted = await Task.destroy({
      where: { id: parsedTaskId, userId },
    });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.status(204).send();
  } catch (error) {
    logger.error('Error deleting task', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
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
    logger.error('Error deleting user:', { requestId: req.requestId, error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ message: 'Internal server error' });
  }
};
