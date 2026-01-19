# Deploying Villen Web

## Frontend (Vercel)
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in `frontend/` directory.
3. Set Build Command: `npm run build`
4. Set Output Directory: `dist`
5. Visit deployed URL.

## Backend (PythonAnywhere / Render)

### Preparation
1. Install `gunicorn`: `pip install gunicorn`
2. Build `requirements.txt`: `pip freeze > requirements.txt`

### Deployment (General)
1. Push code to GitHub.
2. Connect repository to host.
3. Set Environment Variables:
   - `SECRET_KEY`
   - `DEBUG=False`
   - `ALLOWED_HOSTS` (your domain)
   - `CORS_ALLOWED_ORIGINS` (your frontend URL)
4. Run Migrations: `python manage.py migrate`
5. Create Superuser: `python manage.py createsuperuser`

### Domain Setup
1. Point `villen.me` to Frontend.
2. Point `api.villen.me` to Backend.
3. Point `blog.villen.me` to `villen.me/blog` via rewrite or let SPA handle it.
