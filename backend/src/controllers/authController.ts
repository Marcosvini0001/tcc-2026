import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';

export const register = async (req: Request, res: Response) => {
  try {
    const { nome, email, senha } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const user = new User({
      nome,
      email,
      senha: hashedPassword,
      xp: 0,
      nivel: 1,
      amigos: [],
      tarefasConcluidas: [],
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user._id, nome, email, xp: 0, nivel: 1 } });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas.' });
    }

    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, nome: user.nome, email, xp: user.xp, nivel: user.nivel } });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};