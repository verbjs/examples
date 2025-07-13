import type { VerbRequest, VerbResponse } from 'verb';
import { findUserByEmail, createUser } from '../db/users';
import { hashPassword, comparePassword, validatePassword } from '../auth/password';
import { generateTokens, verifyRefreshToken } from '../auth/jwt';
import type { UserInput } from '../types';

export const register = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { email, password, name }: UserInput = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    // Password validation
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Password does not meet requirements',
        details: passwordErrors
      });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email address already exists'
      });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await createUser({
      email,
      password: hashedPassword,
      name
    });

    // Generate tokens
    const { password: _, ...userWithoutPassword } = user;
    const tokens = generateTokens(userWithoutPassword);

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      tokens
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
};

export const login = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { email, password }: UserInput = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate tokens
    const { password: _, ...userWithoutPassword } = user;
    const tokens = generateTokens(userWithoutPassword);

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
};

export const refresh = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Missing refresh token',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid or expired'
      });
    }

    // Find user
    const user = await findUserByEmail(payload.email);
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User associated with token no longer exists'
      });
    }

    // Generate new tokens
    const { password: _, ...userWithoutPassword } = user;
    const tokens = generateTokens(userWithoutPassword);

    res.json({
      message: 'Tokens refreshed successfully',
      tokens
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred during token refresh'
    });
  }
};

export const logout = async (req: VerbRequest, res: VerbResponse) => {
  // In a real application, you would blacklist the token
  // For now, just return success (client should delete tokens)
  res.json({
    message: 'Logout successful',
    note: 'Please remove tokens from client storage'
  });
};