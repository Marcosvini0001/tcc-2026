import { describe, expect, it } from 'vitest';
import {
  buildTaskProgressSummary,
  getActivityPoints,
  getLevelSummary,
  getTaskProgressSummary,
  getUserProgressSummary,
  getUserProgressSummaryFromStats,
  parseScheduledFor,
} from '../progressService';

describe('progressService - Activity Points', () => {
  it('deve classificar atividade de estudo com 120 pontos', () => {
    const activity = 'Estudar Typescript';

    const points = getActivityPoints(activity);

    expect(points).toBe(120);
  });

  it('deve classificar atividade de organização com 60 pontos', () => {
    const activity = 'Organizar a mesa';

    const points = getActivityPoints(activity);

    expect(points).toBe(60);
  });

  it('deve classificar atividades de baixa prioridade com pontos menores', () => {
    const lowPriorityActivities = ['Ver meme', 'Responder e-mails'];

    // Act & Assert
    expect(getActivityPoints(lowPriorityActivities[0])).toBe(15);
    expect(getActivityPoints(lowPriorityActivities[1])).toBe(40);
  });
});

describe('progressService - Scheduled Date Parsing', () => {
  it('deve retornar nulo para data indefinida', () => {
    // Arrange, Act, Assert
    expect(parseScheduledFor(undefined)).toBeNull();
  });

  it('deve retornar nulo para string vazia ou apenas espaços', () => {
    // Arrange, Act, Assert
    expect(parseScheduledFor('   ')).toBeNull();
  });

  it('deve retornar nulo para data inválida', () => {
    // Arrange
    const invalidDate = 'not-a-date';

    // Act
    const result = parseScheduledFor(invalidDate);

    // Assert
    expect(result).toBeNull();
  });

  it('deve converter data ISO válida para objeto Date', () => {
    // Arrange
    const validISODate = '2026-04-03T12:00:00-03:00';

    // Act
    const result = parseScheduledFor(validISODate);

    // Assert
    expect(result).toBeInstanceOf(Date);
  });
});

describe('progressService - Task Progress Summary', () => {
  it('deve normalizar resumo de progresso de tarefas', () => {
    // Arrange
    const totalTasks = 6.9;
    const completedTasks = 10;
    const taskPoints = -3;

    // Act
    const summary = buildTaskProgressSummary(totalTasks, completedTasks, taskPoints);

    // Assert
    expect(summary).toEqual({
      totalTasks: 6,
      completedTasks: 6,
      pendingTasks: 0,
      taskPoints: 0,
    });
  });

  it('deve calcular resumo a partir de lista de tarefas', () => {
    // Arrange
    const tasks = [
      { completed: true, points: 120 },
      { completed: false, points: 60 },
      { completed: true, points: 40 },
    ];

    // Act
    const summary = getTaskProgressSummary(tasks);

    // Assert
    expect(summary).toEqual({
      totalTasks: 3,
      completedTasks: 2,
      pendingTasks: 1,
      taskPoints: 160,
    });
  });

  it('deve somar pontos apenas de tarefas completadas', () => {
    // Arrange
    const incompleteTasks = [
      { completed: true, points: 50 },
      { completed: false, points: 100 },
    ];

    // Act
    const summary = getTaskProgressSummary(incompleteTasks);

    // Assert
    expect(summary.taskPoints).toBe(50);
    expect(summary.completedTasks).toBe(1);
  });
});

describe('progressService - User Progress with Friend Bonus', () => {
  it('deve adicionar bonus de amizade ao resumo do usuário', () => {
    // Arrange
    const taskSummary = buildTaskProgressSummary(3, 2, 180);
    const friendsCount = 2;

    // Act
    const progress = getUserProgressSummaryFromStats(taskSummary, friendsCount);

    // Assert
    expect(progress.friendsCount).toBe(2);
    expect(progress.friendBonusPoints).toBe(60);
    expect(progress.points).toBe(240);
  });

  it('deve calcular nível correto baseado em pontos totais', () => {
    // Arrange
    const taskSummary = buildTaskProgressSummary(3, 2, 180);
    const friendsCount = 2;

    // Act
    const progress = getUserProgressSummaryFromStats(taskSummary, friendsCount);

    // Assert
    expect(progress.level).toBe(1);
    expect(progress.nextLevelAt).toBe(250);
    expect(progress.pointsToNextLevel).toBe(10);
  });

  it('deve calcular percentual de progresso para próximo nível', () => {
    // Arrange
    const taskSummary = buildTaskProgressSummary(3, 2, 180);
    const friendsCount = 2;

    // Act
    const progress = getUserProgressSummaryFromStats(taskSummary, friendsCount);

    // Assert
    expect(progress.progressPercent).toBe(96);
  });
});

describe('progressService - User Progress Summary', () => {
  it('deve combinar progresso de tarefas com bonus de amigos', () => {
    // Arrange
    const tasks = [
      { completed: true, points: 120 },
      { completed: true, points: 60 },
      { completed: false, points: 15 },
    ];
    const friendsCount = 1;

    // Act
    const progress = getUserProgressSummary(tasks, friendsCount);

    // Assert
    expect(progress.totalTasks).toBe(3);
    expect(progress.completedTasks).toBe(2);
    expect(progress.taskPoints).toBe(180);
    expect(progress.friendBonusPoints).toBe(30);
    expect(progress.points).toBe(210);
  });

  it('deve manter compatibilidade entre cálculos de lista e resumo', () => {
    // Arrange
    const tasks = [
      { completed: true, points: 120 },
      { completed: true, points: 60 },
      { completed: false, points: 15 },
    ];

    // Act
    const summaryFromList = getUserProgressSummary(tasks, 1);
    const levelSummary = getLevelSummary(210);

    // Assert
    expect(summaryFromList.level).toBe(levelSummary.level);
    expect(summaryFromList.nextLevelAt).toBe(levelSummary.nextLevelAt);
  });
});

describe('progressService - Level Summary', () => {
  it('deve retornar nível 1 para pontos negativos', () => {
    // Arrange
    const negativePoints = -50;

    // Act
    const levelSummary = getLevelSummary(negativePoints);

    // Assert
    expect(levelSummary.level).toBe(1);
    expect(levelSummary.pointsToNextLevel).toBe(250);
    expect(levelSummary.progressPercent).toBe(0);
  });

  it('deve calcular corretamente próximo nível quando em nível 1', () => {
    // Arrange
    const points = 100;

    // Act
    const levelSummary = getLevelSummary(points);

    // Assert
    expect(levelSummary.level).toBe(1);
    expect(levelSummary.nextLevelAt).toBe(250);
  });
});