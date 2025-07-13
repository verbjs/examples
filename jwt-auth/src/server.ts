import { createServer } from 'verb';
import type { VerbRequest, VerbResponse } from 'verb';
import { requireAuth, optionalAuth } from './middleware/auth';
import { register, login, refresh, logout } from './routes/auth';
import { getProfile, updateProfile, deleteProfile, getUsers, getUserById } from './routes/users';

const app = createServer();

// Public routes
app.get('/', async (req: VerbRequest, res: VerbResponse) => {
  return res.json({
    message: 'JWT Authentication API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /auth/register': 'Register a new user',
        'POST /auth/login': 'Login user',
        'POST /auth/refresh': 'Refresh access token',
        'POST /auth/logout': 'Logout user'
      },
      users: {
        'GET /users/profile': 'Get current user profile (auth required)',
        'PUT /users/profile': 'Update current user profile (auth required)',
        'DELETE /users/profile': 'Delete current user profile (auth required)',
        'GET /users': 'Get all users (auth required)',
        'GET /users/:id': 'Get user by ID (auth required)'
      }
    }
  });
});

// Health check
app.get('/health', async (req: VerbRequest, res: VerbResponse) => {
  return res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Authentication routes
app.post('/auth/register', register);
app.post('/auth/login', login);
app.post('/auth/refresh', refresh);
app.post('/auth/logout', requireAuth, logout);

// Protected user routes
app.get('/users/profile', requireAuth, getProfile);
app.put('/users/profile', requireAuth, updateProfile);
app.delete('/users/profile', requireAuth, deleteProfile);
app.get('/users', requireAuth, getUsers);
app.get('/users/:id', requireAuth, getUserById);

// Demo protected route
app.get('/protected', requireAuth, async (req: VerbRequest, res: VerbResponse) => {
  const user = (req as any).user;
  return res.json({
    message: 'This is a protected route',
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    },
    timestamp: new Date().toISOString()
  });
});

// Demo optional auth route
app.get('/optional-auth', optionalAuth, async (req: VerbRequest, res: VerbResponse) => {
  const user = (req as any).user;
  return res.json({
    message: 'This route works with or without authentication',
    authenticated: !!user,
    user: user ? {
      id: user.id,
      email: user.email,
      name: user.name
    } : null,
    timestamp: new Date().toISOString()
  });
});

const port = 3000;
app.withOptions({
  port,
  hostname: 'localhost',
  development: {
    hmr: true,
    console: true
  }
});

app.listen();

console.log('🚀 JWT Auth Server Running');
console.log(`🔐 Access at: http://localhost:${port}`);
console.log('');
console.log('Available Endpoints:');
console.log('  GET  /                     - API documentation');
console.log('  GET  /health               - Health check');
console.log('  POST /auth/register        - Register new user');
console.log('  POST /auth/login           - Login user');
console.log('  POST /auth/refresh         - Refresh access token');
console.log('  POST /auth/logout          - Logout user');
console.log('  GET  /users/profile        - Get current user profile');
console.log('  PUT  /users/profile        - Update current user profile');
console.log('  DELETE /users/profile      - Delete current user profile');
console.log('  GET  /users                - Get all users');
console.log('  GET  /users/:id            - Get user by ID');
console.log('  GET  /protected            - Protected route demo');
console.log('  GET  /optional-auth        - Optional auth route demo');