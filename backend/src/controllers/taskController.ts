import { Response } from 'express';
import Task from '../models/taskModel';
import TaskHistory from '../models/taskHistoryModel';
import User from '../models/userModel';
import { AuthRequest } from '../middleware/authMiddleware';
import { calcularNivel } from '../utils/calculateLevel';

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};

export const completeTask = async (req: AuthRequest, res: Response) => {
  try {
    const { tarefaId } = req.body;
    const userId = req.userId!;

    const task = await Task.findById(tarefaId);
    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Criar histórico
    const history = new TaskHistory({
      usuario: userId,
      tarefa: tarefaId,
      xpGanho: task.xp,
    });
    await history.save();

    // Atualizar usuário
    user.xp += task.xp;
    user.nivel = calcularNivel(user.xp);
    user.tarefasConcluidas.push(history._id);
    await user.save();

    res.json({ message: 'Tarefa concluída!', xpGanho: task.xp, novoXp: user.xp, novoNivel: user.nivel });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};