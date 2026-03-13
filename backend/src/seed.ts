import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './models/taskModel';

dotenv.config();

const seedTasks = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neuroxp');

  const tasks = [
    { titulo: 'Treinar durante 30 min', descricao: 'Complete 30 minutos de treinamento físico', xp: 50, icone: '🎤' },
    { titulo: 'Acordar antes das 7h', descricao: 'Acorde antes das 7 horas da manhã', xp: 50, icone: '🕐' },
    { titulo: 'Estudar por 1 hora', descricao: 'Dedique 1 hora ao estudo', xp: 50, icone: '📋' },
    { titulo: 'Ler por 20 min', descricao: 'Leia por pelo menos 20 minutos', xp: 50, icone: '📖' },
  ];

  for (const task of tasks) {
    const existing = await Task.findOne({ titulo: task.titulo });
    if (!existing) {
      await Task.create(task);
      console.log(`Tarefa criada: ${task.titulo}`);
    }
  }

  console.log('Seed concluído');
  process.exit();
};

seedTasks();