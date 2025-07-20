# TSOAM Church Management System - Installation Guide

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Database Setup](#database-setup)
3. [Environment Configuration](#environment-configuration)
4. [Installation Steps](#installation-steps)
5. [Running the System](#running-the-system)
6. [Troubleshooting](#troubleshooting)
7. [Production Deployment](#production-deployment)
8. [Backup & Recovery](#backup--recovery)

## 🖥️ System Requirements

### Minimum Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **MySQL**: Version 8.0 or higher
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 2GB free space
- **Network**: Internet connection for initial setup

### Software Dependencies

- MySQL Server 8.0+
- MySQL Workbench (optional, for database management)
- Git (for version control)
- Web browser (Chrome, Firefox, Safari, or Edge)

## 🗄️ Database Setup

### Step 1: Install MySQL

1. Download MySQL Community Server from [https://dev.mysql.com/downloads/](https://dev.mysql.com/downloads/)
2. Install MySQL with the following settings:
   - Root password: Create a secure password
   - Default port: 3306
   - Enable MySQL as a service

### Step 2: Create Database

```bash
# Option 1: Using MySQL command line
mysql -u root -p
CREATE DATABASE tsoam_church_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# Option 2: Using the npm script
npm run create-db
```

### Step 3: Import Schema

```bash
# Navigate to the project directory
cd path/to/tsoam-church-management-system

# Import the database schema
mysql -u root -p tsoam_church_db < database/schema.sql

# Or use the npm script
npm run import-schema
```

## ⚙️ Environment Configuration

### Step 1: Copy Environment Files

```bash
# In the root directory
cp .env.example .env

# In the server directory
cd server
cp .env.example .env
```

### Step 2: Configure Environment Variables

**Root `.env` file:**

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tsoam_church_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# Server Configuration
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_here

# Client Configuration
CLIENT_URL=http://localhost:3000
```

**Server `.env` file:**

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tsoam_church_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# Server
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret_key_here
BCRYPT_ROUNDS=12

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 📦 Installation Steps

### Step 1: Download the System

```bash
# If using Git
git clone https://github.com/tsoam/church-management-system.git
cd church-management-system

# If using ZIP file
# Extract the ZIP file to your desired location
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm run install-all

# Or install manually
npm install
cd client && npm install
cd ../server && npm install
```

### Step 3: Setup Database

```bash
# Create database and import schema
npm run setup

# Or manually
npm run create-db
npm run import-schema
```

### Step 4: Test Installation

```bash
# Test database connection
npm run test-connection

# Check system health
npm run health-check
```

## 🚀 Running the System

### Development Mode

```bash
# Run both client and server
npm run dev

# Or run separately
npm run dev-client  # Client on http://localhost:3000
npm run dev-server  # Server on http://localhost:3001
```

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Quick Start Scripts

**Windows:**

```bash
start-tsoam.bat
```

**Linux/macOS:**

```bash
./start-tsoam.sh
```

## 🌐 Accessing the System

- **Local Access**: http://localhost:3001
- **LAN Access**: http://[YOUR-IP]:3001
- **Default Login**:
  - Email: `admin@tsoam.org`
  - Password: `admin123`

### User Roles and Access

- **Admin**: Full system access
- **HR Officer**: Members, HR, Appointments, System Logs
- **Finance Officer**: Finance, Welfare, Events
- **User**: Members, Events, Messaging, Settings

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check MySQL service
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # macOS
services.msc  # Windows

# Test connection manually
mysql -u root -p -h localhost
```

#### Port Already in Use

```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9  # Linux/macOS
netstat -ano | findstr :3001  # Windows
```

#### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules client/node_modules server/node_modules
npm run install-all
```

#### Permission Errors

```bash
# Fix file permissions (Linux/macOS)
chmod +x start-tsoam.sh
chown -R $USER:$USER .
```

### Log Files

- **Server Logs**: `server/logs/`
- **Error Logs**: `logs/error.log`
- **Access Logs**: `logs/access.log`

## 🌍 Production Deployment

### Server Requirements

- **CPU**: 2+ cores
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 20GB+ SSD
- **Network**: Static IP recommended
- **SSL Certificate**: Required for HTTPS

### Deployment Steps

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server
```

#### 2. Application Deployment

```bash
# Clone repository
git clone https://github.com/tsoam/church-management-system.git
cd church-management-system

# Install dependencies
npm run install-all

# Build application
npm run build-production

# Setup environment
cp .env.example .env
# Edit .env with production values
```

#### 3. Process Management (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Setup auto-restart
pm2 startup
pm2 save
```

#### 4. Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

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
    }
}
```

### Security Considerations

- Enable firewall (UFW/iptables)
- Configure SSL/TLS certificates
- Set up automated backups
- Regular security updates
- Database user permissions
- File upload restrictions

## 💾 Backup & Recovery

### Automated Backup

```bash
# Daily database backup
npm run backup-db

# Full system backup (cron job)
0 2 * * * /path/to/backup-script.sh
```

### Manual Backup

```bash
# Database backup
mysqldump -u root -p tsoam_church_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Files backup
tar -czf tsoam_backup_$(date +%Y%m%d).tar.gz uploads/ logs/ .env
```

### Recovery

```bash
# Restore database
mysql -u root -p tsoam_church_db < backup_file.sql

# Restore files
tar -xzf tsoam_backup_YYYYMMDD.tar.gz
```

## 📞 Support

### Documentation

- **User Manual**: `/docs/USER_MANUAL.md`
- **API Documentation**: `/docs/API_GUIDE.md`
- **Development Guide**: `/docs/DEVELOPMENT.md`

### Support Channels

- **Email**: support@tsoam.org
- **Documentation**: [System Wiki]
- **Issue Tracker**: [GitHub Issues]

### System Maintenance

- **Updates**: Monthly security updates
- **Backups**: Daily automated backups
- **Monitoring**: 24/7 system monitoring
- **Support**: Business hours (Mon-Fri 8AM-5PM EAT)

---

**Version**: 2.0.0  
**Last Updated**: January 2024  
**Compatibility**: Node.js 16+, MySQL 8.0+
