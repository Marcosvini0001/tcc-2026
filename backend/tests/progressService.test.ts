import { describe, expect, it } from 'vitest';
import {
  getActivityPoints,
  getUserProgressSummary,
  parseScheduledFor,
} from '../src/services/progressService';

describe('progressService', () => {
  it('scores activities by intent', () => {
    expect(getActivityPoints('Estudar Typescript')).toBe(120);
    expect(getActivityPoints('Organizar a mesa')).toBe(60);
    expect(getActivityPoints('Ver meme')).toBe(15);
    expect(getActivityPoints('Outra tarefa')).toBe(40);
  });

  it('parses optional schedule dates safely', () => {
    expect(parseScheduledFor('')).toBeNull();
    expect(parseScheduledFor('not-a-date')).toBe('invalid');
    expect(parseScheduledFor('2026-04-02')).toBeInstanceOf(Date);
  });

  it('builds progress summary from tasks and friends', () => {
    const summary = getUserProgressSummary(
      [
        { completed: true, points: 120 },
        { completed: false, points: 60 },
        { completed: true, points: 40 },
      ],
      2
    );

    expect(summary.totalTasks).toBe(3);
    expect(summary.completedTasks).toBe(2);
    expect(summary.pendingTasks).toBe(1);
    expect(summary.taskPoints).toBe(160);
    expect(summary.friendBonusPoints).toBe(60);
    expect(summary.points).toBe(220);
    expect(summary.level).toBe(1);
    expect(summary.pointsToNextLevel).toBe(30);
  });
});