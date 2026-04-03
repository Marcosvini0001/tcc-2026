import { describe, expect, it } from 'vitest';
import {
  buildTaskProgressSummary,
  getActivityPoints,
  getLevelSummary,
  getTaskProgressSummary,
  getUserProgressSummary,
  getUserProgressSummaryFromStats,
  parseScheduledFor,
} from './progressService';

describe('progressService', () => {
  it('classifica atividades por palavras-chave', () => {
    expect(getActivityPoints('Estudar Typescript')).toBe(120);
    expect(getActivityPoints('Organizar a mesa')).toBe(60);
    expect(getActivityPoints('Ver meme')).toBe(15);
    expect(getActivityPoints('Responder e-mails')).toBe(40);
  });

  it('interpreta datas programadas validas e invalidas', () => {
    expect(parseScheduledFor(undefined)).toBeNull();
    expect(parseScheduledFor('   ')).toBeNull();
    expect(parseScheduledFor('not-a-date')).toBe('invalid');
    expect(parseScheduledFor('2026-04-03T12:00:00-03:00')).toBeInstanceOf(Date);
  });

  it('normaliza resumos agregados de tarefas', () => {
    expect(buildTaskProgressSummary(6.9, 10, -3)).toEqual({
      totalTasks: 6,
      completedTasks: 6,
      pendingTasks: 0,
      taskPoints: 0,
    });
  });

  it('calcula resumo de progresso a partir da lista de tarefas', () => {
    expect(
      getTaskProgressSummary([
        { completed: true, points: 120 },
        { completed: false, points: 60 },
        { completed: true, points: 40 },
      ])
    ).toEqual({
      totalTasks: 3,
      completedTasks: 2,
      pendingTasks: 1,
      taskPoints: 160,
    });
  });

  it('combina pontos de tarefas e bonus de amizade no resumo do usuario', () => {
    expect(
      getUserProgressSummaryFromStats(buildTaskProgressSummary(3, 2, 180), 2)
    ).toMatchObject({
      totalTasks: 3,
      completedTasks: 2,
      pendingTasks: 1,
      taskPoints: 180,
      friendsCount: 2,
      friendBonusPoints: 60,
      points: 240,
      level: 1,
      nextLevelAt: 250,
      pointsToNextLevel: 10,
      progressPercent: 96,
    });
  });

  it('mantem compatibilidade com o calculo por lista e com resumo de nivel', () => {
    expect(
      getUserProgressSummary(
        [
          { completed: true, points: 120 },
          { completed: true, points: 60 },
          { completed: false, points: 15 },
        ],
        1
      )
    ).toMatchObject({
      totalTasks: 3,
      completedTasks: 2,
      pendingTasks: 1,
      taskPoints: 180,
      friendBonusPoints: 30,
      points: 210,
      level: 1,
    });

    expect(getLevelSummary(-50)).toMatchObject({
      level: 1,
      nextLevelAt: 250,
      pointsToNextLevel: 250,
      progressPercent: 0,
    });
  });
});