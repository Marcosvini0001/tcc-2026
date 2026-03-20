import { Request, Response } from 'express';
import { Op } from 'sequelize';
import fs from 'node:fs/promises';
import path from 'node:path';
import User from '../models/userModels';
import UserFriend from '../models/userFriendModels';
import Task from '../models/taskModels';

const sanitizeUser = (user: User) => {
  const raw = user.toJSON() as Record<string, unknown>;

  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    email: String(raw.email ?? ''),
    cpf: String(raw.cpf ?? ''),
    friendCode: String(raw.friendCode ?? ''),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

const sanitizeTask = (task: Task) => {
  const raw = task.toJSON() as Record<string, unknown>;

  return {
    id: Number(raw.id),
    userId: Number(raw.userId),
    activity: String(raw.activity ?? ''),
    photoUrl: String(raw.photoUrl ?? ''),
    points: Number(raw.points ?? 0),
    completed: Boolean(raw.completed),
    analysis: (raw.analysis as string | null) ?? null,
    scheduledFor: (raw.scheduledFor as Date | null) ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

const getActivityPoints = (activity: string) => {
  const normalized = activity.toLowerCase();

  const highValueKeywords = [
    'estudar',
    'curso',
    'academia',
    'treino',
    'corrida',
    'projeto',
    'trabalho',
    'leitura',
    'ingles',
    'programacao',
  ];

  const mediumValueKeywords = ['organizar', 'limpar', 'mercado', 'planejar', 'cozinhar', 'caminhada'];

  const lowValueKeywords = ['scroll', 'rede social', 'tv', 'serie', 'jogo casual', 'meme'];

  if (highValueKeywords.some((keyword) => normalized.includes(keyword))) {
    return 120;
  }

  if (mediumValueKeywords.some((keyword) => normalized.includes(keyword))) {
    return 60;
  }

  if (lowValueKeywords.some((keyword) => normalized.includes(keyword))) {
    return 15;
  }

  return 40;
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

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, cpf } = req.body;

    if (!name || !email || !password || !cpf) {
      return res.status(400).json({ message: 'name, email, password and cpf are required' });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ message: 'email ja cadastrado' });
    }

    const existingCpf = await User.findOne({ where: { cpf } });
    if (existingCpf) {
      return res.status(409).json({ message: 'cpf ja cadastrado' });
    }

    const friendCode = await generateFriendCode();
    const user = await User.create({ name, email, password, cpf, friendCode });
    const createdUser = await User.findByPk((user.get('id') as number) || 0);

    if (!createdUser) {
      return res.status(500).json({ message: 'Falha ao carregar usuario criado' });
    }

    return res.status(201).json(sanitizeUser(createdUser));
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'email nao cadastrado' });
    }

    const authenticatedUser = await User.findOne({ where: { email, password } });
    if (!authenticatedUser) {
      return res.status(401).json({ message: 'senha incorreta' });
    }

    return res.json(sanitizeUser(authenticatedUser));
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
        const userId = user.get('id') as number;
        const friendsCount = friendsCountMap.get(userId) ?? 0;
        const points = friendsCount * 100;
        const level = Math.max(1, Math.floor(points / 300) + 1);

        return {
          id: userId,
          name: user.get('name') as string,
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

    await UserFriend.create({ userId, friendId });
    await UserFriend.create({ userId: friendId, friendId: userId });

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

    if (!photoUrl) {
      return res.status(400).json({ message: 'photoUrl is required' });
    }

    if (!activity) {
      return res.status(400).json({ message: 'activity is required' });
    }

    const user = await User.findByPk(id as string);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const task = await Task.create({
      userId: user.get('id') as number,
      activity,
      photoUrl,
      points: getActivityPoints(activity),
      completed: false,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
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
    const file = req.file;
    const activity = String(req.body.activity ?? '').trim();
    const scheduledFor = String(req.body.scheduledFor ?? '').trim();

    if (!file) {
      return res.status(400).json({ message: 'photo file is required' });
    }

    if (!activity) {
      return res.status(400).json({ message: 'activity is required' });
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
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        message: 'GEMINI_API_KEY is not configured on backend environment',
      });
    }

    const filename = path.basename(task.get('photoUrl') as string);
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
