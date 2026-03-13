import { Response } from 'express';
import User from '../models/userModel';
import { AuthRequest } from '../middleware/authMiddleware';

export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { nome } = req.query;
    const users = await User.find({ nome: { $regex: nome, $options: 'i' } }).select('nome email nivel xp');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};

export const addFriend = async (req: AuthRequest, res: Response) => {
  try {
    const { amigoId } = req.body;
    const userId = req.userId!;

    const user = await User.findById(userId);
    const friend = await User.findById(amigoId);

    if (!user || !friend) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    if (user.amigos.includes(amigoId)) {
      return res.status(400).json({ message: 'Já é amigo.' });
    }

    user.amigos.push(amigoId);
    await user.save();

    res.json({ message: 'Amigo adicionado!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};

export const getFriends = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).populate('amigos', 'nome nivel xp');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.json(user.amigos);
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};