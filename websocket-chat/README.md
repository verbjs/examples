# WebSocket Chat with Rooms and Authentication

A real-time chat application demonstrating WebSocket communication, room management, and user authentication with Verb.

## Features

- ✅ Real-time messaging with WebSocket
- ✅ User authentication (guest and registered users)
- ✅ Chat rooms with join/leave functionality
- ✅ Private messaging between users
- ✅ Message history persistence
- ✅ Online user presence
- ✅ Typing indicators
- ✅ Message reactions and replies
- ✅ Room moderation (kick, ban, mute)

## Architecture

- **WebSocket Server**: Handles real-time connections
- **Authentication**: Session-based auth with guest support
- **Room Management**: Create, join, leave rooms
- **Message Store**: In-memory message persistence
- **User Presence**: Track online/offline status

## Quick Start

```bash
bun install
bun run dev
```

Visit http://localhost:3000 to start chatting!

## WebSocket Events

### Client to Server
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send a message
- `start_typing` - Indicate typing
- `stop_typing` - Stop typing indicator
- `private_message` - Send private message

### Server to Client
- `room_joined` - Confirmation of room join
- `room_left` - Confirmation of room leave
- `new_message` - New message received
- `user_joined` - User joined room
- `user_left` - User left room
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `private_message` - Private message received