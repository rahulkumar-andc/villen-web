# 🛡️ Shadow Layer - VILLEN Web

A premium cybersecurity-themed personal portfolio and blog platform with advanced authentication, RBAC, and production-ready infrastructure.

## ✨ Features

- **Advanced Authentication**: JWT tokens + Email OTP verification
- **Role-Based Access Control (RBAC)**: 7-tier role hierarchy
- **Cybersecurity Theming**: Premium hacker aesthetic UI
- **Blog Platform**: Full-featured blog with categories and posts
- **API Health Monitoring**: Built-in health check endpoints
- **Rate Limiting**: DRF throttling to prevent abuse
- **Input Validation**: Comprehensive server-side validation
- **Error Handling**: Structured error responses and logging
- **Docker Ready**: Complete Docker & Docker Compose setup
- **CI/CD Pipeline**: GitHub Actions workflow included
- **Production Optimized**: Nginx reverse proxy, security headers, etc.

## 🚀 Quick Start (Docker)

### 1. Clone and Setup
```bash
git clone https://github.com/yourusername/villen-web.git
cd villen-web
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Configure Environment
Edit `.env` files with your actual values:
```bash
# backend/.env
DJANGO_SECRET_KEY=your-generated-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### 3. Start with Docker Compose
```bash
docker-compose up -d
```

### 4. Initialize Database
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py loaddata roles
docker-compose exec backend python manage.py createsuperuser --username=admin --email=admin@example.com --password=SecurePass123!
```

### 5. Verify Services
```bash
curl http://localhost/api/health/
```

## 📂 Project Structure

```
villen-web/
├── backend/                      # Django REST API
│   ├── api/
│   │   ├── models.py            # Database models
│   │   ├── views.py             # API views
│   │   ├── validators.py        # Input validation utilities
│   │   ├── health.py            # Health check endpoints
│   │   ├── serializers.py       # DRF serializers
│   │   └── permissions.py       # Custom permissions
│   ├── web/
│   │   ├── settings.py          # Django settings (production-ready)
│   │   ├── urls.py              # URL configuration
│   │   └── wsgi.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                     # React + Vite SPA
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js        # Axios instance with interceptors
│   │   │   └── config.js
│   │   ├── components/
│   │   │   ├── ErrorBoundary.jsx  # React error boundary
│   │   │   └── ...
│   │   ├── utils/
│   │   │   ├── logger.js        # Frontend logging
│   │   │   └── helpers.js       # Utility functions
│   │   └── pages/
│   ├── vite.config.js           # Production-optimized
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml           # Multi-container orchestration
├── nginx.conf                   # Reverse proxy configuration
├── DEPLOYMENT.md                # Comprehensive deployment guide
├── README.md                    # This file
└── .github/workflows/
    └── ci-cd.yml               # GitHub Actions pipeline

```

## 🔧 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.2.0 |
| Frontend Build | Vite | 7.2.4 |
| Backend | Django | 5.0.1 |
| API | Django REST Framework | 3.14.0 |
| Auth | JWT (djangorestframework-simplejwt) | 5.3.1 |
| Database | PostgreSQL (recommended) | 15+ |
| Server | Gunicorn | 21.2.0 |
| Proxy | Nginx | latest |
| Container | Docker | latest |
| Orchestration | Docker Compose | 3.8+ |

## 📚 API Endpoints

### Health & Status
- `GET /api/health/` - Health check
- `GET /api/version/` - API version info

### Authentication
- `POST /api/token/` - Get JWT token
- `POST /api/token/refresh/` - Refresh token
- `POST /api/register/` - Register new user
- `POST /api/login/` - Login (with 2FA)
- `POST /api/logout/` - Logout

### Blog
- `GET /api/blog/posts/` - List posts
- `GET /api/blog/posts/{id}/` - Get post detail
- `POST /api/blog/posts/` - Create post (authenticated)
- `GET /api/blog/categories/` - List categories

### Notes
- `GET /api/notes/` - List notes
- `POST /api/notes/` - Create note
- `PATCH /api/notes/{id}/` - Update note
- `DELETE /api/notes/{id}/` - Delete note

## 🔐 Security Features

✅ **Implemented**
- [x] Hardcoded secret key protection
- [x] CSRF protection
- [x] CORS validation
- [x] Rate limiting (100/hour anon, 1000/hour user)
- [x] Input validation & sanitization
- [x] Password strength requirements
- [x] Login attempt lockout (5 attempts, 15 min lockout)
- [x] JWT token rotation
- [x] Security headers (Nginx)
- [x] HTTPS ready (with Let's Encrypt)
- [x] SQL injection prevention (ORM)
- [x] XSS protection
- [x] Clickjacking protection

🔒 **Production Checklist**
- [ ] Enable HTTPS with valid certificate
- [ ] Set strong DJANGO_SECRET_KEY
- [ ] Configure email backend
- [ ] Set CORS_ALLOWED_ORIGINS
- [ ] Enable database backups
- [ ] Setup monitoring (Sentry recommended)
- [ ] Configure log rotation
- [ ] Review SECURITY.md

## 🛠️ Development Setup

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 📦 Dependencies

### Backend
```
Django 5.0.1
djangorestframework 3.14.0
djangorestframework-simplejwt 5.3.1
python-dotenv 1.0.0
sentry-sdk 1.40.6
psycopg2-binary 2.9.9 (PostgreSQL)
```

### Frontend
```
react 19.2.0
react-router-dom 7.12.0
axios 1.6.5
vite 7.2.4
lucide-react 0.562.0
```

## 🚀 Deployment

### Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Manual Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Manual backend setup
- Manual frontend setup
- Nginx configuration
- Let's Encrypt HTTPS
- Database backups
- Log rotation
- Monitoring setup

### Environment Variables
Copy `.env.example` to `.env` and configure:

**Backend**
- `DJANGO_SECRET_KEY` - Secret key (generate with `django-admin shell`)
- `DJANGO_DEBUG` - Debug mode (False in production)
- `DJANGO_ALLOWED_HOSTS` - Allowed hosts
- `DATABASE_*` - Database credentials
- `CORS_ALLOWED_ORIGINS` - Allowed CORS origins
- `EMAIL_*` - Email configuration

**Frontend**
- `VITE_API_URL` - Backend API URL
- `VITE_APP_NAME` - Application name

## 🧪 Testing

### Backend
```bash
cd backend
python manage.py test
```

### Frontend
```bash
cd frontend
npm run lint
npm run build
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost/api/health/
```

Response:
```json
{
  "status": "healthy",
  "database": "healthy",
  "debug": false,
  "timestamp": "2024-01-25T10:30:00Z"
}
```

### Logs
- Backend: `backend/logs/django.log`
- Security: `backend/logs/security.log`
- Nginx: `/var/log/nginx/access.log`

## 🐛 Troubleshooting

### Database Connection Error
```bash
docker-compose logs postgres
docker-compose exec postgres psql -U postgres -d villen_db
```

### Static Files Not Loading
```bash
docker-compose exec backend python manage.py collectstatic --noinput
```

### CORS Issues
- Check `CORS_ALLOWED_ORIGINS` in `.env`
- Clear browser cache
- Verify frontend URL matches exactly

### Email Not Sending
- Configure SMTP credentials in `.env`
- Test with: `python manage.py shell`
- Check logs for errors

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

- **Issues**: GitHub Issues
- **Documentation**: See [DEPLOYMENT.md](DEPLOYMENT.md) and [backend/SECURITY.md](backend/SECURITY.md)
- **Email**: support@example.com

## 🙏 Acknowledgments

- Django REST Framework
- React & Vite
- The cybersecurity community

---

**Last Updated**: January 25, 2024  
**Version**: 1.0.0
