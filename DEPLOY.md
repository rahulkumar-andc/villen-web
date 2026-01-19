# 💸 Zero-Cost (No CC) Deployment Guide

Since you don't have a credit card, we will use **PythonAnywhere** (Backend) and **Vercel** (Frontend). Both are free and don't require cards.

## 1. Database strategy (`db.sqlite3`)
**Keep using SQLite.** 
- **Why?** It is a file-based database. PythonAnywhere gives you persistent file storage, so your data will be safe. 
- **Action**: Do not switch to PostgreSQL. The current setup is perfect for you.

## 2. Backend Deployment (PythonAnywhere)
**URL**: [pythonanywhere.com](https://www.pythonanywhere.com/)

1.  **Sign Up**: Create a "Beginner" account (Free).
2.  **Upload Code**:
    - Go to "Consoles" > "Bash".
    - Clone your repo: `git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git`
3.  **Virtual Env**:
    - `cd YOUR_REPO/backend`
    - `python3 -m venv venv`
    - `source venv/bin/activate`
    - `pip install -r requirements.txt`
4.  **Web Tab Setup**:
    - Go to "Web" tab > "Add a new web app".
    - Choose **Manual Configuration** (NB: distinct from Django option to control WSGI better, or select Django if easier).
    - **Python version**: 3.10 or 3.12 (match your local).
    - **Virtualenv**: Enter path `/home/yourusername/repo/backend/venv`.
    - **WSGI file**: Click the link to edit. Delete everything. Add:
      ```python
      import os
      import sys
      path = '/home/yourusername/repo/backend'
      if path not in sys.path:
          sys.path.append(path)
      os.environ['DJANGO_SETTINGS_MODULE'] = 'web.settings'
      from django.core.wsgi import get_wsgi_application
      application = get_wsgi_application()
      ```
5.  **Run Migrations**: 
    - Back in Bash: `python manage.py migrate`
    - `python manage.py createsuperuser`
6.  **Reload**: Go to Web tab and click "Reload".
7.  **Get URL**: Your API is now at `https://yourusername.pythonanywhere.com`.

## 3. Frontend Deployment (Vercel)
**URL**: [vercel.com](https://vercel.com/) (Sign up with GitHub)

1.  **Update API URL**:
    - In your local code, go to `frontend/src/api/blog.js` (and other API files).
    - Change `API_BASE` or `API_URL` to your new pythonanywhere URL: `https://yourusername.pythonanywhere.com/api`.
    - Commit and push to GitHub.
2.  **Deploy**:
    - Go to Vercel Dashboard > "Add New Project".
    - Import your GitHub Repo.
    - Framework Preset: **Vite**.
    - Root Directory: `frontend` (Click Edit to select the folder).
    - Click **Deploy**.

## 4. Final Polish
- Login to `/admin` on your production site.
- Create your projects and posts again (Production DB is empty).

## 5. 🎓 Student Bonus (Your "Cheat Code")
You have a college email (`.ac.in` / `.edu`). This is valuable!

**Step 1: Get the GitHub Student Developer Pack**
- Go to [education.github.com/pack](https://education.github.com/pack).
- Sign up with your college email.
- Upload your ID card if asked.

**Step 2: Unlock "Pro" Free Tiers**
Once approved (takes 1-5 days), you get:
1.  **Microsoft Azure**: $100 Credit (No Credit Card required). Good for hosting backend.
2.  **Namecheap**: 1 Free Domain Name (e.g., `villen.me`) for a year.
3.  **DigitalOcean**: $200 Credit (Might ask for card, but try linking GitHub first).

**Strategy**: Use **PythonAnywhere** now (immediate). Apply for **GitHub Student Pack** today. Once approved, move to a custom domain (`villen.me`) and better hosting!

## 6. Configuring `villen.me` (Vercel)
You already own the domain, so let's use it for the frontend.

1.  **Vercel Dashboard**:
    - Go to your Project > Settings > Domains.
    - Enter `villen.me`.
    - Vercel will give you DNS records (usually an **A Record** `76.76.21.21`).
2.  **Domain Registrar (where you bought it)**:
    - Go to DNS Management.
    - Add/Update the **A Record** for `@` to point to `76.76.21.21`.
    - Add a **CNAME** for `www` to `cname.vercel-dns.com`.
3.  **Wait**: DNS takes 1-24 hours to propagate.

## 7. Crucial Production Setting (Backend)
In `backend/web/settings.py`, you MUST change one line before deploying to PythonAnywhere:

```python
# CHANGE THIS:
ALLOWED_HOSTS = []

# TO THIS:
ALLOWED_HOSTS = ['*']  # Allows villen.pythonanywhere.com
```
(Or specifically `['villen.pythonanywhere.com']` once you know your username).

