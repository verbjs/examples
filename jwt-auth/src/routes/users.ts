import type { VerbRequest, VerbResponse } from 'verb';
import { getAllUsers, findUserById, deleteUser, updateUser } from '../db/users';
import { hashPassword, validatePassword } from '../auth/password';

export const getProfile = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const user = (req as any).user;
    
    res.json({
      message: 'Profile retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'An error occurred while retrieving profile'
    });
  }
};

export const updateProfile = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const user = (req as any).user;
    const { name, email, password } = req.body;
    
    const updates: any = {};
    
    if (name) updates.name = name;
    if (email) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email',
          message: 'Please provide a valid email address'
        });
      }
      updates.email = email.toLowerCase();
    }
    
    if (password) {
      // Password validation
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        return res.status(400).json({
          error: 'Invalid password',
          message: 'Password does not meet requirements',
          details: passwordErrors
        });
      }
      updates.password = await hashPassword(password);
    }

    const updatedUser = await updateUser(user.id, updates);
    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User could not be found for update'
      });
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    
    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: 'An error occurred while updating profile'
    });
  }
};

export const deleteProfile = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const user = (req as any).user;
    
    const deleted = await deleteUser(user.id);
    if (!deleted) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User could not be found for deletion'
      });
    }
    
    res.json({
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({
      error: 'Failed to delete profile',
      message: 'An error occurred while deleting profile'
    });
  }
};

export const getUsers = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const users = await getAllUsers();
    
    res.json({
      message: 'Users retrieved successfully',
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      message: 'An error occurred while retrieving users'
    });
  }
};

export const getUserById = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { id } = req.params;
    
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with the specified ID was not found'
      });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'User retrieved successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: 'An error occurred while retrieving user'
    });
  }
};