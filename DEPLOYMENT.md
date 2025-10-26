# Production Deployment Guide - Synology NAS

This guide covers deploying the Cash Money application to a Synology NAS using Docker Compose with production-ready configuration. You can deploy using **Portainer** (recommended) or the command line.

## Prerequisites

### On Your Synology NAS

1. **Docker/Container Manager Installed**

   - Open Package Center
   - Install "Container Manager" (or "Docker" on older DSM versions)

2. **Portainer Installed** (Recommended)

   - Already installed and accessible at `http://your-synology-ip:9000`
   - If not installed, see "Installing Portainer" section below

3. **SSH Access Enabled** (for file transfer)

   - Control Panel → Terminal & SNMP
   - Enable SSH service
   - Note your Synology's IP address

4. **Sufficient Resources**
   - At least 2GB RAM available
   - 10GB free disk space for Docker images and database

### On Your Development Machine

1. Node.js v20.17.0 (see `.nvmrc`)
2. Git
3. SSH/SFTP client

## Installing Portainer (If Not Already Installed)

If you don't have Portainer yet:

```bash
# SSH into your Synology
ssh admin@your-synology-ip

# Create Portainer volume
sudo docker volume create portainer_data

# Run Portainer
sudo docker run -d \
  -p 9000:9000 \
  --name=portainer \
  --restart=unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Access Portainer at `http://your-synology-ip:9000` and create your admin account.

## Deployment Steps

### Step 1: Build the Application Locally

Build the application on your development machine:

```bash
# Ensure you're using the correct Node.js version
nvm use

# Install dependencies
npm install --legacy-peer-deps

# Build the production application
npx nx build cash-money --configuration=production
```

Verify the build completed successfully in `dist/cash-money/`.

### Step 2: Prepare Production Environment File

```bash
# Create production environment file from example
cp .env.production.example .env.production

# Generate a secure password
openssl rand -base64 32

# Edit .env.production and update the values
nano .env.production
```

**Required updates:**

- `POSTGRES_PASSWORD` - Use the generated secure password
- `APP_PORT` - Change if port 3000 is already in use (default: 3000)

### Step 3: Transfer Files to Synology

Create a deployment directory and transfer files:

```bash
# SSH into your Synology
ssh admin@your-synology-ip

# Create deployment directory
mkdir -p /volume1/docker/cash-money
exit

# From your development machine, transfer files
rsync -avz --exclude 'node_modules' \
           --exclude '.git' \
           --exclude '.nx' \
           --exclude 'tmp' \
           ./ admin@your-synology-ip:/volume1/docker/cash-money/
```

Alternatively, use an SFTP client like FileZilla to copy the files to `/volume1/docker/cash-money/`.

### Step 4A: Deploy Using Portainer (Recommended)

1. **Access Portainer**

   - Open `http://your-synology-ip:9000` in your browser
   - Log in with your credentials

2. **Navigate to Stacks**

   - Click "Stacks" in the left sidebar
   - Click "+ Add stack"

3. **Create the Stack**

   - **Name**: `cash-money`
   - **Build method**: Select "Upload from your computer"
   - **Upload**: Select `docker-compose.production.yml` from your project

4. **Configure Environment Variables**

   - Scroll down to "Environment variables"
   - Click "+ add an environment variable" for each:
     - `POSTGRES_USER` = `postgres`
     - `POSTGRES_PASSWORD` = `your-secure-password` (from `.env.production`)
     - `POSTGRES_DB` = `cash_money`
     - `APP_PORT` = `3000`

5. **Deploy**

   - Click "Deploy the stack"
   - Wait for both services to start (you'll see green status indicators)

6. **Verify Deployment**
   - In the stack view, check both services show as "running"
   - Click on the `cash-money-app-prod` container
   - Click "Logs" to view application logs
   - Access the app at `http://your-synology-ip:3000`

### Step 4B: Deploy Using Command Line (Alternative)

If you prefer CLI:

```bash
# SSH into your Synology
ssh admin@your-synology-ip

# Navigate to the deployment directory
cd /volume1/docker/cash-money

# Build the Docker image
sudo docker compose -f docker-compose.production.yml build

# Start the services
sudo docker compose -f docker-compose.production.yml \
  --env-file .env.production up -d

# Verify services are running
sudo docker compose -f docker-compose.production.yml ps
```

## Post-Deployment Configuration

### 1. Configure Reverse Proxy (Recommended)

For HTTPS access and custom domain:

**Using Synology DSM:**

1. Control Panel → Login Portal → Advanced → Reverse Proxy
2. Click "Create" and configure:
   - **Description**: Cash Money App
   - **Source Protocol**: HTTPS
   - **Source Hostname**: cashmoney.your-domain.com
   - **Source Port**: 443
   - **Destination Protocol**: HTTP
   - **Destination Hostname**: localhost
   - **Destination Port**: 3000
3. Enable HSTS and HTTP/2

**Using Portainer (via Nginx Proxy Manager):**

If you're running Nginx Proxy Manager in Portainer:

1. Access Nginx Proxy Manager
2. Add Proxy Host:
   - **Domain**: cashmoney.your-domain.com
   - **Forward Hostname/IP**: cash-money-app-prod (container name)
   - **Forward Port**: 3000
   - Enable SSL with Let's Encrypt

### 2. Set Up SSL Certificate

**Using DSM:**

1. Control Panel → Security → Certificate
2. Add a new certificate (Let's Encrypt recommended)
3. Assign it to your reverse proxy

**Using Portainer + Nginx Proxy Manager:**
SSL is automatically handled when creating the proxy host.

### 3. Configure Firewall

1. Control Panel → Security → Firewall
2. Create rules:
   - Allow port 443 (HTTPS) from all
   - Allow port 3000 only from localhost (if using reverse proxy)
   - Block port 5432 (database) from external access

### 4. Set Up Automated Backups

#### Database Backups via Portainer

**Option 1: Using Portainer Webhooks + Task Scheduler**

1. **Create Backup Script on Synology**

```bash
# SSH into Synology
ssh admin@your-synology-ip

# Create scripts directory
sudo mkdir -p /volume1/docker/cash-money/scripts
sudo nano /volume1/docker/cash-money/scripts/backup.sh
```

Add this content:

```bash
#!/bin/bash
BACKUP_DIR="/volume1/docker/cash-money/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="cash-money-postgres-prod"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup using docker exec
sudo docker exec "$CONTAINER_NAME" pg_dump -U postgres cash_money > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Compress backup
gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$TIMESTAMP.sql.gz"
```

Make it executable:

```bash
sudo chmod +x /volume1/docker/cash-money/scripts/backup.sh
```

2. **Schedule with DSM Task Scheduler**
   - Control Panel → Task Scheduler
   - Create → Scheduled Task → User-defined script
   - **General**: Name it "Cash Money DB Backup"
   - **Schedule**: Daily at 2:00 AM
   - **Task Settings**: Run command: `/volume1/docker/cash-money/scripts/backup.sh`

**Option 2: Using Portainer's Console**

1. Go to Portainer → Containers
2. Click on `cash-money-postgres-prod`
3. Click "Console" → Connect
4. Run backup manually:
   ```bash
   pg_dump -U postgres cash_money > /var/lib/postgresql/data/backup_$(date +%Y%m%d).sql
   ```

## Managing Your Deployment

### Using Portainer

**View Logs:**

1. Stacks → cash-money → Click container name
2. Click "Logs"
3. Toggle "Auto-refresh" for live logs

**Restart Services:**

1. Stacks → cash-money
2. Click "Stop" then "Start"
   OR
3. Containers → Select container
4. Click "Restart"

**Update Application:**

1. Build new version locally: `npx nx build cash-money --configuration=production`
2. Transfer files to Synology via rsync/SFTP
3. In Portainer: Stacks → cash-money → "Pull and redeploy"
   OR
4. Containers → cash-money-app-prod → "Recreate"

**Monitor Resources:**

1. Containers → Select container
2. Click "Stats" to view CPU/Memory usage in real-time

**Stop Services:**

1. Stacks → cash-money → "Stop"
   (Data is preserved in volumes)

**Remove Everything:**

1. Stacks → cash-money → "Delete this stack"
2. Check "Remove associated volumes" only if you want to delete data (WARNING)

### Using Command Line

**View Logs:**

```bash
sudo docker compose -f docker-compose.production.yml logs -f
sudo docker compose -f docker-compose.production.yml logs -f app
```

**Restart Services:**

```bash
sudo docker compose -f docker-compose.production.yml restart
```

**Update Application:**

```bash
# After transferring new files
cd /volume1/docker/cash-money
sudo docker compose -f docker-compose.production.yml build app
sudo docker compose -f docker-compose.production.yml up -d app
```

**Stop Services:**

```bash
sudo docker compose -f docker-compose.production.yml down
```

## Backup and Restore

### Manual Backup via Portainer

1. **Create Backup:**

   - Containers → cash-money-postgres-prod → Console → Connect
   - Run: `pg_dump -U postgres cash_money > /tmp/backup.sql`
   - Download from container using Portainer file browser

2. **Restore Backup:**
   - Upload backup.sql to container using Portainer
   - Console → Connect
   - Run: `psql -U postgres cash_money < /path/to/backup.sql`

### Manual Backup via CLI

```bash
# Create backup
sudo docker exec cash-money-postgres-prod pg_dump -U postgres cash_money > backup.sql

# Restore backup
cat backup.sql | sudo docker exec -i cash-money-postgres-prod psql -U postgres cash_money
```

### Volume Backup

For complete data backup including the database volume:

**Via Portainer:**

1. Volumes → cash-money_postgres_data
2. Use Portainer's backup plugins or manual volume copy

**Via CLI:**

```bash
# Backup volume
sudo docker run --rm \
  -v cash-money_postgres_data:/data \
  -v /volume1/backups:/backup \
  alpine tar czf /backup/postgres_data_backup.tar.gz -C /data .

# Restore volume
sudo docker run --rm \
  -v cash-money_postgres_data:/data \
  -v /volume1/backups:/backup \
  alpine tar xzf /backup/postgres_data_backup.tar.gz -C /data
```

## Monitoring

### Portainer Dashboard

- **Container Health**: Stacks → cash-money (green = healthy)
- **Resource Usage**: Containers → Select container → Stats
- **Notifications**: Settings → Notifications (configure email/Slack alerts)

### Health Checks

Both services have health checks:

- **Postgres**: Checks database connectivity every 10s
- **App**: Checks HTTP endpoint every 30s

View health status in Portainer's container list (heart icon).

## Troubleshooting

### Application Won't Start

**Via Portainer:**

1. Stacks → cash-money → cash-money-app-prod
2. Click "Logs" to view errors
3. Check "Inspect" tab for configuration issues

**Common issues:**

- Database not ready: Wait for postgres health check to pass
- Environment variables missing: Check stack environment variables
- Build failed: Check logs during deployment

### Database Connection Failed

**Via Portainer:**

1. Check postgres container is "running" and "healthy"
2. View postgres logs for connection errors
3. Console into app container:
   ```bash
   ping postgres
   # Should resolve to postgres container IP
   ```

### Port Already in Use

**Via Portainer:**

1. Stacks → cash-money → Editor
2. Change port mapping or update `APP_PORT` environment variable
3. Redeploy stack

**Via DSM:**

- Check Container Manager for port conflicts
- Modify `APP_PORT` in Portainer environment variables

### View All Running Containers

**Via Portainer:**

- Containers → Shows all containers with status and ports

**Via CLI:**

```bash
sudo docker ps
```

## Security Best Practices

1. **Strong Passwords**

   - Use minimum 20-character passwords
   - Generate with: `openssl rand -base64 32`
   - Store in password manager

2. **Portainer Security**

   - Use strong admin password
   - Enable 2FA in Portainer (Settings → Authentication)
   - Restrict Portainer access via firewall

3. **Network Security**

   - Use reverse proxy with HTTPS
   - Don't expose database port (5432) externally
   - Keep postgres within Docker network only

4. **Regular Updates**

   - Update DSM regularly
   - Update Docker images:
     - Portainer: Stacks → cash-money → "Pull and redeploy"
   - Update Portainer itself periodically

5. **Regular Backups**

   - Automated daily database backups
   - Test restore procedures monthly
   - Store backups off-site or in cloud

6. **Monitoring**
   - Configure Portainer notifications
   - Monitor disk space in DSM
   - Review logs regularly

## Performance Optimization

### PostgreSQL Tuning

Add custom PostgreSQL configuration:

1. Create config file on Synology:

```bash
sudo nano /volume1/docker/cash-money/postgres.conf
```

Add:

```conf
# Memory settings (adjust based on available RAM)
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB

# Connection settings
max_connections = 100

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200
```

2. Update stack in Portainer:
   - Stacks → cash-money → Editor
   - Add to postgres service:
   ```yaml
   volumes:
     - postgres_data:/var/lib/postgresql/data
     - ./db/init:/docker-entrypoint-initdb.d:ro
     - ./postgres.conf:/etc/postgresql/postgresql.conf:ro
   command: postgres -c config_file=/etc/postgresql/postgresql.conf
   ```
   - Update the stack

### Resource Limits

In Portainer, you can set resource limits:

1. Containers → cash-money-app-prod → "Duplicate/Edit"
2. Scroll to "Resources"
3. Set limits:
   - Memory limit: 512MB
   - CPU limit: 1.0

Or edit the compose file to add:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
```

## Quick Reference Commands

### Portainer Access

- URL: `http://your-synology-ip:9000`

### Application Access

- URL: `http://your-synology-ip:3000`

### SSH Commands

```bash
# SSH into Synology
ssh admin@your-synology-ip

# View running containers
sudo docker ps

# View logs
sudo docker logs cash-money-app-prod -f

# Enter container
sudo docker exec -it cash-money-app-prod sh

# Database backup
sudo docker exec cash-money-postgres-prod pg_dump -U postgres cash_money > backup.sql
```

## Additional Resources

- [Portainer Documentation](https://docs.portainer.io/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Synology Docker Guide](https://www.synology.com/en-global/dsm/packages/Docker)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Cash Money App README](./README.md)

## Support Checklist

Before asking for help, verify:

- [ ] Both containers show as "running" in Portainer
- [ ] Health checks show as "healthy" (heart icon)
- [ ] Environment variables are set correctly
- [ ] Database initialized successfully (check postgres logs)
- [ ] Port 3000 is accessible
- [ ] Firewall allows necessary ports
- [ ] Sufficient disk space and memory available

View logs in Portainer for specific error messages.
