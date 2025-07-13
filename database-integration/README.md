# Database Integration Example

A comprehensive example demonstrating database integration with both SQLite and PostgreSQL using the Verb framework. This example showcases a complete REST API with CRUD operations, database migrations, and a web interface for testing.

## Features

- ✅ **Dual Database Support**: SQLite (default) and PostgreSQL
- ✅ **Complete CRUD Operations**: Users and Posts with relationships  
- ✅ **Database Abstraction**: Clean interface supporting multiple database types
- ✅ **Migrations & Seeding**: Database schema setup and sample data
- ✅ **REST API**: Full RESTful endpoints with proper error handling
- ✅ **Web Interface**: Interactive demo for testing all endpoints
- ✅ **Type Safety**: Full TypeScript integration with proper typing
- ✅ **Health Checks**: Database connection monitoring

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:id/posts` - Get user with all their posts
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Posts
- `GET /api/posts` - Get all posts  
- `GET /api/posts/:id` - Get post by ID
- `GET /api/posts/:id/comments` - Get post with all comments
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### System
- `GET /health` - Health check with database connection status
- `GET /api` - API documentation
- `GET /api/stats` - Database statistics and analytics

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Posts Table
```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Comments Table
```sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Quick Start

### SQLite (Default)
```bash
bun install
bun run seed    # Optional: Add sample data
bun run dev
```

### PostgreSQL
```bash
# Set up PostgreSQL database first
createdb verb_example

# Configure environment
export DB_TYPE=postgres
export DATABASE_URL=postgresql://username:password@localhost:5432/verb_example

bun install
bun run seed    # Optional: Add sample data  
bun run dev
```

Then visit:
- **Demo Interface**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## Environment Variables

```bash
# Database Configuration
DB_TYPE=sqlite|postgres          # Database type (default: sqlite)
DATABASE_URL=<connection_string>  # Full database connection string

# For PostgreSQL
DB_HOST=localhost                 # Database host
DB_PORT=5432                     # Database port  
DB_NAME=verb_example             # Database name
DB_USER=username                 # Database username
DB_PASSWORD=password             # Database password

# Server Configuration  
PORT=3000                        # Server port (default: 3000)
```

## Project Structure

```
src/
├── db/
│   ├── factory.ts          # Database factory and initialization
│   ├── sqlite.ts           # SQLite implementation
│   └── postgres.ts         # PostgreSQL implementation
├── routes/
│   ├── users.ts            # User CRUD operations
│   └── posts.ts            # Post CRUD operations
├── migrations/
│   └── seed.ts             # Database seeding
├── types.ts                # TypeScript type definitions
└── server.ts               # Main server with routes and UI
```

## Example Usage

### Create a User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

### Create a Post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my first post.",
    "user_id": 1,
    "published": true
  }'
```

### Get User with Posts
```bash
curl http://localhost:3000/api/users/1/posts
```

## Database Operations

### Run Migrations
```bash
bun run migrate
```

### Reset Database
```bash
bun run migrate:reset
```

### Seed Sample Data
```bash
bun run seed
```

## Architecture Notes

### Database Abstraction
The example uses a factory pattern to abstract database operations, making it easy to switch between SQLite and PostgreSQL without changing application code.

### Error Handling
Comprehensive error handling with proper HTTP status codes and descriptive error messages.

### Type Safety
Full TypeScript integration ensures type safety across database operations and API responses.

### Performance Considerations
- Connection pooling for PostgreSQL
- Proper indexing on foreign keys
- Efficient query patterns with joins

This example demonstrates how to build a production-ready API with proper database integration using the Verb framework.