export interface User {
  id: string;
  username: string;
  displayName: string;
  isGuest: boolean;
  joinedAt: Date;
  lastSeen: Date;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
}

export interface Room {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  createdBy: string;
  createdAt: Date;
  maxUsers?: number;
  users: Set<string>;
  moderators: Set<string>;
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  type: 'text' | 'system' | 'private';
  timestamp: Date;
  replyTo?: string;
  reactions: Map<string, string[]>;
  edited?: Date;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
  messageId?: string;
}

export interface ChatSession {
  userId: string;
  username: string;
  rooms: Set<string>;
  lastActivity: Date;
  ws: any;
}

export interface TypingIndicator {
  userId: string;
  roomId: string;
  startedAt: Date;
}