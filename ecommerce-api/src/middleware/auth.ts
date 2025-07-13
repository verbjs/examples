import type { VerbRequest, VerbResponse } from 'verb';
import type { MemoryStore } from '../models/store';

export interface AuthenticatedRequest extends VerbRequest {
  user?: any;
}

export const createAuthMiddleware = (store: MemoryStore) => {
  return async (req: AuthenticatedRequest, res: VerbResponse, next: () => void) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.substring(7);
    const session = store.getSessionByToken(token);

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = store.getUserById(session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  };
};

export const createAdminMiddleware = () => {
  return async (req: AuthenticatedRequest, res: VerbResponse, next: () => void) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };
};

export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

export const generateToken = (): string => {
  return crypto.randomUUID() + '-' + Date.now().toString(36);
};