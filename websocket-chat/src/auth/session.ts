import type { User } from '../types';

export class SessionManager {
  private sessions = new Map<string, string>();
  private users = new Map<string, User>();

  generateSessionId(): string {
    return crypto.randomUUID();
  }

  createUser(username: string, isGuest: boolean = false): User {
    const user: User = {
      id: crypto.randomUUID(),
      username,
      displayName: username,
      isGuest,
      joinedAt: new Date(),
      lastSeen: new Date(),
      status: 'online'
    };

    this.users.set(user.id, user);
    return user;
  }

  createSession(user: User): string {
    const sessionId = this.generateSessionId();
    this.sessions.set(sessionId, user.id);
    return sessionId;
  }

  getUserBySession(sessionId: string): User | null {
    const userId = this.sessions.get(sessionId);
    return userId ? this.users.get(userId) || null : null;
  }

  getUserById(userId: string): User | null {
    return this.users.get(userId) || null;
  }

  updateUserStatus(userId: string, status: User['status']): void {
    const user = this.users.get(userId);
    if (user) {
      user.status = status;
      user.lastSeen = new Date();
    }
  }

  removeSession(sessionId: string): void {
    const userId = this.sessions.get(sessionId);
    if (userId) {
      this.updateUserStatus(userId, 'offline');
      this.sessions.delete(sessionId);
    }
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  getOnlineUsers(): User[] {
    return Array.from(this.users.values()).filter(u => u.status === 'online');
  }

  validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || username.trim().length === 0) {
      return { valid: false, error: 'Username is required' };
    }

    if (username.length < 2 || username.length > 20) {
      return { valid: false, error: 'Username must be 2-20 characters' };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { valid: false, error: 'Username can only contain letters, numbers, underscore, and dash' };
    }

    const existingUser = Array.from(this.users.values()).find(u => 
      u.username.toLowerCase() === username.toLowerCase()
    );

    if (existingUser) {
      return { valid: false, error: 'Username already taken' };
    }

    return { valid: true };
  }
}