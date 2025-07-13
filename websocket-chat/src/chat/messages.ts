import type { Message } from '../types';

export class MessageStore {
  private messages = new Map<string, Message[]>();
  private messageIndex = new Map<string, Message>();

  addMessage(roomId: string, userId: string, content: string, type: Message['type'] = 'text', replyTo?: string): Message {
    const message: Message = {
      id: crypto.randomUUID(),
      roomId,
      userId,
      content,
      type,
      timestamp: new Date(),
      replyTo,
      reactions: new Map()
    };

    if (!this.messages.has(roomId)) {
      this.messages.set(roomId, []);
    }

    this.messages.get(roomId)!.push(message);
    this.messageIndex.set(message.id, message);

    this.cleanupOldMessages(roomId);
    
    return message;
  }

  getMessages(roomId: string, limit: number = 50, before?: string): Message[] {
    const roomMessages = this.messages.get(roomId) || [];
    
    let messages = roomMessages;
    
    if (before) {
      const beforeIndex = roomMessages.findIndex(m => m.id === before);
      if (beforeIndex > 0) {
        messages = roomMessages.slice(0, beforeIndex);
      }
    }

    return messages.slice(-limit).map(msg => ({
      ...msg,
      reactions: new Map(msg.reactions)
    }));
  }

  getMessage(messageId: string): Message | null {
    const message = this.messageIndex.get(messageId);
    return message ? {
      ...message,
      reactions: new Map(message.reactions)
    } : null;
  }

  editMessage(messageId: string, userId: string, newContent: string): { success: boolean; error?: string } {
    const message = this.messageIndex.get(messageId);
    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    if (message.userId !== userId) {
      return { success: false, error: 'Can only edit your own messages' };
    }

    if (message.type !== 'text') {
      return { success: false, error: 'Can only edit text messages' };
    }

    const timeDiff = Date.now() - message.timestamp.getTime();
    if (timeDiff > 300000) {
      return { success: false, error: 'Can only edit messages within 5 minutes' };
    }

    message.content = newContent;
    message.edited = new Date();
    
    return { success: true };
  }

  addReaction(messageId: string, userId: string, emoji: string): { success: boolean; error?: string } {
    const message = this.messageIndex.get(messageId);
    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    if (!message.reactions.has(emoji)) {
      message.reactions.set(emoji, []);
    }

    const users = message.reactions.get(emoji)!;
    if (!users.includes(userId)) {
      users.push(userId);
    }

    return { success: true };
  }

  removeReaction(messageId: string, userId: string, emoji: string): { success: boolean; error?: string } {
    const message = this.messageIndex.get(messageId);
    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    const users = message.reactions.get(emoji);
    if (users) {
      const index = users.indexOf(userId);
      if (index > -1) {
        users.splice(index, 1);
        if (users.length === 0) {
          message.reactions.delete(emoji);
        }
      }
    }

    return { success: true };
  }

  deleteMessage(messageId: string, userId: string, isModeratorAction: boolean = false): { success: boolean; error?: string } {
    const message = this.messageIndex.get(messageId);
    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    if (!isModeratorAction && message.userId !== userId) {
      return { success: false, error: 'Can only delete your own messages' };
    }

    const roomMessages = this.messages.get(message.roomId);
    if (roomMessages) {
      const index = roomMessages.findIndex(m => m.id === messageId);
      if (index > -1) {
        roomMessages.splice(index, 1);
      }
    }

    this.messageIndex.delete(messageId);
    return { success: true };
  }

  searchMessages(roomId: string, query: string, limit: number = 20): Message[] {
    const roomMessages = this.messages.get(roomId) || [];
    const lowerQuery = query.toLowerCase();
    
    return roomMessages
      .filter(msg => 
        msg.type === 'text' && 
        msg.content.toLowerCase().includes(lowerQuery)
      )
      .slice(-limit)
      .map(msg => ({
        ...msg,
        reactions: new Map(msg.reactions)
      }));
  }

  getMessageStats(roomId: string): { totalMessages: number; todayMessages: number; activeUsers: number } {
    const roomMessages = this.messages.get(roomId) || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMessages = roomMessages.filter(msg => msg.timestamp >= today);
    const activeUsers = new Set(roomMessages.map(msg => msg.userId));

    return {
      totalMessages: roomMessages.length,
      todayMessages: todayMessages.length,
      activeUsers: activeUsers.size
    };
  }

  private cleanupOldMessages(roomId: string, maxMessages: number = 1000): void {
    const roomMessages = this.messages.get(roomId);
    if (roomMessages && roomMessages.length > maxMessages) {
      const toRemove = roomMessages.splice(0, roomMessages.length - maxMessages);
      toRemove.forEach(msg => this.messageIndex.delete(msg.id));
    }
  }
}