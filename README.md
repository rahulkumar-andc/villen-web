# 🛡️ Shadow Layer - VILLEN Web

A premium cybersecurity-themed personal portfolio and blog platform with advanced authentication and RBAC.

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Styling | Vanilla CSS + Glassmorphism |
| Backend | Django + DRF |
| Auth | JWT + Email OTP |
| Database | SQLite |

## 📂 Project Structure

```
villen-web/
├── frontend/          # React SPA
│   ├── src/
│   │   ├── pages/     # All page components
│   │   ├── components/# Reusable components
│   │   ├── context/   # Auth context
│   │   └── api/       # API services
│   └── README.md
│
├── backend/           # Django REST API
│   ├── api/           # Main app
│   ├── web/           # Project settings
│   ├── SECURITY.md    # Security docs
│   └── README.md
│
└── README.md          # This file
```

## 🔧 Quick Start

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata roles
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/home` | Home dashboard |
| `/about` | About page |
| `/projects` | Projects showcase |
| `/notes` | Notes CRUD |
| `/contact` | Contact form |
| `/login` | Login with cyber gate |
| `/register` | Multi-step OTP registration |
| `/blog` | Blog gateway |
| `/blog/home` | Blog posts |

## 🔐 Features

- ✅ Email-OTP Registration
- ✅ JWT Authentication
- ✅ Brute Force Protection
- ✅ Role-Based Access Control
- ✅ Cyber Door Animations
- ✅ Premium Blog Interface

## 👤 Author

**VILLEN** - Security Researcher & Developer
# villen-web
