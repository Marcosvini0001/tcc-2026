import { Response } from 'express';
import User from '../models/userModel';
import { AuthRequest } from '../middleware/authMiddleware';

export const getRanking = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const friends = await User.find({ _id: { $in: user.amigos } }).select('nome nivel xp').sort({ xp: -1 });
    const ranking = friends.map((friend, index) => ({
      rank: index + 1,
      nome: friend.nome,
      nivel: friend.nivel,
      xp: friend.xp,
      pontosGain: '+65', // Placeholder, pode ser calculado baseado em histórico recente
    }));

    res.json(ranking);
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};