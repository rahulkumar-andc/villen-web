# 📝 Villen Logs - Blog Module

Premium cyber-themed blog interface with terminal-inspired reading experience.

## 🌐 Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/blog` | BlogGateway | Entry animation |
| `/blog/home` | BlogHome | Posts list + filters |
| `/blog/post/:slug` | BlogPost | Terminal-style reading |

## 🎨 Design

- **Theme**: Dark cyber, separate from main site
- **Colors**: Black + Cyan (#00d4ff) + Violet (#8b5cf6)
- **Cards**: Glassmorphism with neon glow
- **Posts**: Line numbers + reading progress bar

## 📁 Files

```
blog/
├── Blog.css           # All blog styles
├── BlogGateway.jsx    # Entry page
├── BlogHome.jsx       # Posts grid
├── BlogPost.jsx       # Single post
└── index.js           # Exports
```

## ✨ Features

- Cyber gateway animation on entry
- Category filters (Security, Dev, Notes, Life)
- Reading time indicators
- Floating progress bar
- Terminal cursor animation
- No main navbar (separate identity)

## 🔮 Future

- [ ] Backend API for posts
- [ ] Restricted posts (login required)
- [ ] Private/Public toggle
- [ ] Invite-only posts
