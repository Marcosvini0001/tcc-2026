import { Request, Response } from 'express';
import Adm from '../models/admModels';
import { sanitizeAdmin } from '../serializers/userSerializers';
import {
  createAccessToken,
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from '../services/authService';
import { EMAIL_REGEX, normalizeEmail, normalizeText } from '../utils/validation';

export const createAdm = async (req: Request, res: Response) => {
  try {
    const name = normalizeText(req.body.name);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password ?? '');
    const adminsCount = await Adm.count();

    if (adminsCount > 0 && req.auth?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'email invalido' });
    }

    const passwordValidation = validatePasswordStrength(password);
    if (passwordValidation) {
      return res.status(400).json({ message: passwordValidation });
    }

    const existingAdm = await Adm.findOne({ where: { email } });
    if (existingAdm) {
      return res.status(409).json({ message: 'email ja cadastrado' });
    }

    const passwordHash = await hashPassword(password);
    const adm = await Adm.create({ name, email, password: passwordHash });

    return res.status(201).json({
      admin: sanitizeAdmin(adm),
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const loginAdm = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password ?? '');

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const adm = await Adm.findOne({ where: { email } });
    if (!adm) {
      return res.status(401).json({ message: 'Credenciais invalidas' });
    }

    const isPasswordValid = await verifyPassword(password, adm.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciais invalidas' });
    }

    return res.json({
      token: createAccessToken({ userId: adm.id, role: 'admin' }),
      admin: sanitizeAdmin(adm),
    });
  } catch (error) {
    console.error('Error logging in admin:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllAdms = async (req: Request, res: Response) => {
  try {
    const adms = await Adm.findAll({ order: [['name', 'ASC']] });
    return res.json(adms.map((adm) => sanitizeAdmin(adm)));
  } catch (error) {
    console.error('Error fetching admins:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdmById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adm = await Adm.findByPk(id as string);

    if (!adm) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    return res.json(sanitizeAdmin(adm));
  } catch (error) {
    console.error('Error fetching admin:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAdm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = normalizeText(req.body.name);
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    const adm = await Adm.findByPk(id as string);
    if (!adm) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'email invalido' });
    }

    if (email && email !== adm.email) {
      const existingAdm = await Adm.findOne({ where: { email } });
      if (existingAdm && existingAdm.id !== adm.id) {
        return res.status(409).json({ message: 'email ja cadastrado' });
      }
    }

    if (password) {
      const passwordValidation = validatePasswordStrength(password);
      if (passwordValidation) {
        return res.status(400).json({ message: passwordValidation });
      }

      adm.password = await hashPassword(password);
    }

    adm.name = name || adm.name;
    adm.email = email || adm.email;

    await adm.save();
    return res.json(sanitizeAdmin(adm));
  } catch (error) {
    console.error('Error updating admin:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAdm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adm = await Adm.findByPk(id as string);
    if (!adm) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    await adm.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting admin:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
