import { Database } from 'bun:sqlite';
import type { User, Post, Comment, CreateUserInput, CreatePostInput, CreateCommentInput } from '../types';

export class SQLiteDatabase {
  private db: Database;

  constructor(path: string = './database.sqlite') {
    this.db = new Database(path);
    this.initSync();
  }

  private initSync() {
    // Create users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create posts table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        published BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create comments table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    this.db.run('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id)');

    console.log('✅ SQLite database initialized');
  }

  async init() {
    // For SQLite, initialization is already done synchronously in constructor
    // This method exists to satisfy the Database interface
    return Promise.resolve();
  }

  // User operations
  async createUser(data: CreateUserInput): Promise<User> {
    const stmt = this.db.prepare(`
      INSERT INTO users (email, name)
      VALUES (?, ?)
      RETURNING *
    `);
    
    return stmt.get(data.email, data.name) as User;
  }

  async getUserById(id: number): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | null;
  }

  async getAllUsers(): Promise<User[]> {
    const stmt = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all() as User[];
  }

  async updateUser(id: number, data: Partial<CreateUserInput>): Promise<User | null> {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    
    const stmt = this.db.prepare(`
      UPDATE users 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `);
    
    return stmt.get(...values, id) as User | null;
  }

  async deleteUser(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Post operations
  async createPost(data: CreatePostInput): Promise<Post> {
    const stmt = this.db.prepare(`
      INSERT INTO posts (title, content, user_id, published)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `);
    
    return stmt.get(
      data.title, 
      data.content, 
      data.user_id, 
      data.published || false
    ) as Post;
  }

  async getPostById(id: number): Promise<Post | null> {
    const stmt = this.db.prepare('SELECT * FROM posts WHERE id = ?');
    return stmt.get(id) as Post | null;
  }

  async getAllPosts(): Promise<Post[]> {
    const stmt = this.db.prepare('SELECT * FROM posts ORDER BY created_at DESC');
    return stmt.all() as Post[];
  }

  async getPostsByUserId(userId: number): Promise<Post[]> {
    const stmt = this.db.prepare('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) as Post[];
  }

  async updatePost(id: number, data: Partial<CreatePostInput>): Promise<Post | null> {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    
    const stmt = this.db.prepare(`
      UPDATE posts 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `);
    
    return stmt.get(...values, id) as Post | null;
  }

  async deletePost(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM posts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Comment operations
  async createComment(data: CreateCommentInput): Promise<Comment> {
    const stmt = this.db.prepare(`
      INSERT INTO comments (content, post_id, user_id)
      VALUES (?, ?, ?)
      RETURNING *
    `);
    
    return stmt.get(data.content, data.post_id, data.user_id) as Comment;
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    const stmt = this.db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC');
    return stmt.all(postId) as Comment[];
  }

  async deleteComment(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM comments WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Complex queries
  async getUserWithPosts(userId: number): Promise<{ user: User; posts: Post[] } | null> {
    const user = await this.getUserById(userId);
    if (!user) return null;

    const posts = await this.getPostsByUserId(userId);
    return { user, posts };
  }

  async getPostWithComments(postId: number): Promise<{ post: Post; comments: Comment[]; author: User } | null> {
    const post = await this.getPostById(postId);
    if (!post) return null;

    const author = await this.getUserById(post.user_id);
    if (!author) return null;

    const comments = await this.getCommentsByPostId(postId);
    
    return { post, comments, author };
  }

  async getPublishedPosts(): Promise<Post[]> {
    const stmt = this.db.prepare('SELECT * FROM posts WHERE published = TRUE ORDER BY created_at DESC');
    return stmt.all() as Post[];
  }

  // Statistics
  async getStats() {
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const postCount = this.db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number };
    const commentCount = this.db.prepare('SELECT COUNT(*) as count FROM comments').get() as { count: number };
    const publishedCount = this.db.prepare('SELECT COUNT(*) as count FROM posts WHERE published = TRUE').get() as { count: number };

    return {
      users: userCount.count,
      posts: postCount.count,
      comments: commentCount.count,
      publishedPosts: publishedCount.count
    };
  }

  // Transaction example
  async createUserWithPost(userData: CreateUserInput, postData: Omit<CreatePostInput, 'user_id'>) {
    const transaction = this.db.transaction(() => {
      const user = this.createUser(userData);
      const post = this.createPost({ ...postData, user_id: user.id });
      return { user, post };
    });

    return transaction();
  }

  close() {
    this.db.close();
  }
}