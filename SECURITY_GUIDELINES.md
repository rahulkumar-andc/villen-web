# 🔐 Security Guidelines for Developers

**Version**: 1.0  
**Last Updated**: January 25, 2026  
**Audience**: Development Team

---

## 📋 Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Data Protection](#data-protection)
3. [API Security](#api-security)
4. [Frontend Security](#frontend-security)
5. [Infrastructure Security](#infrastructure-security)
6. [Incident Response](#incident-response)
7. [Security Checklist](#security-checklist)

---

## Authentication & Authorization

### JWT Token Management

**✅ DO**:
```javascript
// Store token securely
localStorage.setItem('token', jwtToken);

// Include in all API requests
const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
};

// Refresh before expiry
const refreshToken = async () => {
    const response = await fetch('/api/auth/token/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh: refreshToken }),
    });
    // Update token from response
};
```

**❌ DON'T**:
```javascript
// ❌ Don't expose token in logs
console.log('Token:', token);

// ❌ Don't include token in URL
fetch(`/api/data?token=${token}`);

// ❌ Don't cache token in sessionStorage permanently
// ❌ Don't hardcode token in code
```

### Role-Based Access Control

**✅ DO**:
```python
# Backend: Check permissions in views
from api.permissions import IsAdminOrReadOnly

class SensitiveDataView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    
    def delete(self, request, pk):
        # Only admins can delete
        self.check_object_permissions(request, obj)
        obj.delete()
        return Response(status=204)
```

**✅ DO**:
```javascript
// Frontend: Check user role before rendering
const { user } = useAuth();

if (user?.role !== 'admin') {
    return <Forbidden />;
}

return <AdminPanel />;
```

**❌ DON'T**:
```javascript
// ❌ Don't trust frontend-only role checks
// ❌ Don't allow user to modify their own role
// ❌ Don't expose sensitive endpoints without auth
```

---

## Data Protection

### Password Security

**✅ DO**:
```python
# Backend: Use Django's password validation
from django.contrib.auth.password_validation import validate_password

def set_password(user, new_password):
    try:
        validate_password(new_password, user=user)
        user.set_password(new_password)
        user.save()
    except ValidationError as e:
        return {'error': str(e)}
```

**✅ DO**:
```javascript
// Frontend: Validate password strength
const passwordSchema = z.string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Must include uppercase letter")
    .regex(/[a-z]/, "Must include lowercase letter")
    .regex(/[0-9]/, "Must include number")
    .regex(/[@$!%*?&]/, "Must include special character");
```

**❌ DON'T**:
```python
# ❌ Don't store passwords in logs
# ❌ Don't transmit passwords over HTTP
# ❌ Don't use weak hashing (MD5, SHA1)
# ❌ Don't salt passwords manually
```

### Sensitive Data Handling

**✅ DO**:
```python
# Encrypt sensitive fields
from django_encrypted_model_fields.fields import EncryptedCharField

class UserProfile(models.Model):
    ssn = EncryptedCharField(max_length=11)  # Encrypted at rest
    phone = EncryptedCharField(max_length=20)
```

**✅ DO**:
```javascript
// Clear sensitive data from memory
const sensitiveData = {
    ssn: '123-45-6789',
    // ... sensitive info
};

// After use, clear it
Object.keys(sensitiveData).forEach(key => {
    sensitiveData[key] = null;
});
```

**❌ DON'T**:
```python
# ❌ Don't store PII in logs
# ❌ Don't commit .env files to git
# ❌ Don't hardcode API keys
# ❌ Don't pass secrets in URLs
```

---

## API Security

### Input Validation

**✅ DO**:
```python
# Backend: Validate all inputs
from django.core.exceptions import ValidationError

def clean_email(email):
    email = email.strip().lower()
    if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
        raise ValidationError('Invalid email format')
    return email
```

**✅ DO**:
```javascript
// Frontend: Use Zod for validation
const contactSchema = z.object({
    email: z.string().email('Invalid email'),
    message: z.string().min(10).max(1000),
    name: z.string().min(2).max(100),
});

const { data, error } = contactSchema.safeParse(formData);
if (error) {
    // Display validation errors
}
```

**❌ DON'T**:
```python
# ❌ Don't trust frontend validation alone
# ❌ Don't skip validation on "simple" fields
# ❌ Don't use regex directly without validation library
request.GET['user_id']  # ❌ Never use untrusted input directly
```

### CORS & CSRF Protection

**✅ DO**:
```python
# Backend: Restrict CORS in production
if not DEBUG:
    CORS_ALLOWED_ORIGINS = [
        'https://villen.me',
        'https://www.villen.me',
    ]
    CORS_ALLOWED_ORIGIN_REGEXES = [r"^https://.*\.villen\.me$"]
    
    # Enable CSRF protection
    CSRF_TRUSTED_ORIGINS = [
        'https://villen.me',
        'https://www.villen.me',
    ]
```

**✅ DO**:
```javascript
// Frontend: Include CSRF token in requests
const getCsrfToken = () => {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) return decodeURIComponent(value);
    }
    return '';
};

fetch('/api/data/', {
    method: 'POST',
    headers: {
        'X-CSRFToken': getCsrfToken(),
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
});
```

**❌ DON'T**:
```python
# ❌ Don't allow all CORS origins in production
CORS_ALLOW_ALL_ORIGINS = True  # ❌ NEVER in production!

# ❌ Don't disable CSRF protection
@csrf_exempt  # ❌ Only if you know what you're doing
```

### Rate Limiting

**✅ DO**:
```python
# Backend: Configure DRF throttling
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',    # Limit anonymous users
        'user': '1000/hour',   # Limit authenticated users
    }
}

# Or per-view:
class MyView(ViewSet):
    throttle_classes = [UserRateThrottle]
    throttle_scope = 'auth'
```

**❌ DON'T**:
```python
# ❌ Don't disable rate limiting
# ❌ Don't use same limit for all endpoints
# ❌ Don't ignore 429 responses from API
```

---

## Frontend Security

### XSS Prevention

**✅ DO**:
```jsx
// React auto-escapes by default
const Component = ({ userInput }) => {
    return <div>{userInput}</div>; // Safe - auto-escaped
};

// Use ErrorBoundary for safety
<ErrorBoundary fallback={<ErrorUI />}>
    <UserContent />
</ErrorBoundary>
```

**✅ DO**:
```javascript
// Sanitize HTML if needed
import DOMPurify from 'dompurify';

const cleanHTML = DOMPurify.sanitize(userHTML);
return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
```

**❌ DON'T**:
```jsx
// ❌ Never use dangerouslySetInnerHTML with unsanitized input
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ❌ Don't insert unsanitized data into templates
const html = `<div>${userInput}</div>`;
document.innerHTML = html;

// ❌ Don't eval user input
eval(userCode);  // ❌ NEVER!
```

### Dependencies Security

**✅ DO**:
```bash
# Regularly audit dependencies
npm audit
npm audit fix

# Keep dependencies updated
npm update

# Review new packages before installing
npm info package-name

# Use lock files
# Commit package-lock.json to git
```

**❌ DON'T**:
```bash
# ❌ Don't ignore npm audit warnings
# ❌ Don't skip dependency updates
# ❌ Don't use `npm install --no-save`
# ❌ Don't commit node_modules to git
```

### Environment Variables

**✅ DO**:
```javascript
// Use environment variables for config
const API_URL = import.meta.env.VITE_API_URL;
const IS_PRODUCTION = import.meta.env.PROD;

// Create .env.example template
// Never commit .env to git
```

**❌ DON'T**:
```javascript
// ❌ Don't hardcode API URLs
const API_URL = 'https://api.example.com';  // ❌

// ❌ Don't expose secrets in frontend code
const SECRET_KEY = 'sk_live_abcd1234xyz';  // ❌

// ❌ Don't commit .env files
git add .env  // ❌
```

---

## Infrastructure Security

### SSL/TLS

**✅ DO**:
```python
# Django: Force HTTPS in production
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
```

**✅ DO**:
```nginx
# Nginx: Force HTTPS
server {
    listen 80;
    server_name villen.me;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
}
```

**❌ DON'T**:
```python
# ❌ Don't disable HTTPS in production
SECURE_SSL_REDIRECT = False
```

### Logging & Monitoring

**✅ DO**:
```python
# Backend: Log security events
import logging

security_logger = logging.getLogger('django.security')

# Log failed logins
security_logger.warning(
    'Failed login attempt',
    extra={
        'ip': client_ip,
        'username': username,
        'timestamp': timezone.now(),
    }
)

# Log sensitive operations
security_logger.info(
    'Admin action: user deletion',
    extra={
        'admin_user': request.user.username,
        'target_user': deleted_user.username,
        'timestamp': timezone.now(),
    }
)
```

**❌ DON'T**:
```python
# ❌ Don't log passwords
security_logger.info(f'User {username} logged in with password {password}')

# ❌ Don't log payment info
security_logger.info(f'Credit card: {card_number}')

# ❌ Don't disable logging in production
LOGGING_ENABLED = False
```

---

## Incident Response

### Security Incident Procedures

**If you discover a vulnerability:**

1. **STOP** - Don't share details publicly
2. **REPORT** - Email security@villen.me immediately
3. **DOCUMENT** - Record details for investigation
4. **PATCH** - Create fix in private branch
5. **TEST** - Verify fix thoroughly
6. **DEPLOY** - Release to production
7. **AUDIT** - Check logs for exploitation
8. **NOTIFY** - Inform affected users if needed

### Password Breach Response

```python
# If a password is compromised:
user = User.objects.get(email='user@example.com')

# Force password reset
user.set_password('temporary-secure-password')
user.save()

# Blacklist all tokens
from rest_framework_simplejwt.models import OutstandingToken
OutstandingToken.objects.filter(user=user).delete()

# Send notification
send_email('Password Reset Required', user.email, template='password_reset')
```

---

## Security Checklist

### Before Each Commit

- [ ] No secrets in code (API keys, passwords, tokens)
- [ ] No console.log statements in production code
- [ ] All inputs validated (frontend & backend)
- [ ] All API calls authenticated
- [ ] Error messages don't leak information
- [ ] Dependencies up to date (`npm audit`, `pip check`)
- [ ] No hardcoded URLs/domains
- [ ] HTTPS enabled for all API calls
- [ ] CORS properly configured
- [ ] CSRF tokens included in forms
- [ ] Rate limiting applied

### Before Each Deployment

- [ ] DEBUG = False in production settings
- [ ] SECRET_KEY is unique and random
- [ ] ALLOWED_HOSTS configured correctly
- [ ] Database password not visible in logs
- [ ] SSL certificates valid
- [ ] All environment variables set
- [ ] Security headers enabled
- [ ] Error reporting configured (Sentry)
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Security logs monitored

### Weekly Security Review

- [ ] Review logs for suspicious activity
- [ ] Check for failed login attempts
- [ ] Monitor error rates
- [ ] Review new dependencies
- [ ] Check for security advisories
- [ ] Verify backups are working
- [ ] Test incident response plan

### Monthly Security Audit

- [ ] Run `npm audit` and fix issues
- [ ] Run `pip check` and update packages
- [ ] Review user permissions
- [ ] Check for orphaned API keys
- [ ] Verify SSL certificate expiry
- [ ] Review CORS configuration
- [ ] Check password policy compliance
- [ ] Audit administrative access

---

## 📞 Security Contact

**Email**: security@villen.me  
**Response Time**: 24 hours  
**Confidential**: Yes  

Please report any security concerns immediately.

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security](https://docs.djangoproject.com/en/5.0/topics/security/)
- [React Security](https://react.dev/reference/react-dom/createRoot#handle-errors-in-react-with-onerror)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE Top 25](https://cwe.mitre.org/top25/)

---

**Last Updated**: January 25, 2026  
**Version**: 1.0  
**Status**: Active
