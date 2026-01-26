# Quick Start Checklist - VILLEN Web

## ⚡ 5-Minute Quick Start

### Step 1: Clone & Configure
```bash
# 1. Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Generate Django secret key
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# 3. Edit backend/.env and add the generated key
# DJANGO_SECRET_KEY=<paste-generated-key-here>
```

### Step 2: Start Services
```bash
# Start Docker Compose
docker-compose up -d

# Wait for services to be ready (20-30 seconds)
sleep 30
```

### Step 3: Initialize Database
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Load roles
docker-compose exec backend python manage.py loaddata roles

# Create admin user
docker-compose exec backend python manage.py createsuperuser \
  --username=admin \
  --email=admin@example.com \
  --password=AdminPass123!

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput
```

### Step 4: Verify Everything Works
```bash
# Test health endpoint
curl http://localhost/api/health/

# Test API version
curl http://localhost/api/version/

# Access admin panel
# Open: http://localhost/admin/
# Login with admin credentials

# Access frontend
# Open: http://localhost
```

---

## 📋 Pre-Production Checklist

### Security
- [ ] Generate strong DJANGO_SECRET_KEY
- [ ] Set DJANGO_DEBUG=False in backend/.env
- [ ] Configure CORS_ALLOWED_ORIGINS for your domain
- [ ] Set strong DATABASE_PASSWORD
- [ ] Configure EMAIL credentials
- [ ] Enable HTTPS/SSL certificate
- [ ] Review SECURITY.md

### Configuration
- [ ] Update VITE_API_URL to your backend URL
- [ ] Update DJANGO_ALLOWED_HOSTS to your domain
- [ ] Set correct CORS origins
- [ ] Configure email backend
- [ ] Set log levels appropriately

### Database
- [ ] Run migrations: `docker-compose exec backend python manage.py migrate`
- [ ] Load fixtures: `docker-compose exec backend python manage.py loaddata roles`
- [ ] Create superuser
- [ ] Backup database before changes

### Static Files
- [ ] Collect static files: `docker-compose exec backend python manage.py collectstatic --noinput`
- [ ] Verify static files serve correctly
- [ ] Check permissions on staticfiles directory

### Testing
- [ ] Test health endpoint: `curl http://localhost/api/health/`
- [ ] Test API endpoints with authentication
- [ ] Test error handling
- [ ] Test rate limiting
- [ ] Test CORS with different origins
- [ ] Test frontend app loads

### Monitoring
- [ ] Setup logs directory
- [ ] Configure log rotation
- [ ] Setup monitoring dashboard (optional)
- [ ] Configure error tracking (Sentry recommended)

---

## 🐳 Docker Commands Reference

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Stop services
docker-compose down

# Remove volumes (be careful!)
docker-compose down -v

# Restart a service
docker-compose restart backend

# Execute command in container
docker-compose exec backend python manage.py <command>

# Rebuild images
docker-compose build

# View running containers
docker-compose ps

# Check service health
docker-compose exec postgres pg_isready -U postgres
```

---

## 🔑 Important Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health/` | GET | Health check |
| `/api/version/` | GET | API version |
| `/admin/` | GET | Django admin panel |
| `/api/token/` | POST | Get JWT token |
| `/api/token/refresh/` | POST | Refresh JWT token |
| `/api/blog/posts/` | GET/POST | Blog posts |
| `/api/notes/` | GET/POST | Notes |

---

## 📱 Frontend Development

### Development Server
```bash
cd frontend
npm install
npm run dev

# Open http://localhost:5173
```

### Production Build
```bash
npm run build
npm run preview
```

### Linting
```bash
npm run lint
```

---

## 🐍 Backend Development

### Development Server
```bash
cd backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000

# Open http://localhost:8000
```

### Run Tests
```bash
python manage.py test

# With coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

### Create Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 🔧 Troubleshooting

### Services Won't Start
```bash
# Check Docker is running
docker ps

# View detailed logs
docker-compose logs

# Rebuild images
docker-compose build --no-cache

# Remove old containers
docker-compose down -v
docker-compose up -d
```

### Database Connection Error
```bash
# Check if PostgreSQL is ready
docker-compose exec postgres psql -U postgres -d villen_db

# Check database settings
docker-compose exec backend python manage.py dbshell
```

### Static Files Not Loading
```bash
# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Check permissions
docker-compose exec backend ls -la /app/staticfiles/

# Check Nginx config
docker-compose exec nginx nginx -t
```

### CORS Issues
```bash
# Check CORS configuration
docker-compose exec backend python -c "
import os
print('CORS Allowed Origins:', os.getenv('CORS_ALLOWED_ORIGINS'))
"

# Clear browser cache and try again
```

---

## 📚 Documentation Links

- [Deployment Guide](DEPLOYMENT.md) - Full deployment instructions
- [Improvements Summary](IMPROVEMENTS_SUMMARY.md) - All improvements made
- [Security Guide](backend/SECURITY.md) - Security best practices
- [Backend README](backend/README.md) - API documentation
- [Frontend README](frontend/README.md) - Frontend setup

---

## 💬 Need Help?

### Check Logs
```bash
# Backend logs
docker-compose logs backend

# Frontend logs (development only)
# Check browser console (F12)

# Nginx logs
docker-compose logs nginx

# PostgreSQL logs
docker-compose logs postgres
```

### Common Issues

1. **Port already in use**
   - Change port in docker-compose.yml
   - Or kill process: `lsof -ti:8000 | xargs kill -9`

2. **Database not migrated**
   - Run: `docker-compose exec backend python manage.py migrate`

3. **Admin credentials not working**
   - Recreate superuser: `docker-compose exec backend python manage.py createsuperuser`

4. **Static files 404**
   - Run: `docker-compose exec backend python manage.py collectstatic --noinput`

---

**Ready to deploy?** See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup! 🚀

