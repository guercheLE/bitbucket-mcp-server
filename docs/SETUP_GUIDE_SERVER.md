# 🖥️ Server Setup Guide

This comprehensive guide provides detailed instructions for setting up the Bitbucket MCP Server in various server environments, including production deployments, containerized environments, and cloud platforms. Perfect for DevOps teams and system administrators.

## Table of Contents

- [Server Requirements](#server-requirements)
- [Production Deployment](#production-deployment)
- [Container Deployment](#container-deployment)
- [Cloud Platform Deployment](#cloud-platform-deployment)
- [Load Balancing and Scaling](#load-balancing-and-scaling)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Security Configuration](#security-configuration)
- [Performance Optimization](#performance-optimization)
- [Maintenance and Updates](#maintenance-and-updates)

## 📋 Server Requirements

### Hardware Requirements

#### Minimum Requirements

- **CPU**: 2 cores, 2.0 GHz
- **Memory**: 2 GB RAM
- **Storage**: 10 GB available disk space
- **Network**: 100 Mbps connection

#### Recommended Requirements

- **CPU**: 4 cores, 3.0 GHz
- **Memory**: 8 GB RAM
- **Storage**: 50 GB SSD
- **Network**: 1 Gbps connection

#### High-Performance Requirements

- **CPU**: 8+ cores, 3.5 GHz
- **Memory**: 16+ GB RAM
- **Storage**: 100+ GB NVMe SSD
- **Network**: 10 Gbps connection
- **Load Balancer**: Hardware or software load balancer
- **CDN**: Content delivery network for global distribution

### Software Requirements

#### Operating System

- **Linux**: Ubuntu 20.04+, CentOS 8+, RHEL 8+, Debian 11+, Alpine Linux 3.15+
- **Windows**: Windows Server 2019+, Windows 10+
- **macOS**: macOS 11+ (for development)
- **Container**: Docker 20.10+, Podman 3.0+

#### Runtime Environment

- **Node.js**: Version 18.0.0 or higher (LTS recommended)
- **npm**: Version 8.0.0 or higher
- **Git**: Version 2.30+ (for development)
- **PM2**: Process manager for production (optional)
- **Nginx**: Reverse proxy and load balancer (optional)

#### System Dependencies

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y curl wget git build-essential

# CentOS/RHEL
sudo yum update
sudo yum install -y curl wget git gcc-c++ make

# Windows (PowerShell)
# Install Chocolatey first, then:
choco install nodejs git
```

## 🚀 Production Deployment

### System User Setup

#### Create Dedicated User

```bash
# Create system user
sudo useradd -r -s /bin/false -m -d /opt/bitbucket-mcp-server bitbucket-mcp-server

# Create application directory
sudo mkdir -p /opt/bitbucket-mcp-server
sudo chown bitbucket-mcp-server:bitbucket-mcp-server /opt/bitbucket-mcp-server

# Set up home directory
sudo mkdir -p /home/bitbucket-mcp-server
sudo chown bitbucket-mcp-server:bitbucket-mcp-server /home/bitbucket-mcp-server
```

#### Configure Permissions

```bash
# Set up log directory
sudo mkdir -p /var/log/bitbucket-mcp-server
sudo chown bitbucket-mcp-server:bitbucket-mcp-server /var/log/bitbucket-mcp-server

# Set up configuration directory
sudo mkdir -p /etc/bitbucket-mcp-server
sudo chown bitbucket-mcp-server:bitbucket-mcp-server /etc/bitbucket-mcp-server

# Set up data directory
sudo mkdir -p /var/lib/bitbucket-mcp-server
sudo chown bitbucket-mcp-server:bitbucket-mcp-server /var/lib/bitbucket-mcp-server
```

### Installation

#### Download and Install

```bash
# Switch to application user
sudo su - bitbucket-mcp-server

# Download and install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Bitbucket MCP Server
npm install -g @guerchele/bitbucket-mcp-server

# Verify installation
bitbucket-mcp-server --version
```

#### Configuration Setup

```bash
# Create configuration file
sudo nano /etc/bitbucket-mcp-server/.env

# Add your configuration
ATLASSIAN_USER_EMAIL=your_email@company.com
ATLASSIAN_API_TOKEN=your_token
TRANSPORT_MODE=http
PORT=3000
DEBUG=false
LOG_LEVEL=info
```

### System Service Setup

#### Create Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/bitbucket-mcp-server.service
```

#### Service Configuration

```ini
[Unit]
Description=Bitbucket MCP Server
Documentation=https://github.com/guercheLE/bitbucket-mcp-server
After=network.target

[Service]
Type=simple
User=bitbucket-mcp-server
Group=bitbucket-mcp-server
WorkingDirectory=/opt/bitbucket-mcp-server
Environment=NODE_ENV=production
EnvironmentFile=/etc/bitbucket-mcp-server/.env
ExecStart=/usr/bin/bitbucket-mcp-server
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=bitbucket-mcp-server

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/bitbucket-mcp-server /var/lib/bitbucket-mcp-server

[Install]
WantedBy=multi-user.target
```

#### Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable bitbucket-mcp-server

# Start service
sudo systemctl start bitbucket-mcp-server

# Check status
sudo systemctl status bitbucket-mcp-server

# View logs
sudo journalctl -u bitbucket-mcp-server -f
```

### Reverse Proxy Setup

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/bitbucket-mcp-server
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy configuration
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
}
```

#### Apache Configuration

```apache
# /etc/apache2/sites-available/bitbucket-mcp-server.conf
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com

    # SSL configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/your-domain.crt
    SSLCertificateKeyFile /etc/ssl/private/your-domain.key

    # Security headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

    # Proxy configuration
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    # Rate limiting
    <Location />
        SetOutputFilter RATE_LIMIT
        SetEnv rate-limit 10
    </Location>
</VirtualHost>
```

## 🐳 Container Deployment

### Docker Setup

#### Dockerfile

```dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bitbucket-mcp-server -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY --chown=bitbucket-mcp-server:nodejs . .

# Build the application
RUN npm run build

# Create necessary directories
RUN mkdir -p /app/logs /app/data && \
    chown -R bitbucket-mcp-server:nodejs /app

# Switch to non-root user
USER bitbucket-mcp-server

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  bitbucket-mcp-server:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - ATLASSIAN_USER_EMAIL=${ATLASSIAN_USER_EMAIL}
      - ATLASSIAN_API_TOKEN=${ATLASSIAN_API_TOKEN}
      - TRANSPORT_MODE=http
      - DEBUG=false
      - LOG_LEVEL=info
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - bitbucket-mcp-server-network

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - bitbucket-mcp-server
    restart: unless-stopped
    networks:
      - bitbucket-mcp-server-network

networks:
  bitbucket-mcp-server-network:
    driver: bridge

volumes:
  logs:
  data:
```

### Kubernetes Deployment

#### Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: bitbucket-mcp-server
  labels:
    name: bitbucket-mcp-server
```

#### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bitbucket-mcp-server-config
  namespace: bitbucket-mcp-server
data:
  TRANSPORT_MODE: 'http'
  PORT: '3000'
  DEBUG: 'false'
  LOG_LEVEL: 'info'
  NODE_ENV: 'production'
```

#### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: bitbucket-mcp-server-secrets
  namespace: bitbucket-mcp-server
type: Opaque
stringData:
  ATLASSIAN_USER_EMAIL: 'your_email@company.com'
  ATLASSIAN_API_TOKEN: 'your_token'
```

#### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bitbucket-mcp-server
  namespace: bitbucket-mcp-server
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
          image: bitbucket-mcp-server:latest
          ports:
            - containerPort: 3000
          env:
            - name: ATLASSIAN_USER_EMAIL
              valueFrom:
                secretKeyRef:
                  name: bitbucket-mcp-server-secrets
                  key: ATLASSIAN_USER_EMAIL
            - name: ATLASSIAN_API_TOKEN
              valueFrom:
                secretKeyRef:
                  name: bitbucket-mcp-server-secrets
                  key: ATLASSIAN_API_TOKEN
          envFrom:
            - configMapRef:
                name: bitbucket-mcp-server-config
          resources:
            requests:
              memory: '512Mi'
              cpu: '250m'
            limits:
              memory: '1Gi'
              cpu: '500m'
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
            - name: logs
              mountPath: /app/logs
            - name: data
              mountPath: /app/data
      volumes:
        - name: logs
          emptyDir: {}
        - name: data
          emptyDir: {}
```

#### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: bitbucket-mcp-server-service
  namespace: bitbucket-mcp-server
spec:
  selector:
    app: bitbucket-mcp-server
  ports:
    - port: 3000
      targetPort: 3000
      protocol: TCP
  type: ClusterIP
```

#### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bitbucket-mcp-server-ingress
  namespace: bitbucket-mcp-server
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/rate-limit: '10'
spec:
  tls:
    - hosts:
        - your-domain.com
      secretName: bitbucket-mcp-server-tls
  rules:
    - host: your-domain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: bitbucket-mcp-server-service
                port:
                  number: 3000
```

## ☁️ Cloud Platform Deployment

### AWS Deployment

#### EC2 Setup

```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-12345678 \
  --subnet-id subnet-12345678 \
  --user-data file://user-data.sh
```

#### ECS Task Definition

```json
{
  "family": "bitbucket-mcp-server",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
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
        },
        {
          "name": "TRANSPORT_MODE",
          "value": "http"
        }
      ],
      "secrets": [
        {
          "name": "ATLASSIAN_USER_EMAIL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:bitbucket-mcp-server/email"
        },
        {
          "name": "ATLASSIAN_API_TOKEN",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:bitbucket-mcp-server/token"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bitbucket-mcp-server",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Azure Deployment

#### Container Instances

```yaml
apiVersion: 2018-10-01
location: eastus
name: bitbucket-mcp-server
properties:
  containers:
    - name: bitbucket-mcp-server
      properties:
        image: your-registry.azurecr.io/bitbucket-mcp-server:latest
        ports:
          - port: 3000
            protocol: TCP
        environmentVariables:
          - name: NODE_ENV
            value: production
          - name: TRANSPORT_MODE
            value: http
        resources:
          requests:
            cpu: 1.0
            memoryInGb: 1.5
  osType: Linux
  restartPolicy: Always
  ipAddress:
    type: Public
    ports:
      - protocol: TCP
        port: 3000
    dnsNameLabel: bitbucket-mcp-server
```

### Google Cloud Deployment

#### Cloud Run

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: bitbucket-mcp-server
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: '10'
        run.googleapis.com/cpu-throttling: 'false'
    spec:
      containerConcurrency: 100
      containers:
        - image: gcr.io/your-project/bitbucket-mcp-server:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: TRANSPORT_MODE
              value: http
          resources:
            limits:
              cpu: '1'
              memory: '1Gi'
```

## ⚖️ Load Balancing and Scaling

### Horizontal Scaling

#### Auto Scaling Configuration

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: bitbucket-mcp-server-hpa
  namespace: bitbucket-mcp-server
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: bitbucket-mcp-server
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

#### Load Balancer Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: bitbucket-mcp-server-lb
  namespace: bitbucket-mcp-server
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: 'nlb'
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: 'true'
spec:
  type: LoadBalancer
  selector:
    app: bitbucket-mcp-server
  ports:
    - port: 80
      targetPort: 3000
      protocol: TCP
    - port: 443
      targetPort: 3000
      protocol: TCP
```

### Vertical Scaling

#### Resource Limits

```yaml
resources:
  requests:
    memory: '512Mi'
    cpu: '250m'
  limits:
    memory: '2Gi'
    cpu: '1000m'
```

#### Performance Tuning

```env
# Node.js performance tuning
NODE_OPTIONS="--max-old-space-size=1536"
UV_THREADPOOL_SIZE=16
```

## 📊 Monitoring and Logging

### Application Monitoring

#### Prometheus Configuration

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'bitbucket-mcp-server'
      static_configs:
      - targets: ['bitbucket-mcp-server-service:3000']
      metrics_path: /metrics
      scrape_interval: 5s
```

#### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Bitbucket MCP Server",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

### Logging Configuration

#### Centralized Logging

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         1
        Log_Level     info
        Daemon        off
        Parsers_File  parsers.conf
        HTTP_Server   On
        HTTP_Listen   0.0.0.0
        HTTP_Port     2020

    [INPUT]
        Name              tail
        Path              /var/log/containers/bitbucket-mcp-server*.log
        Parser            docker
        Tag               bitbucket-mcp-server
        Refresh_Interval  5

    [OUTPUT]
        Name  es
        Match *
        Host  elasticsearch.logging.svc.cluster.local
        Port  9200
        Index bitbucket-mcp-server-logs
```

#### Log Rotation

```bash
# /etc/logrotate.d/bitbucket-mcp-server
/var/log/bitbucket-mcp-server/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 bitbucket-mcp-server bitbucket-mcp-server
    postrotate
        systemctl reload bitbucket-mcp-server
    endscript
}
```

## 💾 Backup and Recovery

### Data Backup

#### Database Backup (if applicable)

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backup/bitbucket-mcp-server"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup configuration
cp -r /etc/bitbucket-mcp-server $BACKUP_DIR/config_$DATE

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz /var/log/bitbucket-mcp-server

# Backup data
tar -czf $BACKUP_DIR/data_$DATE.tar.gz /var/lib/bitbucket-mcp-server

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -type f -mtime +30 -delete
```

#### Automated Backup

```bash
# Add to crontab
0 2 * * * /opt/bitbucket-mcp-server/scripts/backup.sh
```

### Disaster Recovery

#### Recovery Procedures

```bash
#!/bin/bash
# recovery.sh
BACKUP_DIR="/backup/bitbucket-mcp-server"
LATEST_BACKUP=$(ls -t $BACKUP_DIR | head -1)

# Stop service
systemctl stop bitbucket-mcp-server

# Restore configuration
cp -r $BACKUP_DIR/$LATEST_BACKUP/config/* /etc/bitbucket-mcp-server/

# Restore data
tar -xzf $BACKUP_DIR/$LATEST_BACKUP/data.tar.gz -C /

# Restore logs
tar -xzf $BACKUP_DIR/$LATEST_BACKUP/logs.tar.gz -C /

# Start service
systemctl start bitbucket-mcp-server
```

## 🔒 Security Configuration

### Network Security

#### Firewall Rules

```bash
# UFW configuration
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw deny 3000/tcp   # Block direct access to app port
ufw enable
```

#### SSL/TLS Configuration

```bash
# Generate SSL certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/bitbucket-mcp-server.key \
  -out /etc/ssl/certs/bitbucket-mcp-server.crt
```

### Application Security

#### Security Headers

```typescript
// Security middleware
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

#### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

app.use(limiter);
```

## ⚡ Performance Optimization

### Node.js Optimization

#### Memory Management

```bash
# Increase memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# Enable garbage collection logging
export NODE_OPTIONS="--trace-gc"
```

#### Cluster Mode

```typescript
import cluster from 'cluster';
import os from 'os';

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', worker => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  // Start the application
  startServer();
}
```

### Database Optimization

#### Connection Pooling

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Caching

#### Redis Configuration

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});
```

## 🔧 Maintenance and Updates

### Update Procedures

#### Rolling Updates

```bash
#!/bin/bash
# rolling-update.sh
NEW_VERSION=$1

# Build new image
docker build -t bitbucket-mcp-server:$NEW_VERSION .

# Update deployment
kubectl set image deployment/bitbucket-mcp-server bitbucket-mcp-server=bitbucket-mcp-server:$NEW_VERSION

# Wait for rollout
kubectl rollout status deployment/bitbucket-mcp-server

# Verify deployment
kubectl get pods -l app=bitbucket-mcp-server
```

#### Blue-Green Deployment

```bash
#!/bin/bash
# blue-green-deploy.sh
NEW_VERSION=$1

# Deploy to green environment
kubectl apply -f k8s/green-deployment.yaml

# Wait for green to be ready
kubectl wait --for=condition=available deployment/bitbucket-mcp-server-green

# Switch traffic to green
kubectl patch service bitbucket-mcp-server-service -p '{"spec":{"selector":{"version":"green"}}}'

# Clean up blue environment
kubectl delete deployment bitbucket-mcp-server-blue
```

### Health Checks

#### Application Health Check

```typescript
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version,
  };

  res.status(200).json(health);
});
```

#### System Health Check

```bash
#!/bin/bash
# health-check.sh
HEALTH_URL="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "Health check passed"
    exit 0
else
    echo "Health check failed with status: $RESPONSE"
    exit 1
fi
```

### Monitoring Scripts

#### Performance Monitoring

```bash
#!/bin/bash
# monitor.sh
while true; do
    # Check CPU usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)

    # Check memory usage
    MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f"), $3/$2 * 100.0}')

    # Check disk usage
    DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | cut -d'%' -f1)

    # Log metrics
    echo "$(date): CPU: ${CPU_USAGE}%, Memory: ${MEMORY_USAGE}%, Disk: ${DISK_USAGE}%"

    sleep 60
done
```

## 🎯 Best Practices Summary

### Production Checklist

- [ ] **Security**: SSL/TLS enabled, firewall configured, security headers set
- [ ] **Monitoring**: Health checks, metrics collection, alerting configured
- [ ] **Backup**: Automated backups, disaster recovery plan tested
- [ ] **Scaling**: Load balancer configured, auto-scaling enabled
- [ ] **Logging**: Centralized logging, log rotation configured
- [ ] **Updates**: Rolling update strategy, rollback plan ready
- [ ] **Performance**: Resource limits set, caching configured
- [ ] **Documentation**: Runbooks updated, team trained

### Quick Deployment Commands

```bash
# Docker deployment
docker-compose up -d

# Kubernetes deployment
kubectl apply -f k8s/

# Systemd service
sudo systemctl enable bitbucket-mcp-server
sudo systemctl start bitbucket-mcp-server

# Health check
curl http://localhost:3000/health
```

This comprehensive server setup guide provides everything needed to deploy the Bitbucket MCP Server in production environments. Choose the deployment method that best fits your infrastructure and requirements.

For additional support and advanced configurations, refer to the [Troubleshooting Guide](TROUBLESHOOTING.md) and [Security Guide](SECURITY.md).
