# Deployment Examples

Production-ready deployment configurations for Verb applications across different platforms.

## Structure

```
deployment/
├── docker/
│   ├── Dockerfile              # Multi-stage production build
│   └── docker-compose.yml      # Complete stack with database
├── railway/
│   └── railway.toml            # Railway platform config
├── fly-io/
│   └── fly.toml                # Fly.io deployment config
├── vercel/
│   └── vercel.json             # Vercel serverless config
├── kubernetes/
│   └── deployment.yaml         # K8s deployment with health checks
└── README.md
```

## Quick Deploy

### Docker

```bash
# Local development
docker-compose up -d

# Production build
docker build -t my-verb-app .
docker run -p 3000:3000 my-verb-app
```

### Railway

```bash
# Install CLI and deploy
npm install -g @railway/cli
railway login
railway init
railway up
```

### Fly.io

```bash
# Install CLI and deploy
curl -L https://fly.io/install.sh | sh
fly auth login
fly launch
fly deploy
```

### Vercel

```bash
# Install CLI and deploy
npm install -g vercel
vercel
```

### Kubernetes

```bash
# Apply manifests
kubectl apply -f deployment.yaml

# Check status
kubectl get pods -l app=verb-app
kubectl logs -l app=verb-app
```

## Configuration

### Environment Variables

All deployments expect these environment variables:

```bash
# Required
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-jwt-secret

# Optional
REDIS_URL=redis://host:6379
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
```

### Health Checks

All configurations include health check endpoints:

- `/health` - Comprehensive readiness check
- `/health/live` - Basic liveness check
- `/health/ready` - Dependency readiness check
- `/health/startup` - Application startup check

## Platform-Specific Notes

### Docker
- Multi-stage build for minimal image size
- Non-root user for security
- Proper signal handling with dumb-init
- Health checks for container orchestration

### Railway
- Zero-config deployment
- Automatic HTTPS and custom domains
- Built-in PostgreSQL and Redis
- Environment variable management

### Fly.io
- Global edge deployment
- Automatic scaling and load balancing
- Custom regions and machine types
- Built-in metrics and logging

### Vercel
- Serverless deployment
- Automatic scaling
- Edge functions support
- Limited to HTTP protocols (no WebSockets)

### Kubernetes
- Production-grade orchestration
- Auto-scaling and self-healing
- Rolling updates and rollbacks
- Comprehensive health checking

## Security Considerations

1. **Non-root containers**: All configs run as non-root user
2. **Secret management**: Environment variables stored securely
3. **Resource limits**: CPU and memory constraints defined
4. **Network policies**: Restrict inter-pod communication
5. **Image scanning**: Scan for vulnerabilities before deploy

## Monitoring

Each deployment includes:

- **Health checks** for availability monitoring
- **Structured logging** for observability
- **Metrics endpoints** for performance monitoring
- **Error tracking** integration points

## Next Steps

1. Choose your deployment platform
2. Copy the relevant configuration files
3. Update environment variables
4. Deploy and monitor

For detailed guides, see:
- [Docker Deployment](../site/docs/deployment/docker.md)
- [Cloud Platforms](../site/docs/deployment/cloud-platforms.md)
- [Production Configuration](../site/docs/deployment/production-config.md)