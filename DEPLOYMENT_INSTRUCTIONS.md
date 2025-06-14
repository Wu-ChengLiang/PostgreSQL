# Cloud PostgreSQL API Deployment Instructions

## Server Information
- **Server IP**: 43.167.226.222
- **Username**: ubuntu
- **Password**: 20031758wW@
- **API URL**: http://emagen.323424.xyz/api/

## Deployment Steps

### Step 1: Upload Files to Server

First, upload the deployment package:
```bash
scp deploy-package.tar.gz ubuntu@43.167.226.222:~/
# Enter password: 20031758wW@
```

Then, upload the deployment script:
```bash
scp remote-deploy-all.sh ubuntu@43.167.226.222:~/
# Enter password: 20031758wW@
```

### Step 2: Connect to Server

```bash
ssh ubuntu@43.167.226.222
# Enter password: 20031758wW@
```

### Step 3: Run Deployment Script

Once connected to the server, run:
```bash
chmod +x remote-deploy-all.sh
./remote-deploy-all.sh
```

The script will automatically:
1. Clean up any old installation
2. Extract the application files
3. Install all required dependencies (Node.js, PostgreSQL, PM2, Nginx)
4. Configure the PostgreSQL database
5. Install Node.js dependencies
6. Create environment configuration
7. Run database migrations
8. Start the application with PM2
9. Configure Nginx as reverse proxy
10. Configure firewall rules
11. Test the deployment

### Step 4: Verify Deployment

After deployment completes, verify everything is working:

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs cloud-postgres-api --lines 50

# Test API locally
curl http://localhost:3000/api/health

# Test from outside
curl http://emagen.323424.xyz/api/health
```

## API Endpoints

Once deployed, the following endpoints will be available:

- Health Check: `http://emagen.323424.xyz/api/health`
- Stores: `http://emagen.323424.xyz/api/functions/stores`
- Therapists: `http://emagen.323424.xyz/api/functions/therapists`
- Appointments: `http://emagen.323424.xyz/api/functions/appointments`

## Troubleshooting

If something goes wrong:

1. Check PM2 logs:
   ```bash
   pm2 logs cloud-postgres-api
   ```

2. Check Nginx status:
   ```bash
   sudo systemctl status nginx
   ```

3. Check PostgreSQL status:
   ```bash
   sudo systemctl status postgresql
   ```

4. Restart the application:
   ```bash
   pm2 restart cloud-postgres-api
   ```

5. View deployment info:
   ```bash
   cat ~/deployment-info.txt
   ```

## Database Information

- **Database Name**: clouddb
- **Database User**: dbuser
- **Database Password**: secure123456
- **Connection String**: postgresql://dbuser:secure123456@localhost:5432/clouddb

## Maintenance Commands

- **View logs**: `pm2 logs cloud-postgres-api`
- **Restart app**: `pm2 restart cloud-postgres-api`
- **Stop app**: `pm2 stop cloud-postgres-api`
- **Start app**: `pm2 start cloud-postgres-api`
- **Reload Nginx**: `sudo systemctl reload nginx`
- **Check disk space**: `df -h`
- **Check memory**: `free -m`