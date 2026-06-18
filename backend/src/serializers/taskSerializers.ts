import type Task from '../models/taskModels';

export const sanitizeTask = (task: Task) => {
  const raw = task.toJSON() as Record<string, unknown>;

  return {
    id: Number(raw.id),
    userId: Number(raw.userId),
    activity: String(raw.activity ?? ''),
    description: (raw.description as string | null) ?? null,
    points: Number(raw.points ?? 0),
    completed: Boolean(raw.completed),
    analysis: (raw.analysis as string | null) ?? null,
    scheduledFor: (raw.scheduledFor as Date | null) ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};