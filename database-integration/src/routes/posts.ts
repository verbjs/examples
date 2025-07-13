import type { VerbRequest, VerbResponse } from 'verb';
import { getDatabase } from '../db/factory';

export const getPosts = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { published } = req.query;
    const db = await getDatabase();
    
    let posts;
    if (published === 'true') {
      posts = await db.getPublishedPosts();
    } else {
      posts = await db.getAllPosts();
    }
    
    res.json({
      message: 'Posts retrieved successfully',
      data: posts,
      count: posts.length,
      filter: published === 'true' ? 'published only' : 'all posts'
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      error: 'Failed to retrieve posts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getPostById = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { id } = req.params;
    const postId = parseInt(id);
    
    if (isNaN(postId)) {
      return res.status(400).json({
        error: 'Invalid post ID',
        message: 'Post ID must be a valid number'
      });
    }

    const db = await getDatabase();
    const post = await db.getPostById(postId);
    
    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
        message: `Post with ID ${postId} does not exist`
      });
    }
    
    res.json({
      message: 'Post retrieved successfully',
      data: post
    });
  } catch (error) {
    console.error('Get post by ID error:', error);
    res.status(500).json({
      error: 'Failed to retrieve post',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getPostWithComments = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { id } = req.params;
    const postId = parseInt(id);
    
    if (isNaN(postId)) {
      return res.status(400).json({
        error: 'Invalid post ID',
        message: 'Post ID must be a valid number'
      });
    }

    const db = await getDatabase();
    const result = await db.getPostWithComments(postId);
    
    if (!result) {
      return res.status(404).json({
        error: 'Post not found',
        message: `Post with ID ${postId} does not exist`
      });
    }
    
    res.json({
      message: 'Post with comments retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get post with comments error:', error);
    res.status(500).json({
      error: 'Failed to retrieve post with comments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createPost = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { title, content, user_id, published } = req.body;
    
    // Validation
    if (!title || !content || !user_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title, content, and user_id are required'
      });
    }

    if (typeof user_id !== 'number' || user_id <= 0) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'user_id must be a positive number'
      });
    }

    const db = await getDatabase();
    
    // Check if user exists
    const user = await db.getUserById(user_id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `User with ID ${user_id} does not exist`
      });
    }

    const post = await db.createPost({
      title,
      content,
      user_id,
      published: published || false
    });
    
    res.status(201).json({
      message: 'Post created successfully',
      data: post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      error: 'Failed to create post',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updatePost = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { id } = req.params;
    const postId = parseInt(id);
    
    if (isNaN(postId)) {
      return res.status(400).json({
        error: 'Invalid post ID',
        message: 'Post ID must be a valid number'
      });
    }

    const { title, content, published } = req.body;
    const updates: any = {};
    
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (typeof published === 'boolean') updates.published = published;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Please provide at least one field to update'
      });
    }

    const db = await getDatabase();
    const post = await db.updatePost(postId, updates);
    
    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
        message: `Post with ID ${postId} does not exist`
      });
    }
    
    res.json({
      message: 'Post updated successfully',
      data: post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      error: 'Failed to update post',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deletePost = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { id } = req.params;
    const postId = parseInt(id);
    
    if (isNaN(postId)) {
      return res.status(400).json({
        error: 'Invalid post ID',
        message: 'Post ID must be a valid number'
      });
    }

    const db = await getDatabase();
    const deleted = await db.deletePost(postId);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Post not found',
        message: `Post with ID ${postId} does not exist`
      });
    }
    
    res.json({
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      error: 'Failed to delete post',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getPostsByUser = async (req: VerbRequest, res: VerbResponse) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);
    
    if (isNaN(userIdNum)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
    }

    const db = await getDatabase();
    const posts = await db.getPostsByUserId(userIdNum);
    
    res.json({
      message: 'User posts retrieved successfully',
      data: posts,
      count: posts.length,
      userId: userIdNum
    });
  } catch (error) {
    console.error('Get posts by user error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user posts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};