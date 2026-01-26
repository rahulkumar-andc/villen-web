# CSRF, Authentication & File Upload Implementation Guide

This guide shows how to integrate CSRF protection, secure authentication, and file upload security into the Villen project.

---

## Quick Start (5 minutes)

### 1. Backend Setup

```python
# settings.py

# CSRF Configuration
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_TRUSTED_ORIGINS = [
    'https://example.com',
    'https://www.example.com',
]

# Session Configuration
SESSION_COOKIE_AGE = 1800  # 30 minutes
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# File Upload Configuration
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024

# Media files (outside web root)
MEDIA_ROOT = '/var/uploads/'
MEDIA_URL = '/files/'

# Password hashers
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
]

# Password validators
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     'OPTIONS': {'min_length': 12}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
```

### 2. Frontend Setup

```jsx
// In your main App.jsx or index.jsx
import { CSRFUtils, SessionUtils } from './utils/csrfAuthUtils';
import { SecureLoginForm } from './components/SecureAuthComponents';

// Initialize session timeout warning (30 min timeout, 5 min warning)
SessionUtils.startSessionTimeoutWarning(30, 5);

// Component
function LoginPage() {
  return <SecureLoginForm onSuccess={() => window.location.href = '/dashboard'} />;
}
```

---

## CSRF Protection Implementation

### Backend Views

```python
# api/views.py

from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.http import JsonResponse
from .csrf_auth_upload_utils import CSRFProtection, csrf_protect_ajax

@ensure_csrf_cookie
@require_http_methods(['GET'])
def get_csrf_token(request):
    """Get CSRF token for frontend"""
    return JsonResponse({'csrf_token': ''})  # Token set in cookie

@csrf_protect
@require_http_methods(['POST'])
def update_profile(request):
    """Profile update endpoint (CSRF protected)"""
    try:
        data = json.loads(request.body)
        
        # Update profile
        request.user.email = data.get('email')
        request.user.save()
        
        return JsonResponse({'status': 'updated'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

# Or use decorator for AJAX endpoints
@csrf_protect_ajax
@require_http_methods(['POST'])
def delete_account(request):
    """Delete account (CSRF protected AJAX)"""
    request.user.delete()
    return JsonResponse({'status': 'deleted'})
```

### Frontend Usage

```javascript
// Before any state-changing request
import { CSRFUtils } from './utils/csrfAuthUtils';

// Make CSRF-protected request
const response = await CSRFUtils.fetch('/api/profile', {
  method: 'POST',
  body: JSON.stringify({ email: 'new@example.com' })
});

// Or form submission
function updateForm() {
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      
      const response = await CSRFUtils.fetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert('Updated');
      }
    }}>
      {/* form fields */}
    </form>
  );
}
```

---

## Secure Authentication Implementation

### Backend Setup

```python
# api/views.py

from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.models import User
from .csrf_auth_upload_utils import (
    AuthenticationSecurity,
    PasswordReset,
    rate_limit_login,
)
from django_otp.decorators import otp_required

@rate_limit_login
def login_view(request):
    """Secure login with rate limiting"""
    username = request.POST.get('username')
    password = request.POST.get('password')
    
    # Check account lockout
    if AuthenticationSecurity.is_account_locked(username):
        return JsonResponse({
            'error': 'Account locked. Try again in 30 minutes'
        }, status=429)
    
    # Authenticate
    user = authenticate(request, username=username, password=password)
    
    if user is not None and user.is_active:
        # Clear failed attempts
        AuthenticationSecurity.clear_failed_attempts(username)
        
        # Log event
        AuthenticationSecurity.log_authentication_event(user, 'login', True)
        
        # Check MFA
        if user.mfa_enabled:
            return JsonResponse({'status': 'enter_mfa'})
        
        # Login
        auth_login(request, user)
        
        return JsonResponse({'status': 'logged in'})
    else:
        # Record failed attempt
        AuthenticationSecurity.record_failed_attempt(username)
        
        # Log event
        AuthenticationSecurity.log_authentication_event(None, f'login_failed: {username}', False)
        
        return JsonResponse({'error': 'Invalid credentials'}, status=401)


def request_password_reset(request):
    """Request password reset"""
    email = request.POST.get('email')
    
    try:
        user = User.objects.get(email=email)
        
        # Generate token
        token = PasswordReset.create_reset_request(user)
        
        # Send email
        send_password_reset_email(user.email, token)
        
        # Always return same message (prevent enumeration)
        return JsonResponse({
            'status': 'If account exists, reset email sent'
        })
    except User.DoesNotExist:
        # Same response (prevent enumeration)
        return JsonResponse({
            'status': 'If account exists, reset email sent'
        })


def reset_password_view(request):
    """Reset password with token"""
    token = request.POST.get('token')
    new_password = request.POST.get('new_password')
    
    # Validate token
    reset = PasswordReset.validate_reset_token(token)
    if not reset:
        return JsonResponse({'error': 'Invalid or expired token'}, status=400)
    
    # Reset password
    success, message = PasswordReset.reset_password(reset, new_password)
    
    if success:
        return JsonResponse({'status': 'Password reset successful'})
    else:
        return JsonResponse({'error': message}, status=400)


@otp_required  # Requires MFA
def protected_endpoint(request):
    """Example protected endpoint requiring MFA"""
    return JsonResponse({'data': 'sensitive information'})
```

### Frontend Components

```jsx
import { SecureLoginForm, PasswordResetForm } from './components/SecureAuthComponents';

// Login page
function LoginPage() {
  return (
    <SecureLoginForm 
      onSuccess={() => window.location.href = '/dashboard'} 
    />
  );
}

// Password reset page
function ResetPage() {
  const token = new URLSearchParams(window.location.search).get('token');
  
  return (
    <PasswordResetForm 
      token={token}
      onSuccess={() => window.location.href = '/login'}
    />
  );
}
```

---

## File Upload Security Implementation

### Backend Handler

```python
# api/views.py

from django.views.decorators.http import require_http_methods
from .csrf_auth_upload_utils import (
    FileUploadSecurity,
    secure_upload_handler,
)
from django.contrib.auth.decorators import login_required

@login_required
@require_http_methods(['POST'])
@secure_upload_handler(file_type='image')
def upload_profile_picture(request):
    """Secure profile picture upload"""
    
    file = request.FILES['file']
    safe_filename = request.safe_filename  # Set by decorator
    
    # Store file
    from django.core.files.storage import default_storage
    
    storage_path = default_storage.save(
        f'profile_pictures/{safe_filename}',
        file
    )
    
    # Update user profile
    request.user.profile.picture = storage_path
    request.user.profile.save()
    
    return JsonResponse({
        'status': 'uploaded',
        'filename': safe_filename,
        'url': f'/api/files/{storage_path}'
    })


@login_required
@require_http_methods(['POST'])
@secure_upload_handler(file_type='document')
def upload_document(request):
    """Secure document upload"""
    
    file = request.FILES['file']
    safe_filename = request.safe_filename
    
    # Store file
    storage_path = default_storage.save(
        f'documents/{safe_filename}',
        file
    )
    
    return JsonResponse({
        'status': 'uploaded',
        'filename': safe_filename
    })


@login_required
@require_http_methods(['GET'])
def download_file(request, file_id):
    """Download file through application (not direct access)"""
    
    # Check authorization
    try:
        file_obj = UserFile.objects.get(id=file_id, user=request.user)
    except UserFile.DoesNotExist:
        return JsonResponse({'error': 'File not found'}, status=404)
    
    # Return file
    from django.http import FileResponse
    response = FileResponse(default_storage.open(file_obj.path, 'rb'))
    response['Content-Disposition'] = f'attachment; filename="{file_obj.name}"'
    response['Content-Type'] = 'application/octet-stream'
    
    return response
```

### Frontend Component

```jsx
import { SecureFileUpload } from './components/SecureAuthComponents';

function ProfilePage() {
  return (
    <div>
      <h2>Upload Profile Picture</h2>
      <SecureFileUpload 
        fileType="image"
        onSuccess={(result) => {
          console.log('Uploaded:', result);
          window.location.reload();
        }}
      />
    </div>
  );
}
```

---

## HTML Template Setup

```html
<!DOCTYPE html>
<html>
<head>
    <!-- CSRF Token -->
    {% csrf_token %}
    <meta name="csrf-token" content="{{ csrf_token }}">
</head>
<body>
    <!-- Your content -->
</body>
</html>
```

---

## Configuration Checklist

### Backend
- [ ] CSRF_COOKIE_SECURE = True
- [ ] CSRF_COOKIE_HTTPONLY = False
- [ ] CSRF_COOKIE_SAMESITE = 'Lax'
- [ ] CSRF_TRUSTED_ORIGINS configured
- [ ] SESSION_COOKIE_AGE set to 30 minutes
- [ ] SESSION_EXPIRE_AT_BROWSER_CLOSE = True
- [ ] SESSION_COOKIE_SECURE = True
- [ ] SESSION_COOKIE_HTTPONLY = True
- [ ] PASSWORD_HASHERS uses Argon2 first
- [ ] AUTH_PASSWORD_VALIDATORS configured (min 12 chars)
- [ ] FILE_UPLOAD_MAX_MEMORY_SIZE set
- [ ] MEDIA_ROOT outside web root
- [ ] Login endpoint has rate limiting
- [ ] Account lockout implemented
- [ ] MFA configured for sensitive endpoints

### Frontend
- [ ] CSRFUtils.fetch() used for all POST/PUT/DELETE
- [ ] Login form uses SecureLoginForm component
- [ ] File upload uses SecureFileUpload component
- [ ] Session timeout warning implemented
- [ ] Password strength validator shown
- [ ] File validation before upload
- [ ] CSRF token in meta tag

---

## Testing

### Backend Tests

```python
from django.test import TestCase, Client
from django.contrib.auth.models import User

class SecurityTests(TestCase):
    
    def test_csrf_protection(self):
        """POST without CSRF token should fail"""
        response = self.client.post('/api/profile', {'email': 'test@example.com'})
        self.assertEqual(response.status_code, 403)
    
    def test_account_lockout(self):
        """Account locks after failed attempts"""
        for i in range(6):
            self.client.post('/api/login', {
                'username': 'user',
                'password': 'wrong'
            })
        
        # Should be locked
        response = self.client.post('/api/login', {
            'username': 'user',
            'password': 'correct'
        })
        self.assertEqual(response.status_code, 429)
    
    def test_file_upload_validation(self):
        """Invalid files should be rejected"""
        with open('shell.php', 'rb') as f:
            response = self.client.post(
                '/api/upload/image',
                {'file': f}
            )
        self.assertEqual(response.status_code, 400)
```

---

## Common Patterns

### Protecting an API Endpoint

```python
from django.contrib.auth.decorators import login_required
from .csrf_auth_upload_utils import csrf_protect_ajax

@login_required
@csrf_protect_ajax
def my_endpoint(request):
    # CSRF token automatically validated
    # User is authenticated
    pass
```

### Handling File Uploads

```python
@login_required
@secure_upload_handler(file_type='image')
def upload(request):
    # file = request.FILES['file']  
    # safe_filename = request.safe_filename  (auto-generated)
    pass
```

### Making Safe Requests

```javascript
// Instead of:
fetch('/api/update', {
  method: 'POST',
  body: JSON.stringify(data)
})

// Use:
CSRFUtils.fetch('/api/update', {
  method: 'POST',
  body: JSON.stringify(data)
})
```

---

## Security Headers

Add to your Django settings:

```python
# settings.py

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_SECURITY_POLICY = {
    "default-src": ("'self'",),
    "script-src": ("'self'", "'unsafe-inline'"),
    "style-src": ("'self'", "'unsafe-inline'"),
    "img-src": ("'self'", "data:", "https:"),
    "font-src": ("'self'",),
    "connect-src": ("'self'",),
    "frame-ancestors": ("'none'",),
    "base-uri": ("'self'",),
    "form-action": ("'self'",),
}

X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

---

## Nginx Configuration for File Uploads

```nginx
# Disable script execution in upload directory
location /uploads/ {
    # Block dangerous extensions
    location ~ \.(php|php3|php4|php5|phtml|jsp|asp|aspx)$ {
        deny all;
    }
    
    # Force download
    default_type application/octet-stream;
    add_header Content-Disposition "attachment";
}
```

---

## Deployment Checklist

- [ ] Enable HTTPS everywhere (CSRF depends on it)
- [ ] Set SECURE_PROXY_SSL_HEADER if behind proxy
- [ ] Configure CSRF_TRUSTED_ORIGINS for all domains
- [ ] Set SESSION_COOKIE_SECURE = True in production
- [ ] Configure password reset email backend
- [ ] Set up ClamAV for virus scanning (optional)
- [ ] Configure rate limiting at load balancer
- [ ] Monitor failed login attempts
- [ ] Review security logs regularly
- [ ] Backup and restore plan for file uploads

