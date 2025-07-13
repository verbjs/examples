import type { User, UserInput } from '../types';

// In-memory database (replace with real database in production)
const users: User[] = [];

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
};

export const findUserById = async (id: string): Promise<User | null> => {
  return users.find(user => user.id === id) || null;
};

export const createUser = async (userData: UserInput): Promise<User> => {
  const user: User = {
    id: crypto.randomUUID(),
    email: userData.email.toLowerCase(),
    password: userData.password,
    name: userData.name || userData.email.split('@')[0],
    createdAt: new Date()
  };
  
  users.push(user);
  return user;
};

export const getAllUsers = async (): Promise<Omit<User, 'password'>[]> => {
  return users.map(({ password, ...user }) => user);
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const index = users.findIndex(user => user.id === id);
  if (index === -1) return false;
  
  users.splice(index, 1);
  return true;
};

export const updateUser = async (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> => {
  const userIndex = users.findIndex(user => user.id === id);
  if (userIndex === -1) return null;
  
  users[userIndex] = { ...users[userIndex], ...updates };
  return users[userIndex];
};