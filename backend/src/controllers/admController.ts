import { Request, Response } from 'express';
import Adm from '../models/admModels';

export const createAdm = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const adm = await Adm.create({ name, email, password });
    return res.status(201).json(adm);
  } catch (error) {
    console.error('Error creating admin:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllAdms = async (req: Request, res: Response) => {
  try {
    const adms = await Adm.findAll();
    return res.json(adms);
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

    return res.json(adm);
  } catch (error) {
    console.error('Error fetching admin:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAdm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    const adm = await Adm.findByPk(id as string);
    if (!adm) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    adm.name = name ?? adm.name;
    adm.email = email ?? adm.email;
    adm.password = password ?? adm.password;

    await adm.save();
    return res.json(adm);
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
