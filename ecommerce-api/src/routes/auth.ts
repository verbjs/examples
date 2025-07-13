import { createServer } from 'verb';
import type { VerbRequest, VerbResponse } from 'verb';
import type { MemoryStore } from '../models/store';
import { hashPassword, verifyPassword, generateToken, createAuthMiddleware, type AuthenticatedRequest } from '../middleware/auth';

export const createAuthRoutes = (store: MemoryStore) => {
  const app = createServer();
  const authMiddleware = createAuthMiddleware(store);

  app.post('/api/auth/register', async (req: VerbRequest, res: VerbResponse) => {
    try {
      const { email, password, firstName, lastName } = await req.json();

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const existingUser = store.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      const hashedPassword = await hashPassword(password);
      const user = store.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'customer'
      });

      const token = generateToken();
      const session = store.createSession({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token: session.token
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Registration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/auth/login', async (req: VerbRequest, res: VerbResponse) => {
    try {
      const { email, password } = await req.json();

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = store.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken();
      const session = store.createSession({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token: session.token
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/auth/logout', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        store.deleteSession(token);
      }

      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      return res.status(500).json({
        error: 'Logout failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/auth/profile', authMiddleware, async (req: AuthenticatedRequest, res: VerbResponse) => {
    return res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        createdAt: req.user.createdAt
      }
    });
  });

  return app;
};