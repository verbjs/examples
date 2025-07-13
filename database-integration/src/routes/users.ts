import type { VerbRequest, VerbResponse } from 'verb';
import { getDatabase } from '../db/factory';

export const getUsers = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const db = await getDatabase();
    const users = await db.getAllUsers();
    
    res.json({
      message: 'Users retrieved successfully',
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to retrieve users',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getUserById = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
    }

    const db = await getDatabase();
    const user = await db.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `User with ID ${userId} does not exist`
      });
    }
    
    res.json({
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getUserWithPosts = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
    }

    const db = await getDatabase();
    const result = await db.getUserWithPosts(userId);
    
    if (!result) {
      return res.status(404).json({
        error: 'User not found',
        message: `User with ID ${userId} does not exist`
      });
    }
    
    res.json({
      message: 'User with posts retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get user with posts error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user with posts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createUser = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { email, name } = req.body;
    
    // Validation
    if (!email || !name) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and name are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    const db = await getDatabase();
    
    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    const user = await db.createUser({ email, name });
    
    res.status(201).json({
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateUser = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
    }

    const { email, name } = req.body;
    const updates: any = {};
    
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
      }
      updates.email = email;
    }
    
    if (name) {
      updates.name = name;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Please provide at least one field to update'
      });
    }

    const db = await getDatabase();
    const user = await db.updateUser(userId, updates);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `User with ID ${userId} does not exist`
      });
    }
    
    res.json({
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteUser = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
    }

    const db = await getDatabase();
    const deleted = await db.deleteUser(userId);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'User not found',
        message: `User with ID ${userId} does not exist`
      });
    }
    
    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};