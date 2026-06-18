import { Op } from 'sequelize';
import Task from '../models/taskModels';
import User from '../models/userModels';
import { normalizeText } from '../utils/validation';

const STANDARD_TASK_TITLES = [
  'estudar por 30 minutos',
  'caminhada de 20 minutos',
  'treino rapido',
  'ler um capitulo',
  'organizar o quarto',
  'planejar o dia',
];

export class TaskServiceError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = 'TaskServiceError';
  }
}

const normalizeTaskTitle = (value: unknown) => {
  const text = normalizeText(value);
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const isStandardTaskTitle = (value: string) => {
  const normalized = normalizeTaskTitle(value);
  return STANDARD_TASK_TITLES.includes(normalized);
};

const generateRandomPoints = () => Math.floor(Math.random() * 4) + 5;

export const getActivityPoints = (activity: string) => {
  return isStandardTaskTitle(activity) ? 5 : generateRandomPoints();
};

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const countPersonalizedTasksToday = async (userId: number) => {
  const { start, end } = getTodayRange();

  const tasks = await Task.findAll({
    where: {
      userId,
      createdAt: {
        [Op.between]: [start, end],
      },
    },
  });

  return tasks.filter((task) => !isStandardTaskTitle(task.activity)).length;
};

export const createTaskForUser = async (
  userId: number,
  activity: string,
  description?: string | null,
  scheduledFor?: Date | null
) => {
  const title = normalizeText(activity);
  if (!title) {
    throw new TaskServiceError('activity is required', 400);
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new TaskServiceError('User not found', 404);
  }

  const personalized = !isStandardTaskTitle(title);

  if (personalized) {
    const existingPersonalizedCount = await countPersonalizedTasksToday(userId);
    if (existingPersonalizedCount >= 2) {
      throw new TaskServiceError('Você atingiu o limite de 2 atividades personalizadas por hoje.', 400);
    }
  }

  const points = getActivityPoints(title);

  return Task.create({
    userId,
    activity: title,
    description: normalizeText(description) || null,
    points,
    completed: false,
    scheduledFor: scheduledFor ?? null,
  });
};
