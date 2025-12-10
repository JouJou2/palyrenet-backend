# Palyrenet Backend - Production Deployment Guide

## 🚨 CRITICAL: Pre-Deployment Security Checklist

### 1. Environment Variables

**Generate Strong JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and set it in your `.env` file:
```env
JWT_SECRET="<paste-the-generated-secret-here>"
```

### 2. Database Security

**Use SSL for database connections in production:**
```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

### 3. Update Environment Variables

Create a `.env` file with production values:

```env
# Application
NODE_ENV="production"
PORT=3001

# Database (use your production database URL)
DATABASE_URL="postgresql://username:password@host:5432/dbname?sslmode=require"

# JWT - CRITICAL: Use the generated secret above
JWT_SECRET="your-64-character-random-string-here"
JWT_EXPIRES_IN="7d"

# CORS - Update to your actual frontend domain
FRONTEND_URL="https://yourdomain.com"

# Redis (if using)
REDIS_HOST="your-redis-host"
REDIS_PORT=6379
REDIS_PASSWORD="your-redis-password"
```

---

## 🌐 Deployment Options

### Option 1: Traditional VPS (DigitalOcean, AWS EC2, etc.)

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx (as reverse proxy)
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2
```

#### Step 2: PostgreSQL Setup

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE palyrenet_db;
CREATE USER palyrenet WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE palyrenet_db TO palyrenet;
\q
```

#### Step 3: Upload Application

```bash
# On your local machine, create a deployment package
cd Backend
npm run build
tar -czf backend.tar.gz dist node_modules package*.json prisma .env

# Upload to server (replace with your server details)
scp backend.tar.gz user@your-server-ip:/home/user/

# On server, extract
cd /home/user/
tar -xzf backend.tar.gz
```

#### Step 4: Run Database Migrations

```bash
cd /home/user/
npx prisma migrate deploy
```

#### Step 5: Start with PM2

```bash
# Start the application
pm2 start dist/main.js --name palyrenet-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Copy and run the command it outputs

# Check status
pm2 status
pm2 logs palyrenet-api
```

#### Step 6: Nginx Configuration

Create Nginx config: `/etc/nginx/sites-available/palyrenet`

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serve uploaded files
    location /uploads/ {
        alias /home/user/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/palyrenet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 7: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is set up automatically
```

---

### Option 2: Docker Deployment

#### Create `Dockerfile`

```dockerfile
FROM node:18-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy application
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3001

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
```

#### Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: palyrenet_db
      POSTGRES_USER: palyrenet
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://palyrenet:${DB_PASSWORD}@postgres:5432/palyrenet_db?schema=public
      JWT_SECRET: ${JWT_SECRET}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      FRONTEND_URL: ${FRONTEND_URL}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Deploy with Docker

```bash
# Create .env file with secrets
echo "DB_PASSWORD=your-secure-password" > .env
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" >> .env
echo "FRONTEND_URL=https://yourdomain.com" >> .env

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

---

### Option 3: Platform as a Service (Heroku, Railway, Render)

#### Heroku Example

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create palyrenet-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
heroku config:set FRONTEND_URL=https://yourdomain.com

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy

# Check logs
heroku logs --tail
```

---

## 🔐 Post-Deployment Security

### 1. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. Fail2Ban (Prevent brute force)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Regular Updates

```bash
# Create update script
cat > ~/update-palyrenet.sh << 'EOF'
#!/bin/bash
cd /home/user/palyrenet-backend
git pull origin main
npm ci --only=production
npm run build
npx prisma migrate deploy
pm2 restart palyrenet-api
EOF

chmod +x ~/update-palyrenet.sh
```

### 4. Monitoring

```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Health check monitoring (set up with UptimeRobot, Pingdom, etc.)
# Monitor: https://api.yourdomain.com/health
```

---

## 📊 Performance Optimization

### 1. Enable Compression

```bash
# Install compression package
npm install compression

# Add to main.ts
import * as compression from 'compression';
app.use(compression());
```

### 2. Database Indexing

Already configured in Prisma schema. Verify with:
```bash
npx prisma db execute --stdin < check_indexes.sql
```

### 3. Redis Caching

Already configured. Ensure Redis is running and connected.

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test database connection
psql "postgresql://user:password@host:5432/database?sslmode=require"

# Check Prisma connection
npx prisma db pull
```

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs palyrenet-api --lines 100

# Check for port conflicts
sudo lsof -i :3001

# Verify environment variables
pm2 env palyrenet-api
```

### High Memory Usage

```bash
# Restart PM2 with memory limit
pm2 delete palyrenet-api
pm2 start dist/main.js --name palyrenet-api --max-memory-restart 500M
```

---

## 📝 Maintenance

### Backup Database

```bash
# Create backup script
cat > ~/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U palyrenet -h localhost palyrenet_db > ~/backups/db_backup_$DATE.sql
# Keep only last 7 days
find ~/backups -name "db_backup_*.sql" -mtime +7 -delete
EOF

chmod +x ~/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/user/backup-db.sh
```

### Update Dependencies

```bash
npm outdated
npm update
npm audit fix
```

---

## ✅ Deployment Verification

After deployment, verify:

1. **Health Check**: Visit `https://api.yourdomain.com/health`
   - Should return: `{"status":"ok","database":"connected"}`

2. **CORS**: Test from frontend
   - Requests should not be blocked

3. **Rate Limiting**: Make 101 requests in 1 minute
   - 101st request should return 429 Too Many Requests

4. **Authentication**: Test login/register
   - Should return JWT token

5. **File Upload**: Test avatar/cover upload
   - Files should be accessible at `/uploads/...`

---

## 📞 Support

If you encounter issues:
1. Check logs: `pm2 logs palyrenet-api`
2. Check health endpoint: `/health`
3. Review environment variables
4. Verify database connectivity
5. Check firewall rules

---

**🎉 Deployment Complete! Your Palyrenet backend is now live and secure!**
