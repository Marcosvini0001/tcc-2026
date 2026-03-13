import { Response } from 'express';
import User from '../models/userModel';
import { AuthRequest } from '../middleware/authMiddleware';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).populate('amigos', 'nome nivel xp').populate('tarefasConcluidas');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.json({
      id: user._id,
      nome: user.nome,
      email: user.email,
      xp: user.xp,
      nivel: user.nivel,
      amigos: user.amigos,
      tarefasConcluidas: user.tarefasConcluidas,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};
