export type ProgressTask = {
  completed: boolean;
  points: number;
};

export type TaskProgressSummary = {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  taskPoints: number;
};

export type UserProgressSummary = TaskProgressSummary & {
  friendsCount: number;
  friendBonusPoints: number;
  points: number;
  level: number;
  nextLevelAt: number;
  pointsToNextLevel: number;
  progressPercent: number;
};

/**
 * Pontos necessários para subir de nível e bônus por amigos.
 */
const LEVEL_STEP = 250;
const FRIEND_BONUS_POINTS = 30;

const toSafeInteger = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
};

/**
 * Calcula pontos da atividade com base em palavras-chave.
 * Atividades mais produtivas recebem mais pontos.
 */
export const getActivityPoints = (activity: string) => {
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

/**
 * Converte a string de data agendada em objeto Date.
 * Retorna null para valor vazio ou para qualquer valor que não seja uma data válida.
 */
export const parseScheduledFor = (value: unknown) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const normalizedValue = trimmedValue.replace(/\s+/g, '');
  const isoMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const slashMatch = normalizedValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const dashMatch = normalizedValue.match(/^(\d{2})-(\d{2})-(\d{4})$/);

  let parsedDate: Date;

  if (isoMatch) {
    parsedDate = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`);
  } else if (slashMatch) {
    parsedDate = new Date(`${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`);
  } else if (dashMatch) {
    parsedDate = new Date(`${dashMatch[3]}-${dashMatch[2]}-${dashMatch[1]}`);
  } else {
    parsedDate = new Date(normalizedValue);
  }

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

/**
 * Constroi um resumo de progresso de tarefas a partir de valores brutos.
 */
export const buildTaskProgressSummary = (
  totalTasks: number,
  completedTasks: number,
  taskPoints: number
): TaskProgressSummary => {
  const safeTotalTasks = toSafeInteger(totalTasks);
  const safeCompletedTasks = Math.min(safeTotalTasks, toSafeInteger(completedTasks));

  return {
    totalTasks: safeTotalTasks,
    completedTasks: safeCompletedTasks,
    pendingTasks: Math.max(0, safeTotalTasks - safeCompletedTasks),
    taskPoints: toSafeInteger(taskPoints),
  };
};

/**
 * Calcula o resumo de progresso com base na lista de tarefas do usuário.
 */
export const getTaskProgressSummary = (tasks: ProgressTask[]): TaskProgressSummary => {
  return tasks.reduce<TaskProgressSummary>((summary, task) => {
    summary.totalTasks += 1;

    if (task.completed) {
      summary.completedTasks += 1;
      summary.taskPoints += task.points;
    } else {
      summary.pendingTasks += 1;
    }

    return summary;
  }, buildTaskProgressSummary(0, 0, 0));
};

/**
 * Calcula o nível atual, progresso e pontos necessários para subir de nível.
 */
export const getLevelSummary = (points: number) => {
  const safePoints = Math.max(0, points);
  const level = Math.max(1, Math.floor(safePoints / LEVEL_STEP) + 1);
  const nextLevelAt = level * LEVEL_STEP;
  const levelFloor = (level - 1) * LEVEL_STEP;
  const progressPercent = Math.round(((safePoints - levelFloor) / LEVEL_STEP) * 100);

  return {
    level,
    nextLevelAt,
    pointsToNextLevel: Math.max(0, nextLevelAt - safePoints),
    progressPercent: Math.max(0, Math.min(100, progressPercent)),
  };
};

export const getUserProgressSummary = (
  tasks: ProgressTask[],
  friendsCount: number
): UserProgressSummary => {
  const taskSummary = getTaskProgressSummary(tasks);
  return getUserProgressSummaryFromStats(taskSummary, friendsCount);
};

export const getUserProgressSummaryFromStats = (
  taskSummary: TaskProgressSummary,
  friendsCount: number
): UserProgressSummary => {
  const friendBonusPoints = Math.max(0, friendsCount) * FRIEND_BONUS_POINTS;
  const points = taskSummary.taskPoints + friendBonusPoints;

  return {
    ...taskSummary,
    friendsCount,
    friendBonusPoints,
    points,
    ...getLevelSummary(points),
  };
};