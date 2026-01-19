# 🚀 Villen.me Deployment Guide

This guide will help you deploy your application and link your domain `villen.me`.

## 🏗️ Architecture Overview
*   **Frontend**: Hosted on **Vercel** (Free). Links to `villen.me`.
*   **Backend**: Hosted on **PythonAnywhere** (Free or Paid).
    *   *Free Tier*: `villenbhai.pythonanywhere.com`
    *   *Paid Tier*: `api.villen.me` (Requires $5/mo plan for custom domains)

---

## 1. Backend Deployment (PythonAnywhere)

### Step A: Code & Environment
1.  **Log in** to [PythonAnywhere](https://www.pythonanywhere.com/).
2.  Open a **Bash Console**.
3.  **Clone your repository**:
    ```bash
    git clone https://github.com/rahulkumar-andc/villen-web.git
    ```
4.  **Setup Virtual Environment**:
    ```bash
    cd villen-web/backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
5.  **Run Migrations & Seed Data**:
    ```bash
    python manage.py migrate
    python seed_db.py
    ```

### Step B: Web App Configuration
1.  Go to the **Web** tab.
2.  **Add a new web app** > **Manual Configuration** > **Python 3.10** (or your version).
3.  **Virtualenv**: Enter path `/home/yourusername/villen-web/backend/venv`.
4.  **Source code**: Enter path `/home/yourusername/villen-web/backend`.
5.  **WSGI Configuration File**: Click the link and update securely:

    ```python
    import os
    import sys

    path = '/home/yourusername/villen-web/backend'
    if path not in sys.path:
        sys.path.append(path)

    os.environ['DJANGO_SETTINGS_MODULE'] = 'web.settings'
    
    # 🔐 CRITICAL SECURITY SECRETS
    os.environ['DJANGO_SECRET_KEY'] = 's3cr3t-key-generate-one-online'
    os.environ['DJANGO_DEBUG'] = 'False' 
    
    # 🌍 DOMAINS
    # If Free Tier: 'yourusername.pythonanywhere.com'
    # If Paid Tier: 'api.villen.me'
    os.environ['DJANGO_ALLOWED_HOSTS'] = 'villenbhai.pythonanywhere.com,api.villen.me'
    
    # 🔗 FRONTEND LINK
    os.environ['CORS_ALLOWED_ORIGINS'] = 'https://villen.me,https://www.villen.me'

    from django.core.wsgi import get_wsgi_application
    application = get_wsgi_application()
    ```
6.  **Static Files**:
    *   URL: `/static/`
    *   Path: `/home/yourusername/villen-web/backend/static`
    *   (Make sure to run `python manage.py collectstatic` in console first).

---

## 2. Frontend Deployment (Vercel)

1.  **Log in** to [Vercel](https://vercel.com/).
2.  **Add New Project** > Import `rahulkumar-andc/villen-web`.
3.  **Configure Project**:
    *   **Root Directory**: `frontend` (Click Edit)
    *   **Framework**: Vite
4.  **Environment Variables** (The most important part!):
    *   **Name**: `VITE_API_URL`
    *   **Value** (Free Backend): `https://villenbhai.pythonanywhere.com/api`
    *   **Value** (Paid Backend): `https://api.villen.me/api`
5.  **Deploy**.

---

## 3. Domain & DNS Configuration (Namecheap/GoDaddy/Cloudflare)

You need to link `villen.me` to these services. Go to your Domain Registrar's **DNS Management** page.

### A. Link Frontend (villen.me)
Add these records:

| Type | Name | Value | Proxy Status |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` | DNS Only / Auto |
| **CNAME** | `www` | `cname.vercel-dns.com` | DNS Only / Auto |

*After adding these, go to Vercel Project Settings > Domains and add `villen.me`.*

### B. Link Backend API (api.villen.me)
**⚠️ Only for Paid PythonAnywhere Accounts**

| Type | Name | Value | Proxy Status |
| :--- | :--- | :--- | :--- |
| **CNAME** | `api` | `webapp-123456.pythonanywhere.com` | DNS Only |

*Find the exact value (`webapp-...`) in your PythonAnywhere Web tab.*

---

## 4. Verification Checklist

1.  **Visit `https://villen.me`**: Does the site load?
2.  **Check API**: Open Developer Tools (F12) > Network. Refresh.
    *   Are requests going to `villenbhai.pythonanywhere.com` (or `api.villen.me`)?
    *   Are they 200 OK?
3.  **Login**: Try logging in as `admin`.

**Troubleshooting CORS**:
If you see "CORS error" in console:
1.  Check PythonAnywhere WSGI file.
2.  Ensure `CORS_ALLOWED_ORIGINS` includes `https://villen.me` (no trailing slash).
3.  Reload PythonAnywhere web app.
