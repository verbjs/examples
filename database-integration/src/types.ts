export interface User {
  id: number;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  user_id: number;
  published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Comment {
  id: number;
  content: string;
  post_id: number;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithPosts extends User {
  posts: Post[];
}

export interface PostWithComments extends Post {
  comments: Comment[];
  author: Pick<User, 'id' | 'name' | 'email'>;
}

export interface CreateUserInput {
  email: string;
  name: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  user_id: number;
  published?: boolean;
}

export interface CreateCommentInput {
  content: string;
  post_id: number;
  user_id: number;
}

export interface DatabaseConfig {
  type: 'sqlite' | 'postgres';
  url?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}