# 🎨 Shadow Layer - Frontend

React SPA with premium cybersecurity theme and animations.

## 🛠️ Setup

```bash
npm install
npm run dev
```

## 📁 Structure

```
src/
├── pages/
│   ├── LandingPage.jsx    # Main landing
│   ├── HomePage.jsx       # Home dashboard
│   ├── AboutPage.jsx      # About section
│   ├── ProjectPage.jsx    # Projects
│   ├── ContactPage.jsx    # Contact form
│   ├── NotesPage.jsx      # Notes CRUD
│   ├── LoginPage.jsx      # Cyber login
│   ├── RegisterPage.jsx   # OTP registration
│   └── blog/              # Blog module
│       ├── BlogGateway.jsx
│       ├── BlogHome.jsx
│       └── BlogPost.jsx
│
├── components/
│   ├── Navbar.jsx         # Navigation
│   └── CyberGate.jsx      # Door animation
│
├── context/
│   └── AuthContext.jsx    # Auth state
│
└── api/
    └── auth.js            # Auth API calls
```

## 🎯 Features

| Feature | Description |
|---------|-------------|
| Cyber Gate | Double-door login/logout animation |
| Glassmorphism | Premium card styles |
| Blog | Terminal-inspired post reading |
| Auth | JWT with OTP registration |

## 🎨 Design Tokens

```css
--accent-primary: #00ff9d;     /* Green */
--blog-accent: #00d4ff;        /* Cyan */
--blog-accent-alt: #8b5cf6;    /* Violet */
```

## 📡 API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/api/auth/login/` | Login |
| `/api/auth/register/` | Register |
| `/api/auth/send-otp/` | Send OTP |
| `/api/auth/logout/` | Logout |
