# 🔧 Shadow Layer - Backend

Django REST API with Email-OTP, JWT, RBAC, and security protections.

## 🛠️ Setup

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata roles
python manage.py runserver
```

## 📁 Structure

```
backend/
├── api/
│   ├── models.py          # Role, UserProfile, EmailOTP, Note
│   ├── auth_views.py      # All auth endpoints
│   ├── auth_serializers.py
│   ├── permissions.py     # RBAC classes
│   └── email_service.py   # OTP generation
│
├── web/
│   ├── settings.py        # Django config
│   └── urls.py            # URL routing
│
└── SECURITY.md            # Security documentation
```

## 📡 Auth Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/send-otp/` | POST | Send registration OTP |
| `/api/auth/verify-otp/` | POST | Verify OTP |
| `/api/auth/register/` | POST | Create user + JWT |
| `/api/auth/login/` | POST | Login + JWT |
| `/api/auth/logout/` | POST | Blacklist token |
| `/api/auth/forgot-password/` | POST | Reset OTP |
| `/api/auth/reset-password/` | POST | New password |
| `/api/auth/token/refresh/` | POST | Refresh JWT |

## 🛡️ Security Features

| Protection | Implementation |
|------------|----------------|
| OTP brute force | 5 attempts max |
| Login brute force | 5 attempts, 15min lock |
| Email enumeration | Generic responses |
| Token invalidation | Blacklist on logout/reset |

## 🔑 RBAC Roles

| Level | Role |
|-------|------|
| 1 | Super Admin |
| 2 | Admin |
| 3 | Monitor |
| 4 | Developer |
| 5 | Premium |
| 6 | Normal (default) |
| 7 | Guest |
