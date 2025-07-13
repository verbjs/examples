# JWT Authentication Example

A complete JWT authentication system built with Verb framework, featuring user registration, login, token refresh, and protected routes.

## Features

- ✅ **User Registration** with email validation and strong password requirements
- ✅ **User Login** with bcrypt password hashing
- ✅ **JWT Access Tokens** (15 minutes expiry)
- ✅ **JWT Refresh Tokens** (7 days expiry)
- ✅ **Protected Routes** with authentication middleware
- ✅ **Optional Authentication** middleware for flexible routes
- ✅ **User Profile Management** (view, update, delete)
- ✅ **Password Security** with bcrypt and validation rules
- ✅ **Error Handling** with detailed error messages
- ✅ **Type Safety** with TypeScript throughout

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Server will start on http://localhost:3000
```

## API Endpoints

### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API documentation |
| GET | `/health` | Health check |
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/refresh` | Refresh access token |

### Protected Routes (Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/logout` | Logout user |
| GET | `/users/profile` | Get current user profile |
| PUT | `/users/profile` | Update current user profile |
| DELETE | `/users/profile` | Delete current user profile |
| GET | `/users` | Get all users |
| GET | `/users/:id` | Get user by ID |
| GET | `/protected` | Demo protected route |

### Optional Authentication Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/optional-auth` | Works with or without auth |

## Usage Examples

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "email": "john@example.com",
    "name": "John Doe",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 3. Access Protected Route

```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Refresh Token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 5. Update Profile

```bash
curl -X PUT http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com"
  }'
```

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character

## Security Features

### Token Security
- **Access tokens** expire in 15 minutes (short-lived)
- **Refresh tokens** expire in 7 days (long-lived)
- Different secrets for access and refresh tokens
- Bearer token authentication

### Password Security
- **bcrypt** hashing with 12 salt rounds
- Strong password validation
- No plain text password storage

### Request Validation
- Email format validation
- Required field validation
- Type safety with TypeScript
- Detailed error messages

## Environment Variables

Create a `.env` file in the project root:

```bash
# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Server Port
PORT=3000
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": ["Additional error details if applicable"]
}
```

### Common Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found (user/resource not found)
- `409` - Conflict (user already exists)
- `500` - Internal Server Error

## Testing

Test the authentication flow:

```bash
# 1. Register a user
curl -X POST localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# 2. Login (save the access token)
curl -X POST localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# 3. Access protected route
curl -X GET localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 4. Test without token (should fail)
curl -X GET localhost:3000/protected
```

## Database

This example uses an in-memory database for simplicity. In production, replace the `src/db/users.ts` module with a real database integration like:

- SQLite with Bun's built-in SQLite
- PostgreSQL with `pg` or Prisma
- MongoDB with Mongoose
- Any database with appropriate TypeScript types

## Production Considerations

1. **Database**: Replace in-memory storage with persistent database
2. **Secrets**: Use strong, unique JWT secrets from environment variables
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Add rate limiting for login attempts
5. **Token Blacklisting**: Implement token blacklisting for logout
6. **Email Verification**: Add email verification for registration
7. **Password Reset**: Implement password reset functionality
8. **Logging**: Add proper logging and monitoring
9. **CORS**: Configure CORS for frontend integration

## Integration with Frontend

This API works with any frontend framework. Example with fetch:

```javascript
// Login
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { tokens } = await response.json();

// Store tokens
localStorage.setItem('accessToken', tokens.accessToken);
localStorage.setItem('refreshToken', tokens.refreshToken);

// Make authenticated requests
const authResponse = await fetch('/users/profile', {
  headers: { 
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}` 
  }
});
```

## Architecture

```
src/
├── auth/           # Authentication utilities
│   ├── jwt.ts      # JWT token functions
│   └── password.ts # Password hashing & validation
├── db/             # Database layer
│   └── users.ts    # User CRUD operations
├── middleware/     # Express middleware
│   └── auth.ts     # Authentication middleware
├── routes/         # Route handlers
│   ├── auth.ts     # Auth endpoints
│   └── users.ts    # User endpoints
├── types.ts        # TypeScript type definitions
└── server.ts       # Main server setup
```

This example demonstrates how to build secure, production-ready authentication with Verb framework while maintaining clean architecture and type safety.