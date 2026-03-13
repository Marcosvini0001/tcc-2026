import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface User {
  id: string;
  nome: string;
  email: string;
  xp: number;
  nivel: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  login: async (email: string, senha: string) => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      const { token, user } = response.data;
      await AsyncStorage.setItem('token', token);
      set({ user, token });
    } catch (error) {
      throw error;
    }
  },

  register: async (nome: string, email: string, senha: string) => {
    try {
      const response = await api.post('/auth/register', { nome, email, senha });
      const { token, user } = response.data;
      await AsyncStorage.setItem('token', token);
      set({ user, token });
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await api.get('/user/profile');
        set({ user: response.data, token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      await AsyncStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false });
    }
  },
}));