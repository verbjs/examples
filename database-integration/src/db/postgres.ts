import postgres from 'postgres';
import type { User, Post, Comment, CreateUserInput, CreatePostInput, CreateCommentInput, DatabaseConfig } from '../types';

export class PostgreSQLDatabase {
  private sql: any;

  constructor(config: DatabaseConfig) {
    if (config.url) {
      this.sql = postgres(config.url);
    } else {
      this.sql = postgres({
        host: config.host || 'localhost',
        port: config.port || 5432,
        database: config.database || 'verb_example',
        username: config.username || 'postgres',
        password: config.password || 'password'
      });
    }
    
    console.log('✅ PostgreSQL connection established');
  }

  async init() {
    try {
      // Create users table
      await this.sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create posts table
      await this.sql`
        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          published BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `;

      // Create comments table
      await this.sql`
        CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          post_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `;

      // Create indexes
      await this.sql`CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id)`;
      await this.sql`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id)`;
      await this.sql`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id)`;

      console.log('✅ PostgreSQL database initialized');
    } catch (error) {
      console.error('❌ PostgreSQL initialization failed:', error);
      throw error;
    }
  }

  // User operations
  async createUser(data: CreateUserInput): Promise<User> {
    const [user] = await this.sql`
      INSERT INTO users (email, name)
      VALUES (${data.email}, ${data.name})
      RETURNING *
    `;
    return user;
  }

  async getUserById(id: number): Promise<User | null> {
    const [user] = await this.sql`
      SELECT * FROM users WHERE id = ${id}
    `;
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await this.sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    return user || null;
  }

  async getAllUsers(): Promise<User[]> {
    return await this.sql`
      SELECT * FROM users ORDER BY created_at DESC
    `;
  }

  async updateUser(id: number, data: Partial<CreateUserInput>): Promise<User | null> {
    const [user] = await this.sql`
      UPDATE users 
      SET ${this.sql(data, 'email', 'name')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return user || null;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.sql`
      DELETE FROM users WHERE id = ${id}
    `;
    return result.count > 0;
  }

  // Post operations
  async createPost(data: CreatePostInput): Promise<Post> {
    const [post] = await this.sql`
      INSERT INTO posts (title, content, user_id, published)
      VALUES (${data.title}, ${data.content}, ${data.user_id}, ${data.published || false})
      RETURNING *
    `;
    return post;
  }

  async getPostById(id: number): Promise<Post | null> {
    const [post] = await this.sql`
      SELECT * FROM posts WHERE id = ${id}
    `;
    return post || null;
  }

  async getAllPosts(): Promise<Post[]> {
    return await this.sql`
      SELECT * FROM posts ORDER BY created_at DESC
    `;
  }

  async getPostsByUserId(userId: number): Promise<Post[]> {
    return await this.sql`
      SELECT * FROM posts WHERE user_id = ${userId} ORDER BY created_at DESC
    `;
  }

  async updatePost(id: number, data: Partial<CreatePostInput>): Promise<Post | null> {
    const [post] = await this.sql`
      UPDATE posts 
      SET ${this.sql(data, 'title', 'content', 'published')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return post || null;
  }

  async deletePost(id: number): Promise<boolean> {
    const result = await this.sql`
      DELETE FROM posts WHERE id = ${id}
    `;
    return result.count > 0;
  }

  // Comment operations
  async createComment(data: CreateCommentInput): Promise<Comment> {
    const [comment] = await this.sql`
      INSERT INTO comments (content, post_id, user_id)
      VALUES (${data.content}, ${data.post_id}, ${data.user_id})
      RETURNING *
    `;
    return comment;
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return await this.sql`
      SELECT * FROM comments WHERE post_id = ${postId} ORDER BY created_at ASC
    `;
  }

  async deleteComment(id: number): Promise<boolean> {
    const result = await this.sql`
      DELETE FROM comments WHERE id = ${id}
    `;
    return result.count > 0;
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
    return await this.sql`
      SELECT * FROM posts WHERE published = TRUE ORDER BY created_at DESC
    `;
  }

  // Statistics
  async getStats() {
    const [stats] = await this.sql`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM posts) as posts,
        (SELECT COUNT(*) FROM comments) as comments,
        (SELECT COUNT(*) FROM posts WHERE published = TRUE) as published_posts
    `;

    return {
      users: parseInt(stats.users),
      posts: parseInt(stats.posts),
      comments: parseInt(stats.comments),
      publishedPosts: parseInt(stats.published_posts)
    };
  }

  // Transaction example
  async createUserWithPost(userData: CreateUserInput, postData: Omit<CreatePostInput, 'user_id'>) {
    return await this.sql.begin(async (sql: any) => {
      const [user] = await sql`
        INSERT INTO users (email, name)
        VALUES (${userData.email}, ${userData.name})
        RETURNING *
      `;

      const [post] = await sql`
        INSERT INTO posts (title, content, user_id, published)
        VALUES (${postData.title}, ${postData.content}, ${user.id}, ${postData.published || false})
        RETURNING *
      `;

      return { user, post };
    });
  }

  async close() {
    await this.sql.end();
  }
}