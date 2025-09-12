# Deployment Guide

## Overview

This guide covers various deployment strategies for the Bitbucket MCP Server, including containerization, cloud deployment, and production considerations.

## Prerequisites

- Node.js 18+ runtime
- Docker (for containerized deployment)
- Access to Bitbucket Cloud or Data Center
- Proper network connectivity and firewall rules

## Environment Setup

### 1. Environment Variables

Create a `.env` file with the following variables:

```bash
# Bitbucket Configuration
BITBUCKET_BASE_URL=https://api.bitbucket.org
BITBUCKET_USERNAME=your_username
BITBUCKET_PASSWORD=your_password
# or
BITBUCKET_TOKEN=your_api_token

# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Performance
BITBUCKET_TIMEOUT_REQUEST=30000
BITBUCKET_TIMEOUT_CONNECTION=10000
BITBUCKET_RATE_LIMIT_REQUESTS_PER_MINUTE=60
BITBUCKET_RATE_LIMIT_BURST_LIMIT=10

# Retry Configuration
BITBUCKET_RETRY_MAX_ATTEMPTS=3
BITBUCKET_RETRY_BASE_DELAY=1000
BITBUCKET_RETRY_MAX_DELAY=10000
BITBUCKET_RETRY_BACKOFF_MULTIPLIER=2
```

### 2. Configuration File

Create a `config.json` file for advanced configuration:

```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "cors": {
      "origin": ["https://your-domain.com"],
      "credentials": true
    }
  },
  "bitbucket": {
    "baseUrl": "https://api.bitbucket.org",
    "auth": {
      "type": "basic",
      "credentials": {
        "username": "your_username",
        "password": "your_password"
      }
    },
    "serverType": "auto",
    "timeouts": {
      "request": 30000,
      "connection": 10000
    },
    "retry": {
      "maxAttempts": 3,
      "baseDelay": 1000,
      "maxDelay": 10000,
      "backoffMultiplier": 2
    },
    "rateLimit": {
      "requestsPerMinute": 60,
      "burstLimit": 10
    }
  },
  "logging": {
    "level": "info",
    "format": "json",
    "transports": [
      {
        "type": "console"
      },
      {
        "type": "file",
        "filename": "logs/app.log",
        "maxSize": "10m",
        "maxFiles": 5
      }
    ]
  },
  "monitoring": {
    "healthCheck": {
      "enabled": true,
      "path": "/health"
    },
    "metrics": {
      "enabled": true,
      "path": "/metrics"
    }
  }
}
```

## Docker Deployment

### 1. Dockerfile

```dockerfile
# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY dist/ ./dist/
COPY config.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/scripts/health-check.js

# Start the application
CMD ["node", "dist/server/index.js"]
```

### 2. Docker Compose

```yaml
version: '3.8'

services:
  bitbucket-mcp-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - BITBUCKET_BASE_URL=${BITBUCKET_BASE_URL}
      - BITBUCKET_USERNAME=${BITBUCKET_USERNAME}
      - BITBUCKET_PASSWORD=${BITBUCKET_PASSWORD}
    volumes:
      - ./logs:/app/logs
      - ./config.json:/app/config.json
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "dist/scripts/health-check.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: Add reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - bitbucket-mcp-server
    restart: unless-stopped
```

### 3. Build and Deploy

```bash
# Build the Docker image
docker build -t bitbucket-mcp-server .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f bitbucket-mcp-server

# Scale the service
docker-compose up -d --scale bitbucket-mcp-server=3
```

## Cloud Deployment

### 1. AWS ECS

#### Task Definition

```json
{
  "family": "bitbucket-mcp-server",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "bitbucket-mcp-server",
      "image": "your-account.dkr.ecr.region.amazonaws.com/bitbucket-mcp-server:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "BITBUCKET_USERNAME",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:bitbucket/username"
        },
        {
          "name": "BITBUCKET_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:bitbucket/password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bitbucket-mcp-server",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "node dist/scripts/health-check.js"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### 2. Google Cloud Run

#### Cloud Run Configuration

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: bitbucket-mcp-server
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/execution-environment: gen2
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        autoscaling.knative.dev/minScale: "1"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
      - image: gcr.io/your-project/bitbucket-mcp-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: BITBUCKET_USERNAME
          valueFrom:
            secretKeyRef:
              name: bitbucket-secrets
              key: username
        - name: BITBUCKET_PASSWORD
          valueFrom:
            secretKeyRef:
              name: bitbucket-secrets
              key: password
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
          requests:
            cpu: "0.5"
            memory: "256Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 3. Azure Container Instances

#### Azure CLI Deployment

```bash
# Create resource group
az group create --name bitbucket-mcp-rg --location eastus

# Deploy container instance
az container create \
  --resource-group bitbucket-mcp-rg \
  --name bitbucket-mcp-server \
  --image your-registry.azurecr.io/bitbucket-mcp-server:latest \
  --cpu 1 \
  --memory 1 \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    BITBUCKET_BASE_URL=https://api.bitbucket.org \
  --secure-environment-variables \
    BITBUCKET_USERNAME=your_username \
    BITBUCKET_PASSWORD=your_password \
  --restart-policy Always
```

## Kubernetes Deployment

### 1. Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bitbucket-mcp-server
  labels:
    app: bitbucket-mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bitbucket-mcp-server
  template:
    metadata:
      labels:
        app: bitbucket-mcp-server
    spec:
      containers:
      - name: bitbucket-mcp-server
        image: your-registry/bitbucket-mcp-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: BITBUCKET_BASE_URL
          value: "https://api.bitbucket.org"
        envFrom:
        - secretRef:
            name: bitbucket-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: config-volume
          mountPath: /app/config.json
          subPath: config.json
      volumes:
      - name: config-volume
        configMap:
          name: bitbucket-mcp-config
---
apiVersion: v1
kind: Service
metadata:
  name: bitbucket-mcp-server-service
spec:
  selector:
    app: bitbucket-mcp-server
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 2. ConfigMap and Secrets

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bitbucket-mcp-config
data:
  config.json: |
    {
      "server": {
        "port": 3000,
        "host": "0.0.0.0"
      },
      "logging": {
        "level": "info",
        "format": "json"
      }
    }
---
apiVersion: v1
kind: Secret
metadata:
  name: bitbucket-secrets
type: Opaque
data:
  username: <base64-encoded-username>
  password: <base64-encoded-password>
```

## Production Considerations

### 1. Security

- Use secrets management for sensitive data
- Enable HTTPS/TLS encryption
- Implement proper authentication and authorization
- Regular security updates and vulnerability scanning
- Network security groups and firewall rules

### 2. Monitoring and Logging

- Centralized logging with ELK stack or similar
- Application performance monitoring (APM)
- Health checks and alerting
- Metrics collection and dashboards
- Error tracking and reporting

### 3. Scalability

- Horizontal scaling with load balancers
- Auto-scaling based on metrics
- Database connection pooling
- Caching strategies
- CDN for static assets

### 4. Backup and Recovery

- Regular backups of configuration and data
- Disaster recovery procedures
- High availability setup
- Data retention policies
- Recovery time objectives (RTO) and recovery point objectives (RPO)

### 5. Performance Optimization

- Resource limits and requests
- CPU and memory optimization
- Network optimization
- Database query optimization
- Caching implementation

## Health Checks

### 1. Application Health Check

```typescript
// src/scripts/health-check.ts
import axios from 'axios';

const healthCheck = async () => {
  try {
    const response = await axios.get('http://localhost:3000/health', {
      timeout: 5000
    });
    
    if (response.status === 200) {
      console.log('Health check passed');
      process.exit(0);
    } else {
      console.log('Health check failed');
      process.exit(1);
    }
  } catch (error) {
    console.log('Health check failed:', error.message);
    process.exit(1);
  }
};

healthCheck();
```

### 2. Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/scripts/health-check.js
```

## Troubleshooting

### Common Issues

1. **Container won't start**: Check logs and environment variables
2. **Health checks failing**: Verify application is listening on correct port
3. **Memory issues**: Adjust memory limits and optimize application
4. **Network connectivity**: Check firewall rules and network configuration
5. **Authentication failures**: Verify credentials and network access

### Debug Commands

```bash
# Check container logs
docker logs bitbucket-mcp-server

# Execute commands in running container
docker exec -it bitbucket-mcp-server sh

# Check resource usage
docker stats bitbucket-mcp-server

# Inspect container configuration
docker inspect bitbucket-mcp-server
```

## Maintenance

### 1. Updates

- Regular dependency updates
- Security patches
- Application version updates
- Infrastructure updates

### 2. Monitoring

- Performance metrics
- Error rates
- Resource utilization
- User activity

### 3. Backup

- Configuration backups
- Data backups
- Disaster recovery testing
- Documentation updates
