import { create } from 'zustand';
import api from '../services/api';

interface Task {
  _id: string;
  titulo: string;
  descricao: string;
  xp: number;
  icone: string;
}

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/tarefas');
      set({ tasks: response.data });
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  completeTask: async (taskId: string) => {
    try {
      await api.post('/tarefas/concluir', { tarefaId: taskId });
      // Atualizar lista de tarefas ou recarregar
      await get().fetchTasks();
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
      throw error;
    }
  },
}));