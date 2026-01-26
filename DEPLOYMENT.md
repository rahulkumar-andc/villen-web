# Deployment Guide - Shadow Layer (VILLEN)

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker & Docker Compose installed
- `.env` file configured (copy from `.env.example`)

### 1. Setup Environment Variables
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit both `.env` files with your actual values:

**Backend (.env)**
```env
DJANGO_SECRET_KEY=your-generated-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_PASSWORD=strong-postgres-password
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

**Frontend (.env)**
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=Shadow Layer
```

### 2. Start All Services with Docker Compose
```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Django backend (http://localhost:8000)
- React frontend (http://localhost:3000)
- Nginx reverse proxy (http://localhost)

### 3. Initialize Database
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py loaddata roles
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py collectstatic
```

### 4. Verify Services
```bash
# Check health
curl http://localhost/api/health/

# Check version
curl http://localhost/api/version/

# Access admin panel
http://localhost/admin/
```

---

## Manual Deployment (Without Docker)

### Backend Setup

#### 1. Clone and Setup Python Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
export $(cat .env | xargs)
```

#### 3. Setup Database
```bash
python manage.py migrate
python manage.py loaddata roles
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

#### 4. Create Logs Directory
```bash
mkdir -p logs
```

#### 5. Run Development Server
```bash
python manage.py runserver 0.0.0.0:8000
```

#### 5a. Run Production Server with Gunicorn
```bash
gunicorn --bind 0.0.0.0:8000 --workers 4 --timeout 60 web.wsgi:application
```

### Frontend Setup

#### 1. Install Dependencies
```bash
cd frontend
npm install
```

#### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API URL
```

#### 3. Development Server
```bash
npm run dev
```

#### 3a. Production Build
```bash
npm run build
npm run preview
```

---

## Production Deployment with Nginx

### 1. Install Nginx
```bash
sudo apt-get update
sudo apt-get install nginx
```

### 2. Configure Nginx
Copy the provided `nginx.conf` to `/etc/nginx/nginx.conf`:
```bash
sudo cp nginx.conf /etc/nginx/nginx.conf
```

### 3. Enable HTTPS with Let's Encrypt
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

### 4. Update Nginx Configuration
Uncomment the SSL section in `nginx.conf` and set your domain:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ...
}
```

### 5. Restart Nginx
```bash
sudo systemctl restart nginx
```

---

## Environment Variables Reference

### Django Backend
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DJANGO_SECRET_KEY | Yes | - | Secret key for Django (generate with `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`) |
| DJANGO_DEBUG | No | False | Debug mode (NEVER True in production) |
| DJANGO_ALLOWED_HOSTS | No | localhost,127.0.0.1 | Comma-separated allowed hosts |
| DATABASE_ENGINE | No | sqlite3 | Database backend (postgresql recommended) |
| DATABASE_NAME | No | villen_db | Database name |
| DATABASE_USER | No | postgres | Database user |
| DATABASE_PASSWORD | No | - | Database password |
| DATABASE_HOST | No | localhost | Database host |
| DATABASE_PORT | No | 5432 | Database port |
| EMAIL_HOST | No | - | SMTP server hostname |
| EMAIL_HOST_USER | No | - | SMTP username |
| EMAIL_HOST_PASSWORD | No | - | SMTP password |
| CORS_ALLOWED_ORIGINS | No | https://villen.me | Comma-separated CORS origins |

### React Frontend
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| VITE_API_URL | No | http://127.0.0.1:8000/api | Backend API URL |
| VITE_APP_NAME | No | Shadow Layer | Application name |
| VITE_LOG_LEVEL | No | INFO | Logging level (DEBUG, INFO, WARN, ERROR) |

---

## Security Checklist

- [ ] Generate strong DJANGO_SECRET_KEY
- [ ] Set DJANGO_DEBUG=False in production
- [ ] Configure CORS_ALLOWED_ORIGINS properly
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set strong database password
- [ ] Configure email credentials securely
- [ ] Set secure cookie settings in Django
- [ ] Enable CSRF protection
- [ ] Configure security headers in Nginx
- [ ] Regular backups of database
- [ ] Monitor logs for suspicious activity

---

## Monitoring & Health Checks

### Health Endpoint
```bash
GET /api/health/
```

Response (200 OK):
```json
{
    "status": "healthy",
    "database": "healthy",
    "debug": false,
    "timestamp": "2024-01-25T10:30:00.000000Z"
}
```

### Version Endpoint
```bash
GET /api/version/
```

Response:
```json
{
    "version": "1.0.0",
    "api": "Shadow Layer API",
    "environment": "production"
}
```

---

## Troubleshooting

### Database Connection Error
```bash
# Check database is running
docker ps | grep postgres

# Check logs
docker-compose logs postgres
```

### Static Files Not Loading
```bash
# Collect static files
python manage.py collectstatic --noinput

# Check permissions
sudo chown -R www-data:www-data /path/to/staticfiles
```

### CORS Issues
- Verify CORS_ALLOWED_ORIGINS in .env
- Check frontend URL matches exactly
- Clear browser cache

### Email Not Sending
- Verify EMAIL_HOST credentials
- Check EMAIL_HOST is accessible from server
- Enable "Less secure apps" for Gmail

---

## Maintenance

### Database Backups
```bash
# PostgreSQL backup
pg_dump -U postgres villen_db > backup-$(date +%Y%m%d).sql

# Docker backup
docker-compose exec postgres pg_dump -U postgres villen_db > backup-$(date +%Y%m%d).sql
```

### Log Rotation
```bash
# Configure logrotate for Django logs
sudo nano /etc/logrotate.d/villen

# Example configuration
/path/to/villen/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

### SSL Certificate Renewal
```bash
# Auto-renewal (runs automatically)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Manual renewal
sudo certbot renew
```

---

## Support & Documentation

- Check [SECURITY.md](backend/SECURITY.md) for security guidelines
- Review [backend/README.md](backend/README.md) for API documentation
- Check [frontend/README.md](frontend/README.md) for frontend setup

