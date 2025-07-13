import { SQLiteDatabase } from './sqlite';
import { PostgreSQLDatabase } from './postgres';
import type { DatabaseConfig } from '../types';

export interface Database {
  // User operations
  createUser(data: any): Promise<any>;
  getUserById(id: number): Promise<any>;
  getUserByEmail(email: string): Promise<any>;
  getAllUsers(): Promise<any[]>;
  updateUser(id: number, data: any): Promise<any>;
  deleteUser(id: number): Promise<boolean>;

  // Post operations
  createPost(data: any): Promise<any>;
  getPostById(id: number): Promise<any>;
  getAllPosts(): Promise<any[]>;
  getPostsByUserId(userId: number): Promise<any[]>;
  updatePost(id: number, data: any): Promise<any>;
  deletePost(id: number): Promise<boolean>;

  // Comment operations
  createComment(data: any): Promise<any>;
  getCommentsByPostId(postId: number): Promise<any[]>;
  deleteComment(id: number): Promise<boolean>;

  // Complex operations
  getUserWithPosts(userId: number): Promise<any>;
  getPostWithComments(postId: number): Promise<any>;
  getPublishedPosts(): Promise<any[]>;
  getStats(): Promise<any>;
  createUserWithPost(userData: any, postData: any): Promise<any>;

  // Database management
  close?(): void | Promise<void>;
  init?(): Promise<void>;
}

export class DatabaseFactory {
  static async create(config?: DatabaseConfig): Promise<Database> {
    const dbType = config?.type || process.env.DB_TYPE || 'sqlite';

    switch (dbType) {
      case 'sqlite': {
        const dbPath = process.env.SQLITE_PATH || './database.sqlite';
        const db = new SQLiteDatabase(dbPath);
        return db;
      }

      case 'postgres': {
        const dbConfig: DatabaseConfig = {
          type: 'postgres',
          url: process.env.DATABASE_URL || config?.url,
          host: config?.host || process.env.DB_HOST || 'localhost',
          port: config?.port || parseInt(process.env.DB_PORT || '5432'),
          database: config?.database || process.env.DB_NAME || 'verb_example',
          username: config?.username || process.env.DB_USER || 'postgres',
          password: config?.password || process.env.DB_PASSWORD || 'password'
        };

        const db = new PostgreSQLDatabase(dbConfig);
        await db.init();
        return db;
      }

      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }
}

// Singleton instance
let dbInstance: Database | null = null;

export const getDatabase = async (): Promise<Database> => {
  if (!dbInstance) {
    dbInstance = await DatabaseFactory.create();
  }
  return dbInstance;
};

export const closeDatabase = async (): Promise<void> => {
  if (dbInstance && dbInstance.close) {
    await dbInstance.close();
    dbInstance = null;
  }
};

export const initializeDatabase = async (dbType?: 'sqlite' | 'postgres'): Promise<Database> => {
  const config: DatabaseConfig = {
    type: dbType || (process.env.DB_TYPE as 'sqlite' | 'postgres') || 'sqlite'
  };
  
  console.log(`Initializing ${config.type} database...`);
  dbInstance = await DatabaseFactory.create(config);
  
  // Initialize if needed
  if (dbInstance.init) {
    await dbInstance.init();
  }
  
  console.log(`${config.type} database initialized successfully`);
  return dbInstance;
};