import type { Room, User } from '../types';

export class RoomManager {
  private rooms = new Map<string, Room>();

  constructor() {
    this.createDefaultRooms();
  }

  private createDefaultRooms(): void {
    const generalRoom: Room = {
      id: 'general',
      name: 'General',
      description: 'General discussion for everyone',
      isPrivate: false,
      createdBy: 'system',
      createdAt: new Date(),
      users: new Set(),
      moderators: new Set(['system'])
    };

    const randomRoom: Room = {
      id: 'random',
      name: 'Random',
      description: 'Random conversations and off-topic chat',
      isPrivate: false,
      createdBy: 'system',
      createdAt: new Date(),
      users: new Set(),
      moderators: new Set(['system'])
    };

    this.rooms.set(generalRoom.id, generalRoom);
    this.rooms.set(randomRoom.id, randomRoom);
  }

  createRoom(name: string, description: string, createdBy: string, isPrivate: boolean = false): Room {
    const room: Room = {
      id: crypto.randomUUID(),
      name,
      description,
      isPrivate,
      createdBy,
      createdAt: new Date(),
      users: new Set(),
      moderators: new Set([createdBy])
    };

    this.rooms.set(room.id, room);
    return room;
  }

  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  getPublicRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(room => !room.isPrivate);
  }

  getUserRooms(userId: string): Room[] {
    return Array.from(this.rooms.values()).filter(room => room.users.has(userId));
  }

  joinRoom(roomId: string, userId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.maxUsers && room.users.size >= room.maxUsers) {
      return { success: false, error: 'Room is full' };
    }

    room.users.add(userId);
    return { success: true };
  }

  leaveRoom(roomId: string, userId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    room.users.delete(userId);
    return { success: true };
  }

  getRoomUsers(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.users) : [];
  }

  isUserInRoom(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.users.has(userId) : false;
  }

  isModerator(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.moderators.has(userId) : false;
  }

  addModerator(roomId: string, userId: string, requesterId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (!this.isModerator(roomId, requesterId) && room.createdBy !== requesterId) {
      return { success: false, error: 'Only moderators can add moderators' };
    }

    room.moderators.add(userId);
    return { success: true };
  }

  removeModerator(roomId: string, userId: string, requesterId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.createdBy !== requesterId) {
      return { success: false, error: 'Only room creator can remove moderators' };
    }

    if (userId === room.createdBy) {
      return { success: false, error: 'Cannot remove room creator as moderator' };
    }

    room.moderators.delete(userId);
    return { success: true };
  }

  deleteRoom(roomId: string, requesterId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.createdBy !== requesterId) {
      return { success: false, error: 'Only room creator can delete the room' };
    }

    if (['general', 'random'].includes(roomId)) {
      return { success: false, error: 'Cannot delete default rooms' };
    }

    this.rooms.delete(roomId);
    return { success: true };
  }
}