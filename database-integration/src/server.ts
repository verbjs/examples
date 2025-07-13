import { createServer } from 'verb';
import type { VerbRequest, VerbResponse } from 'verb';
import { initializeDatabase, getDatabase } from './db/factory';

// Import route handlers
import {
  getUsers,
  getUserById,
  getUserWithPosts,
  createUser,
  updateUser,
  deleteUser
} from './routes/users';

import {
  getPosts,
  getPostById,
  getPostWithComments,
  createPost,
  updatePost,
  deletePost
} from './routes/posts';

const app = createServer();

// JSON body parser middleware
app.use('*', async (req: VerbRequest, res: VerbResponse, next: () => void) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const contentType = req.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const body = await req.json();
        (req as any).body = body;
      }
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON'
      });
    }
  }
  next();
});

// CORS middleware
app.use('*', async (req: VerbRequest, res: VerbResponse, next: () => void) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }
  
  next();
});

// Health check endpoint
app.get('/health', async (req: VerbRequest, res: VerbResponse) => {
  try {
    const db = await getDatabase();
    // Try a simple query to test database connection
    await db.getAllUsers();
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API documentation endpoint
app.get('/api', async (req: VerbRequest, res: VerbResponse) => {
  res.json({
    name: 'Database Integration API',
    version: '1.0.0',
    description: 'REST API demonstrating database integration with SQLite and PostgreSQL using Verb framework',
    endpoints: {
      users: {
        'GET /api/users': 'Get all users',
        'GET /api/users/:id': 'Get user by ID',
        'GET /api/users/:id/posts': 'Get user with all their posts',
        'POST /api/users': 'Create new user',
        'PUT /api/users/:id': 'Update user',
        'DELETE /api/users/:id': 'Delete user'
      },
      posts: {
        'GET /api/posts': 'Get all posts',
        'GET /api/posts/:id': 'Get post by ID',
        'GET /api/posts/:id/comments': 'Get post with all comments',
        'POST /api/posts': 'Create new post',
        'PUT /api/posts/:id': 'Update post',
        'DELETE /api/posts/:id': 'Delete post'
      },
      system: {
        'GET /health': 'Health check',
        'GET /api': 'API documentation',
        'GET /api/stats': 'Database statistics'
      }
    },
    examples: {
      createUser: {
        method: 'POST',
        url: '/api/users',
        body: {
          email: 'john@example.com',
          name: 'John Doe'
        }
      },
      createPost: {
        method: 'POST',
        url: '/api/posts',
        body: {
          title: 'My First Post',
          content: 'This is the content of my first post.',
          user_id: 1,
          published: true
        }
      }
    }
  });
});

// Database statistics endpoint
app.get('/api/stats', async (req: VerbRequest, res: VerbResponse) => {
  try {
    const db = await getDatabase();
    const users = await db.getAllUsers();
    const posts = await db.getAllPosts();
    
    const publishedPosts = posts.filter(post => post.published);
    const draftPosts = posts.filter(post => !post.published);
    
    // Get posts per user
    const userPostCounts = users.map(user => ({
      userId: user.id,
      userName: user.name,
      postCount: posts.filter(post => post.user_id === user.id).length
    }));

    res.json({
      statistics: {
        totalUsers: users.length,
        totalPosts: posts.length,
        publishedPosts: publishedPosts.length,
        draftPosts: draftPosts.length,
        userPostCounts,
        averagePostsPerUser: users.length > 0 ? (posts.length / users.length).toFixed(2) : 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// User routes
app.get('/api/users', getUsers);
app.get('/api/users/:id', getUserById);
app.get('/api/users/:id/posts', getUserWithPosts);
app.post('/api/users', createUser);
app.put('/api/users/:id', updateUser);
app.delete('/api/users/:id', deleteUser);

// Post routes
app.get('/api/posts', getPosts);
app.get('/api/posts/:id', getPostById);
app.get('/api/posts/:id/comments', getPostWithComments);
app.post('/api/posts', createPost);
app.put('/api/posts/:id', updatePost);
app.delete('/api/posts/:id', deletePost);

// Simple frontend for testing
app.get('/', async (req: VerbRequest, res: VerbResponse) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Integration Demo</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .container { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .section { border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; }
        .section h2 { margin-top: 0; color: #2c3e50; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
        .form-group input, .form-group textarea { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
        .form-group textarea { height: 100px; resize: vertical; }
        .btn { background: #3498db; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #2980b9; }
        .btn-secondary { background: #95a5a6; }
        .btn-danger { background: #e74c3c; }
        .result { margin-top: 1rem; padding: 1rem; border-radius: 4px; white-space: pre-wrap; font-family: monospace; font-size: 0.9rem; }
        .result.success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .result.error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .data-list { max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 1rem; margin-top: 1rem; }
        .data-item { padding: 0.5rem; border-bottom: 1px solid #eee; }
        .data-item:last-child { border-bottom: none; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1rem 0; }
        .stat-card { background: #f8f9fa; padding: 1rem; border-radius: 4px; text-align: center; }
        .stat-number { font-size: 2rem; font-weight: bold; color: #3498db; }
    </style>
</head>
<body>
    <h1>🗄️ Database Integration Demo</h1>
    <p>This demo showcases database integration with both SQLite and PostgreSQL using the Verb framework.</p>
    
    <div id="stats" class="stats"></div>
    
    <div class="container">
        <div class="section">
            <h2>👥 Users</h2>
            <form id="userForm">
                <div class="form-group">
                    <label>Name:</label>
                    <input type="text" id="userName" required>
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="userEmail" required>
                </div>
                <button type="submit" class="btn">Create User</button>
                <button type="button" class="btn btn-secondary" onclick="loadUsers()">Refresh Users</button>
            </form>
            <div id="userResult" class="result" style="display: none;"></div>
            <div id="usersList" class="data-list"></div>
        </div>
        
        <div class="section">
            <h2>📝 Posts</h2>
            <form id="postForm">
                <div class="form-group">
                    <label>Title:</label>
                    <input type="text" id="postTitle" required>
                </div>
                <div class="form-group">
                    <label>Content:</label>
                    <textarea id="postContent" required></textarea>
                </div>
                <div class="form-group">
                    <label>User ID:</label>
                    <input type="number" id="postUserId" required min="1">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="postPublished" checked> Published
                    </label>
                </div>
                <button type="submit" class="btn">Create Post</button>
                <button type="button" class="btn btn-secondary" onclick="loadPosts()">Refresh Posts</button>
            </form>
            <div id="postResult" class="result" style="display: none;"></div>
            <div id="postsList" class="data-list"></div>
        </div>
    </div>

    <script>
        async function apiCall(url, options = {}) {
            try {
                const response = await fetch(url, options);
                const data = await response.json();
                return { success: response.ok, data, status: response.status };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        function showResult(elementId, result) {
            const element = document.getElementById(elementId);
            element.style.display = 'block';
            element.className = \`result \${result.success ? 'success' : 'error'}\`;
            element.textContent = JSON.stringify(result, null, 2);
        }

        async function loadStats() {
            const result = await apiCall('/api/stats');
            if (result.success) {
                const stats = result.data.statistics;
                document.getElementById('stats').innerHTML = \`
                    <div class="stat-card">
                        <div class="stat-number">\${stats.totalUsers}</div>
                        <div>Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">\${stats.totalPosts}</div>
                        <div>Posts</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">\${stats.averagePostsPerUser}</div>
                        <div>Avg Posts/User</div>
                    </div>
                \`;
            }
        }

        async function loadUsers() {
            const result = await apiCall('/api/users');
            const usersList = document.getElementById('usersList');
            
            if (result.success) {
                usersList.innerHTML = result.data.data.map(user => \`
                    <div class="data-item">
                        <strong>\${user.name}</strong> - \${user.email}<br>
                        <small>ID: \${user.id} | Created: \${new Date(user.created_at).toLocaleDateString()}</small>
                    </div>
                \`).join('');
            } else {
                usersList.innerHTML = '<div class="data-item">Failed to load users</div>';
            }
            loadStats();
        }

        async function loadPosts() {
            const result = await apiCall('/api/posts');
            const postsList = document.getElementById('postsList');
            
            if (result.success) {
                postsList.innerHTML = result.data.data.map(post => \`
                    <div class="data-item">
                        <strong>\${post.title}</strong> \${post.published ? '✅' : '📝'}<br>
                        <small>By User \${post.user_id} | Created: \${new Date(post.created_at).toLocaleDateString()}</small><br>
                        <small>\${post.content.substring(0, 100)}\${post.content.length > 100 ? '...' : ''}</small>
                    </div>
                \`).join('');
            } else {
                postsList.innerHTML = '<div class="data-item">Failed to load posts</div>';
            }
            loadStats();
        }

        document.getElementById('userForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const result = await apiCall('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: document.getElementById('userName').value,
                    email: document.getElementById('userEmail').value
                })
            });
            
            showResult('userResult', result);
            if (result.success) {
                document.getElementById('userForm').reset();
                loadUsers();
            }
        });

        document.getElementById('postForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const result = await apiCall('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: document.getElementById('postTitle').value,
                    content: document.getElementById('postContent').value,
                    user_id: parseInt(document.getElementById('postUserId').value),
                    published: document.getElementById('postPublished').checked
                })
            });
            
            showResult('postResult', result);
            if (result.success) {
                document.getElementById('postForm').reset();
                loadPosts();
            }
        });

        // Load initial data
        loadUsers();
        loadPosts();
        loadStats();
    </script>
</body>
</html>`;

  res.html(html);
});

// 404 handler
app.use('*', async (req: VerbRequest, res: VerbResponse) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The endpoint ${req.method} ${req.url} was not found`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api',
      'GET /api/stats',
      'GET /api/users',
      'POST /api/users',
      'GET /api/posts',
      'POST /api/posts'
    ]
  });
});

// Initialize database and start server
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const dbType = (process.env.DB_TYPE as 'sqlite' | 'postgres') || 'sqlite';

async function startServer() {
  try {
    console.log('🔄 Initializing database...');
    await initializeDatabase(dbType);
    console.log(`✅ Database initialized (${dbType})`);
    
    app.withOptions({
      port,
      hostname: 'localhost',
      development: {
        hmr: true,
        console: true
      }
    });

    app.listen();
    
    console.log('🚀 Database Integration Server Running');
    console.log(`📊 Demo: http://localhost:${port}`);
    console.log(`🔧 API: http://localhost:${port}/api`);
    console.log(`❤️  Health: http://localhost:${port}/health`);
    console.log('');
    console.log('Environment:');
    console.log(`  Database: ${dbType.toUpperCase()}`);
    console.log(`  Port: ${port}`);
    console.log('');
    console.log('Example API calls:');
    console.log('  GET /api/users - List all users');
    console.log('  POST /api/users - Create user');
    console.log('  GET /api/posts - List all posts');
    console.log('  POST /api/posts - Create post');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Shutting down gracefully...');
  process.exit(0);
});

startServer();