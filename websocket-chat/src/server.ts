import { createServer, ServerProtocol } from 'verb';
import type { VerbRequest, VerbResponse } from 'verb';

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  users: Set<string>;
  messages: ChatMessage[];
  createdAt: Date;
}

interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  username: string;
  roomId: string;
  timestamp: Date;
  type: 'message' | 'system';
}

interface ChatUser {
  id: string;
  username: string;
  isGuest: boolean;
  joinedAt: Date;
}

interface ChatSession {
  id: string;
  userId: string;
  username: string;
  ws: any;
  currentRoom?: string;
  isGuest: boolean;
}

class ChatManager {
  private rooms = new Map<string, ChatRoom>();
  private users = new Map<string, ChatUser>();
  private sessions = new Map<string, ChatSession>();
  private typingIndicators = new Map<string, { userId: string; roomId: string; timestamp: Date }>();

  constructor() {
    this.createDefaultRooms();
    this.startTypingCleanup();
  }

  private createDefaultRooms() {
    const defaultRooms = [
      { id: 'general', name: 'General', description: 'General discussion for everyone' },
      { id: 'random', name: 'Random', description: 'Random conversations and fun topics' },
      { id: 'tech', name: 'Tech Talk', description: 'Technology and programming discussions' },
      { id: 'gaming', name: 'Gaming', description: 'Video games and gaming discussion' }
    ];

    defaultRooms.forEach(room => {
      this.rooms.set(room.id, {
        ...room,
        isPrivate: false,
        users: new Set(),
        messages: [],
        createdAt: new Date()
      });
    });
  }

  createUser(username: string, isGuest: boolean): ChatUser {
    const user: ChatUser = {
      id: crypto.randomUUID(),
      username,
      isGuest,
      joinedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  createSession(userId: string, username: string, ws: any, isGuest: boolean): ChatSession {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      userId,
      username,
      ws,
      isGuest
    };
    this.sessions.set(session.id, session);
    return session;
  }

  removeSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session && session.currentRoom) {
      this.leaveRoom(sessionId, session.currentRoom);
    }
    this.sessions.delete(sessionId);
  }

  joinRoom(sessionId: string, roomId: string): boolean {
    const session = this.sessions.get(sessionId);
    const room = this.rooms.get(roomId);
    
    if (!session || !room) return false;

    if (session.currentRoom) {
      this.leaveRoom(sessionId, session.currentRoom);
    }

    room.users.add(session.userId);
    session.currentRoom = roomId;

    this.broadcastToRoom(roomId, {
      type: 'user_joined',
      data: { username: session.username },
      timestamp: new Date()
    });

    this.broadcastRoomUsers(roomId);
    return true;
  }

  leaveRoom(sessionId: string, roomId: string) {
    const session = this.sessions.get(sessionId);
    const room = this.rooms.get(roomId);
    
    if (!session || !room) return;

    room.users.delete(session.userId);
    session.currentRoom = undefined;

    this.broadcastToRoom(roomId, {
      type: 'user_left',
      data: { username: session.username },
      timestamp: new Date()
    });

    this.broadcastRoomUsers(roomId);
  }

  sendMessage(sessionId: string, content: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.currentRoom) return false;

    const room = this.rooms.get(session.currentRoom);
    if (!room) return false;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      userId: session.userId,
      username: session.username,
      roomId: session.currentRoom,
      timestamp: new Date(),
      type: 'message'
    };

    room.messages.push(message);
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }

    this.broadcastToRoom(session.currentRoom, {
      type: 'message',
      data: message,
      timestamp: new Date()
    });

    return true;
  }

  startTyping(sessionId: string, roomId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const key = `${session.userId}-${roomId}`;
    this.typingIndicators.set(key, {
      userId: session.userId,
      roomId,
      timestamp: new Date()
    });

    this.broadcastToRoom(roomId, {
      type: 'typing_start',
      data: { username: session.username },
      timestamp: new Date()
    }, [sessionId]);
  }

  stopTyping(sessionId: string, roomId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const key = `${session.userId}-${roomId}`;
    this.typingIndicators.delete(key);

    this.broadcastToRoom(roomId, {
      type: 'typing_stop',
      data: { username: session.username },
      timestamp: new Date()
    }, [sessionId]);
  }

  private startTypingCleanup() {
    setInterval(() => {
      const now = new Date();
      for (const [key, indicator] of this.typingIndicators.entries()) {
        if (now.getTime() - indicator.timestamp.getTime() > 5000) {
          this.typingIndicators.delete(key);
          this.broadcastToRoom(indicator.roomId, {
            type: 'typing_stop',
            data: { username: this.getUsernameById(indicator.userId) },
            timestamp: new Date()
          });
        }
      }
    }, 1000);
  }

  private getUsernameById(userId: string): string {
    const user = this.users.get(userId);
    return user ? user.username : 'Unknown';
  }

  private broadcastToRoom(roomId: string, message: any, excludeSessions: string[] = []) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.currentRoom === roomId && !excludeSessions.includes(sessionId)) {
        try {
          session.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Failed to send message to session:', sessionId, error);
        }
      }
    }
  }

  private broadcastRoomUsers(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const users = Array.from(room.users).map(userId => {
      const user = this.users.get(userId);
      return user ? { id: user.id, username: user.username, isGuest: user.isGuest } : null;
    }).filter(Boolean);

    this.broadcastToRoom(roomId, {
      type: 'room_users',
      data: { roomId, users },
      timestamp: new Date()
    });
  }

  getRooms() {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      userCount: room.users.size,
      isPrivate: room.isPrivate
    }));
  }

  getRoomMessages(roomId: string, limit: number = 50) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return room.messages.slice(-limit);
  }

  findSessionByWs(ws: any): string | undefined {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.ws === ws) {
        return sessionId;
      }
    }
    return undefined;
  }
}

const chatManager = new ChatManager();

// Create WebSocket server
const app = createServer(ServerProtocol.WEBSOCKET);

// Serve static React app
app.get('/', async (req: VerbRequest, res: VerbResponse) => {
  return res.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verb Chat</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, sans-serif; height: 100vh; background: #f5f5f5; }
        .app { height: 100vh; display: flex; flex-direction: column; }
        .header { background: #2563eb; color: white; padding: 1rem; display: flex; justify-content: space-between; align-items: center; }
        .main { flex: 1; display: flex; overflow: hidden; }
        .sidebar { width: 250px; background: white; border-right: 1px solid #e5e5e5; display: flex; flex-direction: column; }
        .chat-area { flex: 1; display: flex; flex-direction: column; }
        .rooms-section, .users-section { padding: 1rem; }
        .rooms-section { border-bottom: 1px solid #e5e5e5; }
        .room, .user { padding: 0.5rem; margin: 0.25rem 0; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
        .room:hover, .user:hover { background: #f3f4f6; }
        .room.active { background: #dbeafe; border-left: 3px solid #2563eb; }
        .messages { flex: 1; padding: 1rem; overflow-y: auto; background: white; }
        .message { margin: 0.5rem 0; padding: 0.5rem; border-radius: 8px; }
        .message.own { background: #dbeafe; margin-left: 20%; }
        .message.other { background: #f3f4f6; margin-right: 20%; }
        .message.system { background: #fef3c7; text-align: center; font-style: italic; }
        .message-input { display: flex; padding: 1rem; background: white; border-top: 1px solid #e5e5e5; }
        .message-input input { flex: 1; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; margin-right: 0.5rem; }
        .message-input button { padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .message-input button:disabled { background: #9ca3af; cursor: not-allowed; }
        .typing-indicators { padding: 0.5rem 1rem; font-style: italic; color: #6b7280; min-height: 2rem; }
        .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }
        .modal-content { background: white; padding: 2rem; border-radius: 8px; min-width: 300px; }
        .modal input { width: 100%; padding: 0.5rem; margin: 0.5rem 0; border: 1px solid #d1d5db; border-radius: 4px; }
        .modal button { width: 100%; padding: 0.5rem; margin: 0.25rem 0; border: none; border-radius: 4px; cursor: pointer; }
        .modal .primary { background: #2563eb; color: white; }
        .modal .secondary { background: #6b7280; color: white; }
        .hidden { display: none !important; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect, useRef } = React;

        function App() {
            const [user, setUser] = useState(null);
            const [rooms, setRooms] = useState([]);
            const [currentRoom, setCurrentRoom] = useState(null);
            const [messages, setMessages] = useState([]);
            const [users, setUsers] = useState([]);
            const [typingUsers, setTypingUsers] = useState([]);
            const [newMessage, setNewMessage] = useState('');
            const [showLogin, setShowLogin] = useState(true);
            const [connected, setConnected] = useState(false);
            const wsRef = useRef(null);
            const messagesEndRef = useRef(null);
            const typingTimeoutRef = useRef(null);

            useEffect(() => {
                if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            }, [messages]);

            const connect = (username, isGuest = false) => {
                const ws = new WebSocket('ws://localhost:3000?username=' + encodeURIComponent(username) + '&guest=' + isGuest);
                
                ws.onopen = () => {
                    setConnected(true);
                    setUser({ username, isGuest });
                    setShowLogin(false);
                };

                ws.onmessage = (event) => {
                    const message = JSON.parse(event.data);
                    handleWebSocketMessage(message);
                };

                ws.onclose = () => {
                    setConnected(false);
                    setShowLogin(true);
                };

                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };

                wsRef.current = ws;
            };

            const handleWebSocketMessage = (message) => {
                switch (message.type) {
                    case 'rooms_list':
                        setRooms(message.data);
                        break;
                    case 'room_messages':
                        setMessages(message.data.messages || []);
                        break;
                    case 'message':
                        setMessages(prev => [...prev, message.data]);
                        break;
                    case 'room_users':
                        setUsers(message.data.users || []);
                        break;
                    case 'user_joined':
                        setMessages(prev => [...prev, {
                            id: Date.now(),
                            content: message.data.username + ' joined the room',
                            type: 'system',
                            timestamp: message.timestamp
                        }]);
                        break;
                    case 'user_left':
                        setMessages(prev => [...prev, {
                            id: Date.now(),
                            content: message.data.username + ' left the room',
                            type: 'system',
                            timestamp: message.timestamp
                        }]);
                        break;
                    case 'typing_start':
                        setTypingUsers(prev => [...prev.filter(u => u !== message.data.username), message.data.username]);
                        break;
                    case 'typing_stop':
                        setTypingUsers(prev => prev.filter(u => u !== message.data.username));
                        break;
                }
            };

            const joinRoom = (roomId) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        type: 'join_room',
                        data: { roomId }
                    }));
                    setCurrentRoom(roomId);
                    setMessages([]);
                }
            };

            const sendMessage = () => {
                if (newMessage.trim() && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        type: 'send_message',
                        data: { content: newMessage.trim() }
                    }));
                    setNewMessage('');
                    stopTyping();
                }
            };

            const startTyping = () => {
                if (wsRef.current && currentRoom) {
                    wsRef.current.send(JSON.stringify({
                        type: 'start_typing',
                        data: { roomId: currentRoom }
                    }));
                    
                    clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(stopTyping, 3000);
                }
            };

            const stopTyping = () => {
                if (wsRef.current && currentRoom) {
                    wsRef.current.send(JSON.stringify({
                        type: 'stop_typing',
                        data: { roomId: currentRoom }
                    }));
                    clearTimeout(typingTimeoutRef.current);
                }
            };

            const handleKeyPress = (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                } else {
                    startTyping();
                }
            };

            if (showLogin) {
                return <LoginModal onConnect={connect} />;
            }

            return (
                <div className="app">
                    <header className="header">
                        <h1>Verb Chat</h1>
                        <div>
                            {user?.username} {user?.isGuest && '(Guest)'} - {connected ? 'Connected' : 'Disconnected'}
                        </div>
                    </header>
                    <main className="main">
                        <aside className="sidebar">
                            <div className="rooms-section">
                                <h3>Rooms</h3>
                                {rooms.map(room => (
                                    <div
                                        key={room.id}
                                        className={'room ' + (currentRoom === room.id ? 'active' : '')}
                                        onClick={() => joinRoom(room.id)}
                                    >
                                        <strong>{room.name}</strong>
                                        <br />
                                        <small>{room.description} ({room.userCount} users)</small>
                                    </div>
                                ))}
                            </div>
                            <div className="users-section">
                                <h3>Users in Room</h3>
                                {users.map(user => (
                                    <div key={user.id} className="user">
                                        {user.username} {user.isGuest && '(Guest)'}
                                    </div>
                                ))}
                            </div>
                        </aside>
                        <div className="chat-area">
                            <div className="messages">
                                {messages.map(message => (
                                    <div
                                        key={message.id}
                                        className={'message ' + (message.type === 'system' ? 'system' : message.username === user?.username ? 'own' : 'other')}
                                    >
                                        {message.type !== 'system' && (
                                            <strong>{message.username}:</strong>
                                        )}
                                        <span> {message.content}</span>
                                        <small style={{float: 'right', opacity: 0.7}}>
                                            {new Date(message.timestamp).toLocaleTimeString()}
                                        </small>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="typing-indicators">
                                {typingUsers.length > 0 && (
                                    <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                                )}
                            </div>
                            <div className="message-input">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={currentRoom ? 'Type a message...' : 'Select a room to start chatting'}
                                    disabled={!currentRoom}
                                />
                                <button onClick={sendMessage} disabled={!currentRoom || !newMessage.trim()}>
                                    Send
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            );
        }

        function LoginModal({ onConnect }) {
            const [username, setUsername] = useState('');

            const handleLogin = () => {
                if (username.trim()) {
                    onConnect(username.trim(), false);
                }
            };

            const handleGuestLogin = () => {
                const guestName = 'Guest_' + Math.random().toString(36).substr(2, 5);
                onConnect(guestName, true);
            };

            return (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Join Chat</h2>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                            placeholder="Enter your username"
                        />
                        <button className="primary" onClick={handleLogin} disabled={!username.trim()}>
                            Join as {username || 'User'}
                        </button>
                        <button className="secondary" onClick={handleGuestLogin}>
                            Join as Guest
                        </button>
                    </div>
                </div>
            );
        }

        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>
  `);
});

// API endpoints
app.get('/api/rooms', async (req: VerbRequest, res: VerbResponse) => {
  return res.json({
    success: true,
    rooms: chatManager.getRooms()
  });
});

app.get('/health', async (req: VerbRequest, res: VerbResponse) => {
  return res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Configure WebSocket handlers separately  
app.websocket({
  open: (ws) => {
    console.log('WebSocket connection opened');
    
    try {
      // Access URL from ws.data (stored during upgrade)
      const urlString = ws.data?.url || 'ws://localhost:3000';
      const url = new URL(urlString);
      const username = url.searchParams.get('username') || 'Anonymous';
      const isGuest = url.searchParams.get('guest') === 'true';
      
      // Create user and session
      const user = chatManager.createUser(username, isGuest);
      const session = chatManager.createSession(user.id, username, ws, isGuest);
      
      console.log(`User ${username} connected (Guest: ${isGuest})`);
      
      // Send initial data
      ws.send(JSON.stringify({
        type: 'rooms_list',
        data: chatManager.getRooms(),
        timestamp: new Date()
      }));
      
    } catch (error) {
      console.error('Error setting up WebSocket connection:', error);
      // Try to create anonymous session as fallback
      const user = chatManager.createUser('Anonymous', true);
      const session = chatManager.createSession(user.id, 'Anonymous', ws, true);
      
      ws.send(JSON.stringify({
        type: 'rooms_list',
        data: chatManager.getRooms(),
        timestamp: new Date()
      }));
    }
  },

  message: (ws, message) => {
    try {
      const data = JSON.parse(message.toString());
      const sessionId = chatManager.findSessionByWs(ws);
      
      if (!sessionId) return;

      switch (data.type) {
        case 'join_room':
          const joined = chatManager.joinRoom(sessionId, data.data.roomId);
          if (joined) {
            const messages = chatManager.getRoomMessages(data.data.roomId);
            ws.send(JSON.stringify({
              type: 'room_messages',
              data: { roomId: data.data.roomId, messages },
              timestamp: new Date()
            }));
          }
          break;

        case 'send_message':
          chatManager.sendMessage(sessionId, data.data.content);
          break;

        case 'start_typing':
          chatManager.startTyping(sessionId, data.data.roomId);
          break;

        case 'stop_typing':
          chatManager.stopTyping(sessionId, data.data.roomId);
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  },

  close: (ws) => {
    const sessionId = chatManager.findSessionByWs(ws);
    if (sessionId) {
      chatManager.removeSession(sessionId);
      console.log(`Session ${sessionId} disconnected`);
    }
  }
});

// Configure server options
app.withOptions({
  port: 3000,
  hostname: 'localhost',
  development: {
    hmr: true,
    console: true
  }
});

app.listen();

console.log('🚀 WebSocket Chat Server Running');
console.log(`💬 Access at: http://localhost:3000`);
console.log('');
console.log('Features:');
console.log('  ✅ Real-time messaging');
console.log('  ✅ Multiple chat rooms');
console.log('  ✅ User presence');
console.log('  ✅ Typing indicators');
console.log('  ✅ Guest access');
console.log('  ✅ React frontend');