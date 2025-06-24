# Production Deployment Guide

## Overview

This guide covers deploying the Personal Status Tracker application to production with comprehensive security, monitoring, and scalability features.

## Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+ recommended)
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: Minimum 10GB, Recommended 50GB+ (for logs and backups)
- **CPU**: Minimum 2 cores
- **Network**: HTTPS certificate (Let's Encrypt recommended)

### Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Git
- OpenSSL (for certificate generation)

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/personal-status-tracker.git
cd personal-status-tracker
```

### 2. Configure Environment
```bash
# Copy and customize environment file
cp .env.production.example .env.production

# Generate secure secrets
openssl rand -base64 64  # Use for JWT_SECRET
openssl rand -base64 64  # Use for SESSION_SECRET

# Edit the environment file
nano .env.production
```

### 3. Configure SSL/TLS (Recommended)
```bash
# Create SSL directory
mkdir -p nginx/ssl

# Option A: Use Let's Encrypt (recommended)
certbot certonly --standalone -d yourdomain.com

# Option B: Generate self-signed certificate (development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/private.key \
  -out nginx/ssl/cert.pem
```

### 4. Deploy Application
```bash
# Build and start all services
docker-compose up -d

# Verify deployment
docker-compose ps
```

### 5. Create Admin User
```bash
# Access the API container
docker exec -it status-tracker-api sh

# Run admin creation script
node dist/scripts/createAdmin.js
```

## Detailed Configuration

### Environment Variables

#### Critical Security Settings
```bash
# MUST be changed from defaults
JWT_SECRET=your-super-secret-64-character-jwt-key-change-this-in-production
SESSION_SECRET=your-super-secret-64-character-session-key-change-this-too

# Domain configuration
ALLOWED_ORIGINS=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com

# Force secure cookies
COOKIE_SECURE=true
TRUST_PROXY=true
FORCE_HTTPS=true
```

#### Performance Tuning
```bash
# Adjust based on your server specs
API_RATE_LIMIT_MAX_REQUESTS=100  # Requests per window
API_RATE_LIMIT_WINDOW_MS=900000  # 15 minutes

# Database optimization
DB_CONNECTION_TIMEOUT=30000
DB_QUERY_TIMEOUT=10000

# Server timeouts
REQUEST_TIMEOUT=30000
KEEP_ALIVE_TIMEOUT=65000
```

### Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Upstream servers
    upstream api_backend {
        server api:3001;
    }

    upstream frontend_backend {
        server frontend:3000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/private.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Auth routes with stricter limits
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://api_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://api_backend;
            access_log off;
        }

        # Frontend
        location / {
            proxy_pass http://frontend_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Database Management

### Backup Strategy
```bash
# Automated backups are configured in docker-compose.yml
# Manual backup:
docker exec status-tracker-api node dist/scripts/backup.js

# Restore from backup:
docker exec status-tracker-api node dist/scripts/restore.js /path/to/backup.db
```

### Database Optimization
```bash
# Run optimization (should be done weekly)
docker exec status-tracker-api node -e "
const { optimizedDatabase } = require('./dist/models/optimizedDatabase');
optimizedDatabase.optimize().then(() => console.log('Optimization complete'));
"
```

## Monitoring & Observability

### Health Checks
```bash
# Check application health
curl https://yourdomain.com/health

# Check detailed metrics (admin token required)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     https://yourdomain.com/metrics
```

### Log Management
```bash
# View application logs
docker-compose logs -f api

# View nginx logs
docker-compose logs -f nginx

# Check log sizes
docker exec status-tracker-api du -sh /app/logs/

# Rotate logs (if not using log rotation)
docker exec status-tracker-api logrotate /etc/logrotate.conf
```

### Performance Monitoring

Enable Prometheus and Grafana:
```bash
# Start with monitoring
docker-compose --profile monitoring up -d

# Access Grafana dashboard
open https://yourdomain.com:3003
# Login: admin / your-grafana-password
```

## Security Hardening

### System Level
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Disable password authentication (use SSH keys)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart ssh
```

### Application Level
```bash
# Rotate secrets periodically
openssl rand -base64 64  # New JWT_SECRET
openssl rand -base64 64  # New SESSION_SECRET

# Update environment and restart
docker-compose down
# Update .env.production
docker-compose up -d
```

### SSL/TLS Maintenance
```bash
# Auto-renew Let's Encrypt certificates
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet && docker-compose restart nginx
```

## Scaling & Performance

### Horizontal Scaling
```bash
# Scale API instances
docker-compose up -d --scale api=3

# Update nginx upstream configuration for load balancing
```

### Database Optimization
```bash
# Monitor slow queries
docker exec status-tracker-api tail -f /app/logs/app.log | grep "Slow Database Query"

# Analyze database performance
docker exec status-tracker-api sqlite3 /app/data/production.db ".schema"
```

## Backup & Recovery

### Automated Backups
The system automatically:
- Creates daily database backups
- Uploads to S3 (if configured)
- Retains backups for 7 days
- Monitors backup success

### Disaster Recovery
```bash
# 1. Stop services
docker-compose down

# 2. Restore database
cp backup/production.db.backup.YYYY-MM-DD data/production.db

# 3. Restore logs (if needed)
cp -r backup/logs/* logs/

# 4. Start services
docker-compose up -d
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker-compose logs api

# Verify environment variables
docker exec status-tracker-api env | grep -E "(JWT_SECRET|SESSION_SECRET)"

# Check database permissions
docker exec status-tracker-api ls -la /app/data/
```

#### High Memory Usage
```bash
# Check container stats
docker stats

# Restart specific service
docker-compose restart api

# Adjust memory limits in docker-compose.yml
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Test SSL configuration
ssl-checker yourdomain.com

# Renew Let's Encrypt certificate
certbot renew --dry-run
```

### Performance Issues
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/health

# Monitor rate limiting
docker-compose logs nginx | grep "limiting requests"

# Database performance
docker exec status-tracker-api sqlite3 /app/data/production.db "PRAGMA table_info(status_entries);"
```

## Maintenance

### Regular Tasks

#### Daily
- Monitor logs for errors
- Check system resource usage
- Verify backups completed

#### Weekly
- Review security logs
- Update system packages
- Database optimization
- Certificate expiry check

#### Monthly
- Rotate application secrets
- Security audit
- Performance review
- Backup verification

### Update Procedure
```bash
# 1. Backup current state
docker exec status-tracker-api node dist/scripts/backup.js

# 2. Pull latest code
git pull origin main

# 3. Rebuild containers
docker-compose build --no-cache

# 4. Deploy with zero downtime
docker-compose up -d

# 5. Verify deployment
curl https://yourdomain.com/health
```

## Support & Maintenance

### Log Analysis
```bash
# Security events
docker exec status-tracker-api grep "Security Event" /app/logs/app.log

# Error summary
docker exec status-tracker-api grep "ERROR" /app/logs/app.log | tail -20

# Performance metrics
curl -s https://yourdomain.com/health | jq '.metrics'
```

### Contact & Support
- Check logs first: `/app/logs/app.log`
- Review metrics: `https://yourdomain.com/metrics`
- Security events: Look for "Security Event" in logs
- Performance: Monitor response times and memory usage

## Security Checklist

Before going live:

- [ ] Changed all default passwords and secrets
- [ ] Configured HTTPS with valid certificates
- [ ] Enabled secure headers and HSTS
- [ ] Configured proper CORS origins
- [ ] Set up rate limiting
- [ ] Enabled request logging
- [ ] Configured automated backups
- [ ] Set up monitoring and alerting
- [ ] Tested disaster recovery procedures
- [ ] Reviewed firewall configuration
- [ ] Disabled unnecessary services
- [ ] Set up log rotation
- [ ] Configured security updates
- [ ] Tested all functionality with admin and viewer roles

## Performance Optimization Checklist

- [ ] Enabled database optimization
- [ ] Configured proper caching headers
- [ ] Set up compression (gzip)
- [ ] Optimized Docker container resources
- [ ] Configured proper connection limits
- [ ] Set up CDN (if needed)
- [ ] Optimized database indexes
- [ ] Enabled HTTP/2
- [ ] Configured proper timeouts
- [ ] Set up monitoring and metrics