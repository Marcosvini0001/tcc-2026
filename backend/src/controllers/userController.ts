import { Request, Response } from 'express';
import { Op, col, fn, literal } from 'sequelize';
import fs from 'node:fs/promises';
import path from 'node:path';
import sequelize from '../config/database';
import User from '../models/userModels';
import UserFriend from '../models/userFriendModels';
import Task from '../models/taskModels';
import { sanitizeTask } from '../serializers/taskSerializers';
import { sanitizeUser } from '../serializers/userSerializers';
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
  getActivityPoints,
  getUserProgressSummaryFromStats,
  parseScheduledFor,
} from '../services/progressService';
import { EMAIL_REGEX, normalizeCpf, normalizeEmail, normalizeText } from '../utils/validation';

type UploadedTaskFile = {
  filename: string;
};

const getMimeTypeByExtension = (filename: string) => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.heic') return 'image/heic';
  return 'image/jpeg';
};

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

    const friendCode = await generateFriendCode();
    const passwordHash = await hashPassword(password);

    const createdUser = await sequelize.transaction(async (transaction) => {
      return User.create({ name, email, password: passwordHash, cpf, friendCode }, { transaction });
    });

    return res.status(201).json({
      token: createAccessToken({ userId: createdUser.id, role: 'user' }),
      user: sanitizeUser(createdUser),
    });
  } catch (error) {
    console.error('Error creating user:', error);
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
    console.error('Error logging in user:', error);
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
    console.error('Error requesting password reset:', error);
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
    console.error('Error resetting password:', error);
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
    const [users, relations, taskStats] = await Promise.all([
      User.findAll({
        attributes: ['id', 'name'],
        order: [['createdAt', 'ASC']],
      }),
      UserFriend.findAll({
        attributes: ['userId', [fn('COUNT', col('friendId')), 'friendsCount']],
        group: ['userId'],
        raw: true,
      }),
      Task.findAll({
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

    const userId = user.get('id') as number;

    const [friendsCount, totalTasks, completedTasks, taskPoints] = await Promise.all([
      UserFriend.count({ where: { userId } }),
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
    console.error('Error fetching user:', error);
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
    console.error('Error updating user:', error);
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
      return res.status(404).json({ message: 'Friend code not found' });
    }

    const userId = user.get('id') as number;
    const friendId = friend.get('id') as number;

    if (friendId === userId) {
      return res.status(400).json({ message: 'Cannot add yourself as friend' });
    }

    const existingRelation = await UserFriend.findOne({
      where: {
        [Op.or]: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (existingRelation) {
      return res.status(409).json({ message: 'Users are already friends' });
    }

    await sequelize.transaction(async (transaction) => {
      await UserFriend.create({ userId, friendId }, { transaction });
      await UserFriend.create({ userId: friendId, friendId: userId }, { transaction });
    });

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

    const userId = user.get('id') as number;
    const relations = await UserFriend.findAll({ where: { userId } });
    const friendIds = relations.map((relation) => relation.get('friendId') as number);

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

export const createTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { photoUrl, activity, scheduledFor } = req.body;
    const normalizedActivity = normalizeText(activity);
    const normalizedPhotoUrl = typeof photoUrl === 'string' ? photoUrl.trim() : '';
    const parsedScheduledFor = parseScheduledFor(scheduledFor);

    if (!normalizedActivity) {
      return res.status(400).json({ message: 'activity is required' });
    }

    if (parsedScheduledFor === 'invalid') {
      return res.status(400).json({ message: 'scheduledFor must be a valid date' });
    }

    const user = await User.findByPk(id as string);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const task = await Task.create({
      userId: user.get('id') as number,
      activity: normalizedActivity,
      photoUrl: normalizedPhotoUrl || null,
      points: getActivityPoints(normalizedActivity),
      completed: false,
      scheduledFor: parsedScheduledFor,
    });

    return res.status(201).json(sanitizeTask(task));
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTaskByUpload = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = (req as Request & { file?: UploadedTaskFile }).file;
    const activity = normalizeText(req.body.activity);
    const parsedScheduledFor = parseScheduledFor(req.body.scheduledFor);

    if (!file) {
      return res.status(400).json({ message: 'photo file is required' });
    }

    if (!activity) {
      return res.status(400).json({ message: 'activity is required' });
    }

    if (parsedScheduledFor === 'invalid') {
      return res.status(400).json({ message: 'scheduledFor must be a valid date' });
    }

    const user = await User.findByPk(id as string);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const photoUrl = `${baseUrl}/uploads/${file.filename}`;

    const task = await Task.create({
      userId: user.get('id') as number,
      activity,
      photoUrl,
      points: getActivityPoints(activity),
      completed: false,
      scheduledFor: parsedScheduledFor,
    });

    return res.status(201).json(sanitizeTask(task));
  } catch (error) {
    console.error('Error creating task by upload:', error);
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
    console.error('Error fetching user tasks:', error);
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

    const task = await Task.findOne({ where: { id: taskId, userId: user.get('id') as number } });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.get('completed')) {
      return res.json(sanitizeTask(task));
    }

    task.set('completed', true);
    await task.save();

    return res.json(sanitizeTask(task));
  } catch (error) {
    console.error('Error completing task:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const analyzeTaskPhoto = async (req: Request, res: Response) => {
  try {
    const { id, taskId } = req.params;

    const user = await User.findByPk(id as string);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const task = await Task.findOne({ where: { id: taskId, userId: user.get('id') as number } });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const taskPhotoUrl = task.get('photoUrl') as string | null;
    if (!taskPhotoUrl) {
      return res.status(400).json({ message: 'Task does not have a photo to analyze' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        message: 'GEMINI_API_KEY is not configured on backend environment',
      });
    }

    const filename = path.basename(taskPhotoUrl);
    const localImagePath = path.resolve(process.cwd(), 'uploads', filename);
    const imageBuffer = await fs.readFile(localImagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = getMimeTypeByExtension(filename);

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Analise a imagem como o Google Lens: descreva objetos principais, texto visivel (OCR), contexto e uma sugestao de acao em portugues, de forma curta.',
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      return res.status(502).json({
        message: 'Vision provider error',
        details: errorBody,
      });
    }

    const data = (await geminiResponse.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const analysisText =
      data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('\n').trim() ||
      'Nao foi possivel extrair detalhes da imagem.';

    task.set('analysis', analysisText);
    await task.save();

    return res.json({
      task: sanitizeTask(task),
      analysis: analysisText,
    });
  } catch (error) {
    console.error('Error analyzing task photo:', error);
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
