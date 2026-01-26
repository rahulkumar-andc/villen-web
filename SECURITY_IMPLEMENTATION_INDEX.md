# Villen Web Security Implementation Index

Complete security hardening guides for the Villen Web platform.

## Overview

This index documents all security implementations covering the OWASP Top 10 vulnerabilities.

---

## Phase 1: SQL Injection & XSS Protection ✅

### Documentation
- [SQLI_PREVENTION_GUIDE.md](SQLI_PREVENTION_GUIDE.md) - SQL Injection prevention (2500+ lines)
- [XSS_PREVENTION_GUIDE.md](XSS_PREVENTION_GUIDE.md) - Cross-Site Scripting prevention (2500+ lines)

### Code Files
- `backend/api/security_utils.py` - Backend utilities for SQLi/XSS prevention
- `frontend/src/utils/securityUtils.js` - Frontend utilities for XSS prevention
- `frontend/src/components/SafeHtmlRenderer.jsx` - React component for safe HTML rendering

### Coverage
- **SQL Injection**: 6 attack types, 5 protection mechanisms
- **XSS**: 7 attack types, 6 protection mechanisms

---

## Phase 2: CSRF, Authentication & File Upload ✅

### Documentation
- [CSRF_PREVENTION_GUIDE.md](CSRF_PREVENTION_GUIDE.md) - CSRF protection (2500+ lines)
- [AUTH_SECURITY_GUIDE.md](AUTH_SECURITY_GUIDE.md) - Authentication security (3000+ lines)
- [FILE_UPLOAD_SECURITY_GUIDE.md](FILE_UPLOAD_SECURITY_GUIDE.md) - File upload security (3000+ lines)
- [CSRF_AUTH_UPLOAD_IMPLEMENTATION.md](CSRF_AUTH_UPLOAD_IMPLEMENTATION.md) - Integration guide (500+ lines)

### Code Files
- `backend/api/csrf_auth_upload_utils.py` - Backend utilities for CSRF, auth, file upload (400+ lines)
- `frontend/src/utils/csrfAuthUtils.js` - Frontend utilities (350+ lines)
- `frontend/src/components/SecureAuthComponents.jsx` - React authentication components (450+ lines)

### Coverage
- **CSRF**: 4 attack types, 5 protection mechanisms, 1 decorator
- **Authentication**: 8 attack types, 7 protection mechanisms, rate limiting, MFA support
- **File Upload**: 7 attack types, 8 protection mechanisms, magic bytes validation

---

## Vulnerability Matrix

| Vulnerability | Type | Status | Guide | Code |
|---|---|---|---|---|
| SQL Injection | OWASP A03 | ✅ Complete | [SQLI_PREVENTION_GUIDE.md](SQLI_PREVENTION_GUIDE.md) | `security_utils.py` |
| XSS | OWASP A03 | ✅ Complete | [XSS_PREVENTION_GUIDE.md](XSS_PREVENTION_GUIDE.md) | `securityUtils.js`, `SafeHtmlRenderer.jsx` |
| CSRF | OWASP A01 | ✅ Complete | [CSRF_PREVENTION_GUIDE.md](CSRF_PREVENTION_GUIDE.md) | `csrf_auth_upload_utils.py` |
| Broken Auth | OWASP A01 | ✅ Complete | [AUTH_SECURITY_GUIDE.md](AUTH_SECURITY_GUIDE.md) | `csrf_auth_upload_utils.py` |
| File Upload | OWASP A04 | ✅ Complete | [FILE_UPLOAD_SECURITY_GUIDE.md](FILE_UPLOAD_SECURITY_GUIDE.md) | `csrf_auth_upload_utils.py` |

---

## Quick Reference by Use Case

### I need to protect a form from CSRF
→ See [CSRF_PREVENTION_GUIDE.md](CSRF_PREVENTION_GUIDE.md) Section 1
→ Use `@csrf_protect` decorator in Django
→ Use `CSRFUtils.fetch()` in frontend

### I need to secure the login endpoint
→ See [AUTH_SECURITY_GUIDE.md](AUTH_SECURITY_GUIDE.md) Sections 3-5
→ Use `@rate_limit_login` decorator
→ Use `SecureLoginForm` component in frontend
→ Implement account lockout (5 failures = 30 min lockout)

### I need to safely accept file uploads
→ See [FILE_UPLOAD_SECURITY_GUIDE.md](FILE_UPLOAD_SECURITY_GUIDE.md) Section 4
→ Use `@secure_upload_handler` decorator
→ Use `SecureFileUpload` component in frontend
→ Validate extension, MIME type, file content (magic bytes)

### I need to prevent SQL injection
→ See [SQLI_PREVENTION_GUIDE.md](SQLI_PREVENTION_GUIDE.md) Section 2
→ Always use parameterized queries
→ Use Django ORM (built-in protection)
→ Never concatenate user input into SQL

### I need to prevent XSS attacks
→ See [XSS_PREVENTION_GUIDE.md](XSS_PREVENTION_GUIDE.md) Section 2
→ Use `SafeHtmlRenderer` component for user HTML
→ Use `DOMPurify` library for sanitization
→ Use Content-Security-Policy header

---

## Implementation Timeline

### Week 1: Core Setup
- [ ] Review CSRF_PREVENTION_GUIDE.md
- [ ] Review AUTH_SECURITY_GUIDE.md
- [ ] Configure Django settings (session, CSRF, password hashing)
- [ ] Copy `csrf_auth_upload_utils.py` to backend
- [ ] Copy `csrfAuthUtils.js` to frontend

### Week 2: Authentication
- [ ] Replace login form with `SecureLoginForm`
- [ ] Implement account lockout
- [ ] Set up password reset flow
- [ ] Test login with rate limiting
- [ ] Test MFA (if configured)

### Week 3: File Uploads
- [ ] Review FILE_UPLOAD_SECURITY_GUIDE.md
- [ ] Replace file upload with `SecureFileUpload`
- [ ] Configure upload directory (outside web root)
- [ ] Test file validation (reject .php, etc.)
- [ ] Configure Nginx/Apache to disable execution

### Week 4: Testing & Hardening
- [ ] Run security test suite
- [ ] Test CSRF protection
- [ ] Test account lockout
- [ ] Test file upload blocking
- [ ] Configure security headers

---

## Code Integration Examples

### Django Settings

```python
# settings.py

# CSRF
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = 'Lax'

# Session
SESSION_COOKIE_AGE = 1800  # 30 minutes
SESSION_COOKIE_SECURE = True

# Password hashing
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
]

# File uploads
MEDIA_ROOT = '/var/uploads/'  # Outside web root
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5MB
```

### Django Views

```python
from .csrf_auth_upload_utils import (
    csrf_protect_ajax,
    rate_limit_login,
    secure_upload_handler,
)

@csrf_protect_ajax
def update_user(request):
    # CSRF protected, logs attempts
    pass

@rate_limit_login
def login(request):
    # Rate limited, account lockout support
    pass

@secure_upload_handler(file_type='image')
def upload_image(request):
    # File validated, safe filename provided
    pass
```

### React Components

```jsx
import { SecureLoginForm, SecureFileUpload } from './components/SecureAuthComponents';

// Login
<SecureLoginForm onSuccess={() => redirect('/dashboard')} />

// File upload
<SecureFileUpload 
  fileType="image"
  onSuccess={(result) => console.log('Uploaded:', result)}
/>
```

### Frontend API Calls

```javascript
import { CSRFUtils, AuthUtils } from './utils/csrfAuthUtils';

// CSRF-protected request
await CSRFUtils.fetch('/api/update', {
  method: 'POST',
  body: JSON.stringify(data)
});

// Login
const result = await AuthUtils.login(username, password, mfaCode);

// File upload
await FileUploadUtils.uploadFile('/api/upload/image', file);
```

---

## Common Patterns

### Protecting an Endpoint

```python
# Make it CSRF protected
@csrf_protect
@login_required
def sensitive_endpoint(request):
    pass

# Or for AJAX
@csrf_protect_ajax
def api_endpoint(request):
    pass

# Or rate-limited login
@rate_limit_login
def login_endpoint(request):
    pass
```

### Validating Files

```python
# Use decorator
@secure_upload_handler(file_type='image')
def upload_image(request):
    file = request.FILES['file']
    safe_filename = request.safe_filename  # Auto-generated UUID
    
    # File is already validated:
    # ✓ Extension whitelist checked
    # ✓ MIME type verified
    # ✓ Magic bytes validated
    # ✓ Size limits enforced
    # ✓ Filename is UUID-based (safe)
```

### Making Safe Requests

```javascript
// ✗ Wrong (no CSRF token)
fetch('/api/data', { method: 'POST', body: data });

// ✓ Right (includes CSRF token)
CSRFUtils.fetch('/api/data', { method: 'POST', body: data });
```

---

## Security Checklist

### Before Going to Production

**Backend**
- [ ] CSRF enabled (CSRF_COOKIE_SECURE, CSRF_COOKIE_SAMESITE)
- [ ] Sessions configured (secure, httponly, timeout)
- [ ] Password hashing using Argon2
- [ ] Account lockout after failed attempts
- [ ] Login rate limiting (10/min)
- [ ] File upload validation (extension, MIME, content)
- [ ] File storage outside web root
- [ ] Nginx/Apache execution disabled in upload dirs
- [ ] Password reset tokens expire (1 hour)
- [ ] Security logging enabled
- [ ] HTTPS only (SECURE_SSL_REDIRECT)

**Frontend**
- [ ] CSRFUtils.fetch() used for all state-changing requests
- [ ] Login form uses SecureLoginForm
- [ ] File upload uses SecureFileUpload
- [ ] Password strength validation shown
- [ ] Session timeout warning at 5 min
- [ ] No sensitive data in localStorage
- [ ] Content-Security-Policy header set
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff

**Deployment**
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CSRF_TRUSTED_ORIGINS set
- [ ] Rate limiting at load balancer
- [ ] File upload directory backed up
- [ ] Failed logins monitored
- [ ] Security logs reviewed daily

---

## Testing

### CSRF Testing

```bash
# Test 1: POST without CSRF token should fail
curl -X POST https://example.com/api/update \
  -d '{"key":"value"}' \
  -H "Content-Type: application/json"
# Expected: 403 Forbidden

# Test 2: POST with CSRF token should succeed
TOKEN=$(curl https://example.com/api/csrf-token | jq .token)
curl -X POST https://example.com/api/update \
  -d '{"key":"value"}' \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $TOKEN"
# Expected: 200 OK
```

### Authentication Testing

```bash
# Test 1: Failed login attempts should lock account
for i in {1..6}; do
  curl -X POST https://example.com/api/login \
    -d "username=test&password=wrong"
done
# Expected: 5th attempt succeeds, 6th fails with 429 (Too Many Requests)

# Test 2: Password should be strong
curl -X POST https://example.com/api/register \
  -d "password=123"  # Too weak
# Expected: 400 Bad Request

# Test 3: Reset token should expire
curl -X POST https://example.com/api/reset \
  -d "token=old_token&password=NewPass123"
# Expected: 400 if token older than 1 hour
```

### File Upload Testing

```bash
# Test 1: PHP upload should be rejected
echo '<?php system($_GET["cmd"]); ?>' > shell.php
curl -F "file=@shell.php" https://example.com/api/upload/image
# Expected: 400 Bad Request

# Test 2: Valid image should be accepted
curl -F "file=@photo.jpg" https://example.com/api/upload/image
# Expected: 200 OK

# Test 3: Oversized file should be rejected
dd if=/dev/zero of=large.jpg bs=1M count=10
curl -F "file=@large.jpg" https://example.com/api/upload/image
# Expected: 413 Payload Too Large
```

---

## File Organization

```
/home/villen/Desktop/villen-web/
├── CSRF_PREVENTION_GUIDE.md                    ← CSRF attacks & protection
├── AUTH_SECURITY_GUIDE.md                      ← Authentication security
├── FILE_UPLOAD_SECURITY_GUIDE.md               ← File upload security
├── SQLI_PREVENTION_GUIDE.md                    ← SQL injection prevention
├── XSS_PREVENTION_GUIDE.md                     ← XSS prevention
├── CSRF_AUTH_UPLOAD_IMPLEMENTATION.md          ← Integration guide (THIS FILE)
├── backend/
│   └── api/
│       ├── csrf_auth_upload_utils.py           ← Backend utilities
│       └── views.py                            ← Use decorators here
├── frontend/
│   └── src/
│       ├── utils/
│       │   └── csrfAuthUtils.js                ← Frontend utilities
│       └── components/
│           ├── SecureAuthComponents.jsx        ← Auth components
│           └── SecureFileUpload.jsx            ← Upload component
```

---

## Support & Debugging

### CSRF Token Not Working

**Check:**
```javascript
// 1. Token is in DOM
const token = document.querySelector('[name=csrfmiddlewaretoken]').value;
console.log('Token:', token);

// 2. Token is in request headers
const headers = {
  'X-CSRFToken': token,
  'Content-Type': 'application/json'
};

// 3. Cookies are allowed
document.cookie  // Should show csrf token
```

### Login Rate Limiting Issues

**Symptoms:**
- Can't login after several failed attempts

**Solution:**
```python
from .csrf_auth_upload_utils import AuthenticationSecurity

# Check if account is locked
is_locked = AuthenticationSecurity.is_account_locked('username')
print(f"Account locked: {is_locked}")

# Manually clear (admin only)
AuthenticationSecurity.clear_failed_attempts('username')
```

### File Upload Not Working

**Check:**
1. File extension is whitelisted
2. File size is under limit
3. File is real image/document (magic bytes)
4. Upload directory is writable
5. Storage path is outside web root

**Test:**
```python
from .csrf_auth_upload_utils import FileUploadSecurity

validator = FileUploadSecurity()
result = validator.validate_upload(file)
print(f"Valid: {result['valid']}")
print(f"Errors: {result.get('errors', [])}")
```

---

## Next Steps

1. **Read the guides** - Start with CSRF_AUTH_UPLOAD_IMPLEMENTATION.md (this file)
2. **Update settings.py** - Configure CSRF, sessions, password hashing
3. **Copy utilities** - Add csrf_auth_upload_utils.py to backend/api/
4. **Update views** - Use decorators on endpoints
5. **Update frontend** - Replace forms with secure components
6. **Test thoroughly** - Run security tests before deployment
7. **Monitor** - Check security logs regularly

---

## Questions?

Refer to:
- CSRF_PREVENTION_GUIDE.md for CSRF questions
- AUTH_SECURITY_GUIDE.md for authentication questions
- FILE_UPLOAD_SECURITY_GUIDE.md for file upload questions
- SQLI_PREVENTION_GUIDE.md for SQL injection questions
- XSS_PREVENTION_GUIDE.md for XSS questions

All guides include:
- Real attack examples
- Protection mechanisms
- Code implementations
- Test cases
- Common mistakes
