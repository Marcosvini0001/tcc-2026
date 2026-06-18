import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import Task from '../../models/taskModels';
import User from '../../models/userModels';
import { createTaskForUser, TaskServiceError, isDateInPast } from '../taskService';

vi.mock('../../models/taskModels');
vi.mock('../../models/userModels');

const mockUser = vi.mocked(User);
const mockTask = vi.mocked(Task);

describe('taskService - isDateInPast', () => {
  it('deve retornar false para null', () => {
    const result = isDateInPast(null);
    expect(result).toBe(false);
  });

  it('deve retornar false para undefined', () => {
    const result = isDateInPast(undefined);
    expect(result).toBe(false);
  });

  it('deve retornar true para data no passado', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const result = isDateInPast(yesterday);

    expect(result).toBe(true);
  });

  it('deve retornar false para data hoje', () => {
    const today = new Date();

    const result = isDateInPast(today);

    expect(result).toBe(false);
  });

  it('deve retornar false para data no futuro', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = isDateInPast(tomorrow);

    expect(result).toBe(false);
  });
});

describe('taskService - createTaskForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve aceitar atividade com data hoje', async () => {
    const userId = 1;
    const activity = 'Estudar por 30 minutos';
    const today = new Date();
    const mockTask = { id: 1, userId, activity, points: 5, completed: false };

    (User.findByPk as any).mockResolvedValue({ id: userId });
    (Task.findAll as any).mockResolvedValue([]);
    (Task.create as any).mockResolvedValue(mockTask);

    const result = await createTaskForUser(userId, activity, null, today);

    expect(result).toEqual(mockTask);
    expect(Task.create).toHaveBeenCalled();
  });

  it('deve aceitar atividade com data no futuro', async () => {
    const userId = 1;
    const activity = 'Estudar por 30 minutos';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const mockTask = { id: 1, userId, activity, points: 5, completed: false };

    (User.findByPk as any).mockResolvedValue({ id: userId });
    (Task.findAll as any).mockResolvedValue([]);
    (Task.create as any).mockResolvedValue(mockTask);

    const result = await createTaskForUser(userId, activity, null, tomorrow);

    expect(result).toEqual(mockTask);
    expect(Task.create).toHaveBeenCalled();
  });

  it('deve rejeitar se usuário não encontrado', async () => {

    const userId = 999;
    const activity = 'Estudar por 30 minutos';

    (User.findByPk as any).mockResolvedValue(null);


    await expect(createTaskForUser(userId, activity)).rejects.toThrow(
      new TaskServiceError('User not found', 404)
    );
  });

  it('deve rejeitar atividade vazia', async () => {

    const userId = 1;
    const activity = '   ';

    (User.findByPk as any).mockResolvedValue({ id: userId });


    await expect(createTaskForUser(userId, activity)).rejects.toThrow(
      new TaskServiceError('activity is required', 400)
    );
  });

  it('deve rejeitar terceira atividade personalizada no mesmo dia', async () => {

    const userId = 1;
    const activity = 'Fazer exercício de yoga';
    const mockTasks = [
      { id: 1, userId, activity: 'Dançar', createdAt: new Date() },
      { id: 2, userId, activity: 'Pintar', createdAt: new Date() },
    ];

    (User.findByPk as any).mockResolvedValue({ id: userId });
    (Task.findAll as any).mockResolvedValue(mockTasks);

    await expect(createTaskForUser(userId, activity)).rejects.toThrow(
      new TaskServiceError('Você atingiu o limite de 2 atividades personalizadas por hoje.', 400)
    );
  });

  it('deve rejeitar segunda ocorrência da mesma atividade padrão no mesmo dia', async () => {
    const userId = 1;
    const activity = 'Estudar por 30 minutos';
    const mockTasks = [
      { id: 1, userId, activity: 'Estudar por 30 minutos', createdAt: new Date() },
      { id: 2, userId, activity: 'Estudar por 30 minutos', createdAt: new Date() },
    ];

    (User.findByPk as any).mockResolvedValue({ id: userId });
    (Task.findAll as any).mockResolvedValue(mockTasks);

    await expect(createTaskForUser(userId, activity)).rejects.toThrow(
      new TaskServiceError('Você já realizou esta atividade 2 vezes hoje.', 400)
    );
  });

  it('deve permitir segunda ocorrência de atividade padrão se houver apenas uma hoje', async () => {
  
    const userId = 1;
    const activity = 'Estudar por 30 minutos';
    const mockTasks = [
      { id: 1, userId, activity: 'Estudar por 30 minutos', createdAt: new Date() },
    ];
    const mockTask = { id: 2, userId, activity, points: 5, completed: false };

    (User.findByPk as any).mockResolvedValue({ id: userId });
    (Task.findAll as any).mockResolvedValue(mockTasks);
    (Task.create as any).mockResolvedValue(mockTask);

    // Act
    const result = await createTaskForUser(userId, activity);

 
    expect(result).toEqual(mockTask);
    expect(Task.create).toHaveBeenCalled();
  });

  it('deve atribuir 5 pontos para atividade padrão', async () => {

    const userId = 1;
    const activity = 'Estudar por 30 minutos';

    (User.findByPk as any).mockResolvedValue({ id: userId });
    (Task.findAll as any).mockResolvedValue([]);
    (Task.create as any).mockImplementation(({ points }) => ({ id: 1, points, activity }));


    const result = await createTaskForUser(userId, activity);

    expect(result.points).toBe(5);
  });

  it('deve atribuir pontos aleatório entre 5 e 8 para atividade personalizada', async () => {

    const userId = 1;
    const activity = 'Atividade customizada aleatória';

    (User.findByPk as any).mockResolvedValue({ id: userId });
    (Task.findAll as any).mockResolvedValue([]);
    (Task.create as any).mockImplementation(({ points }) => ({ id: 1, points, activity }));


    let result = await createTaskForUser(userId, activity);

    for (let i = 0; i < 10; i++) {
      result = await createTaskForUser(userId, activity);
      expect(result.points).toBeGreaterThanOrEqual(5);
      expect(result.points).toBeLessThanOrEqual(8);
    }
  });

  it('deve incluir descrição na atividade criada', async () => {
    const userId = 1;
    const activity = 'Estudar por 30 minutos';
    const description = 'Estudar React Hooks';
    const mockTask = { id: 1, userId, activity, description, points: 5 };

    (User.findByPk as any).mockResolvedValue({ id: userId });
    (Task.findAll as any).mockResolvedValue([]);
    (Task.create as any).mockResolvedValue(mockTask);

    const result = await createTaskForUser(userId, activity, description);

    expect(result.description).toBe(description);
  });
});
