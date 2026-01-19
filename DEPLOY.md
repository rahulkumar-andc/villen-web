
# ⚡ Critical Implementation Guide for Deployment

## 1. Backend (PythonAnywhere)
1.  **Clone**: `git clone https://github.com/rahulkumar-andc/villen-web.git`
2.  **Environment**:
    ```bash
    cd villen-web/backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
3.  **Environment Variables**:
    *   In PythonAnywhere "Web" tab > WSGI configuration file:
    ```python
    import os
    os.environ['DJANGO_SECRET_KEY'] = 'your-secure-secret-key'
    os.environ['DJANGO_DEBUG'] = 'False'
    os.environ['DJANGO_ALLOWED_HOSTS'] = 'yourusername.pythonanywhere.com'
    os.environ['CORS_ALLOWED_ORIGINS'] = 'https://your-frontend.vercel.app'
    ```
4.  **Database**:
    ```bash
    python manage.py migrate
    python seed_db.py  # Seed initial data/users
    ```

## 2. Frontend (Vercel)
1.  **Import**: Connect GitHub repo.
2.  **Settings**:
    *   **Root Directory**: `frontend`
    *   **Framework Preset**: Vite
    *   **Environment Variables**:
        *   `VITE_API_URL`: `https://yourusername.pythonanywhere.com/api`
3.  **Deploy**: Click "Deploy".

## 3. Post-Deployment Verification
1.  Visit Vercel URL.
2.  Check Console for Network Errors (CORS).
3.  Login with `admin` / `admin123`.
