import type { VerbRequest, VerbResponse } from 'verb';
import { verifyAccessToken, extractTokenFromHeader } from '../auth/jwt';
import { findUserById } from '../db/users';

export const requireAuth = async (req: VerbRequest, res: VerbResponse, next: () => void) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authorization header'
      });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Access token is invalid or expired'
      });
    }

    const user = await findUserById(payload.userId);
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'Token is valid but user no longer exists'
      });
    }

    // Attach user to request (without password)
    const { password, ...userWithoutPassword } = user;
    (req as any).user = userWithoutPassword;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

export const optionalAuth = async (req: VerbRequest, res: VerbResponse, next: () => void) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        const user = await findUserById(payload.userId);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          (req as any).user = userWithoutPassword;
        }
      }
    }

    next();
  } catch (error) {
    // Silent fail for optional auth
    next();
  }
};