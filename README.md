# Verb Framework Examples

Complete examples demonstrating the capabilities of the Verb framework for building modern web applications with Bun runtime.

## Available Examples

### [JWT Authentication](./jwt-auth/)
Complete JWT authentication system with user registration, login, token refresh, and protected routes.

**Features:**
- User registration and login
- JWT access and refresh tokens
- Protected routes with middleware
- Password hashing with bcrypt
- Type-safe API endpoints

```bash
cd jwt-auth
bun install
bun run dev
```

### [WebSocket Chat](./websocket-chat/)
Real-time chat application with rooms, authentication, and message persistence.

**Features:**
- Real-time messaging via WebSocket
- Chat rooms with join/leave
- User authentication and presence
- Typing indicators
- Message history

```bash
cd websocket-chat
bun install
bun run dev
```

### [Blog/CMS](./blog-cms/)
Full-featured blog and content management system with admin panel.

**Features:**
- Public blog interface
- Admin dashboard
- Post creation and editing
- Category and tag management
- Media library
- SEO-friendly URLs

```bash
cd blog-cms
bun install
bun run dev
```

### [E-commerce API](./ecommerce-api/)
Complete e-commerce REST API with product catalog, shopping cart, and order management.

**Features:**
- Product catalog management
- Shopping cart functionality
- Order processing
- Payment integration
- User accounts and authentication

```bash
cd ecommerce-api
bun install
bun run dev
```

### [File Upload & Storage](./file-upload-storage/)
File upload system with multiple storage providers and image processing.

**Features:**
- Multiple file upload
- Local and cloud storage
- Image resizing and optimization
- File type validation
- Storage provider abstraction

```bash
cd file-upload-storage
bun install
bun run dev
```

### [Database Integration](./database-integration/)
Database integration examples with SQLite and PostgreSQL using Bun's native APIs.

**Features:**
- SQLite with bun:sqlite
- PostgreSQL integration
- Database migrations
- Query builders
- Type-safe database operations

```bash
cd database-integration
bun install
bun run dev
```

### [Deployment](./deployment/)
Production deployment configurations for various platforms.

**Platforms:**
- Docker and Docker Compose
- Kubernetes
- Fly.io
- Railway
- Vercel

## Getting Started

1. **Choose an example** that matches your use case
2. **Navigate to the directory**: `cd example-name`
3. **Install dependencies**: `bun install`
4. **Start development server**: `bun run dev`

## Common Features Across Examples

### Built with Bun
All examples leverage Bun's native APIs and runtime features:
- **Fast startup** and execution
- **Built-in TypeScript** support
- **Native SQLite** with bun:sqlite
- **WebSocket** support
- **File operations** with Bun.file

### Type Safety
- Full TypeScript implementation
- Type-safe API endpoints
- Validated request/response schemas
- IDE autocompletion support

### Production Ready
- Error handling and validation
- Security best practices
- Environment configuration
- Logging and monitoring
- Performance optimization

### Well Documented
- Comprehensive README files
- API documentation
- Usage examples
- Architecture explanations

## Example Structure

Each example follows a consistent structure:

```
example-name/
├── README.md           # Detailed documentation
├── package.json        # Dependencies and scripts
├── src/
│   ├── server.ts      # Main server setup
│   ├── routes/        # API route handlers
│   ├── middleware/    # Custom middleware
│   ├── types.ts       # TypeScript definitions
│   └── ...            # Feature-specific modules
├── bun.lock           # Dependency lock file
└── ...                # Example-specific files
```

## Framework Features Demonstrated

### HTTP Server
- REST API endpoints
- Middleware integration
- Request/response handling
- Route parameters and queries

### WebSocket Communication
- Real-time bidirectional messaging
- Connection management
- Event-based architecture
- Authentication over WebSocket

### Database Operations
- SQLite with bun:sqlite
- PostgreSQL integration
- Migrations and seeding
- Type-safe queries

### Authentication & Security
- JWT token management
- Password hashing
- Protected routes
- Session management

### File Handling
- Upload processing
- Storage abstraction
- Image manipulation
- File validation

### Production Deployment
- Containerization
- Cloud deployment
- Environment configuration
- Process management

## Running Examples

### Development Mode
```bash
# Navigate to any example
cd jwt-auth

# Install dependencies
bun install

# Start development server with hot reload
bun run dev
```

### Production Mode
```bash
# Build for production
bun run build

# Start production server
bun run start
```

### Testing
```bash
# Run tests (where available)
bun test
```

## Contributing

When adding new examples:

1. **Follow the structure** of existing examples
2. **Include comprehensive README** with setup and usage
3. **Add TypeScript types** for all interfaces
4. **Implement error handling** and validation
5. **Use Bun native APIs** where possible
6. **Include practical features** that solve real problems

## Resources

- [Verb Framework Documentation](https://verb.codes/docs/)
- [Bun Runtime Documentation](https://bun.sh/docs)
- [Protocol Gateway Deep Dive](https://verb.codes/docs/protocol-gateway/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)

## License

All examples are MIT licensed. See [LICENSE](./LICENSE) for details.