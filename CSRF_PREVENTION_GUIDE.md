# Cross-Site Request Forgery (CSRF) Prevention Guide

**OWASP Top 10 (2021)**: A01:2021 – Broken Access Control (related)  
**Severity**: 🔴 High  
**Exploitability**: Medium  
**Impact**: High (unauthorized actions on user accounts)

---

## Table of Contents
1. [What is CSRF?](#what-is-csrf)
2. [Attack Types](#attack-types)
3. [Vulnerable Code Examples](#vulnerable-code-examples)
4. [Protection Mechanisms](#protection-mechanisms)
5. [Implementation Guide](#implementation-guide)
6. [Code Audit Checklist](#code-audit-checklist)
7. [Testing Procedures](#testing-procedures)

---

## What is CSRF?

### Definition
**Cross-Site Request Forgery (CSRF)** is an attack where an attacker tricks a user into performing unwanted actions on a website where they're authenticated, without their knowledge or consent.

### How It Works
```
1. User logs into their bank (bank.com)
2. User visits attacker's site (evil.com) WITHOUT logging out
3. evil.com contains: <img src="bank.com/transfer?amount=1000&to=attacker">
4. Browser automatically includes user's bank cookies
5. Bank receives authenticated request and transfers money
6. User doesn't know it happened
```

### Real-World Impact
- 💰 Unauthorized financial transfers
- 🔐 Password changes
- 📧 Email address changes
- 👤 Profile modifications
- 🗑️ Account deletion
- 📤 Data exfiltration

### Why It's Dangerous
- **Silent attacks**: User doesn't realize they happened
- **High impact**: Full account compromise
- **Easy to exploit**: Simple HTML/JavaScript
- **Cross-origin**: Attacker on different domain

---

## Attack Types

### 1. Simple GET-Based CSRF

**Attack Vector**:
```html
<!-- On attacker's website -->
<img src="https://bank.com/api/transfer?amount=1000&to_account=12345">
```

**How It Works**:
```
GET /api/transfer?amount=1000&to_account=12345 HTTP/1.1
Host: bank.com
Cookie: session_id=user_session_token
```

**Impact**: Bank transfers, account changes, data deletion

---

### 2. Form-Based CSRF

**Attack Vector**:
```html
<form action="https://bank.com/api/change-password" method="POST" style="display:none;">
  <input name="old_password" value="doesntmatter">
  <input name="new_password" value="attacker123">
  <input name="confirm_password" value="attacker123">
</form>
<script>
  document.forms[0].submit(); // Auto-submit without user knowing
</script>
```

**How It Works**:
```
POST /api/change-password HTTP/1.1
Host: bank.com
Cookie: session_id=user_session_token
Content-Type: application/x-www-form-urlencoded

old_password=doesntmatter&new_password=attacker123&confirm_password=attacker123
```

**Impact**: Password change, email change, permission escalation

---

### 3. JSON-Based CSRF

**Attack Vector**:
```html
<script>
fetch('https://api.example.com/api/users/profile', {
  method: 'POST',
  credentials: 'include',  // Include cookies
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'attacker@evil.com',
    role: 'admin'
  })
});
</script>
```

**How It Works**:
```
POST /api/users/profile HTTP/1.1
Host: api.example.com
Cookie: session_id=user_session_token
Content-Type: application/json

{"email":"attacker@evil.com","role":"admin"}
```

**Impact**: Account takeover, privilege escalation

---

### 4. Referer-Header Based CSRF

**Attack Vector** (when CSRF protection relies only on checking Referer):
```html
<!-- Attacker uses meta tag to hide referer -->
<meta name="referrer" content="no-referrer">
<form action="https://bank.com/api/transfer" method="POST">
  <input name="amount" value="10000">
</form>
<script>document.forms[0].submit();</script>
```

**How It Works**:
- Request sent without Referer header
- Vulnerable server (checking only Referer) accepts it
- Attack succeeds

**Impact**: Bypasses weak CSRF protection

---

## Vulnerable Code Examples

### ❌ Vulnerable Example 1: No CSRF Protection

**Backend (Django)**:
```python
from django.http import JsonResponse
from django.views.decorators.http import require_POST

@require_POST  # Only checks method, not CSRF token
def transfer_money(request):
    amount = request.POST.get('amount')
    to_account = request.POST.get('to_account')
    
    # Directly process without CSRF validation
    Transfer.objects.create(
        user=request.user,
        amount=amount,
        to_account=to_account
    )
    
    return JsonResponse({'status': 'success'})
```

**Attack**:
```html
<form action="https://bank.com/api/transfer" method="POST">
  <input name="amount" value="10000">
  <input name="to_account" value="attacker_account">
</form>
<script>document.forms[0].submit();</script>
```

**Result**: ✅ Attack succeeds - money transferred!

---

### ❌ Vulnerable Example 2: Custom CSRF Check (Incomplete)

**Backend**:
```python
def update_profile(request):
    # Only checks if request is JSON (incomplete protection)
    if request.content_type == 'application/json':
        data = json.loads(request.body)
        
        # No CSRF token verification!
        user = request.user
        user.email = data['email']
        user.save()
        
        return JsonResponse({'status': 'updated'})
    
    return JsonResponse({'error': 'Invalid request'}, status=400)
```

**Attack**:
```javascript
// attacker.com
fetch('https://bank.com/api/profile', {
  method: 'POST',
  credentials: 'include',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'hacked@attacker.com'})
});
```

**Result**: ✅ Attack succeeds - email changed!

---

### ❌ Vulnerable Example 3: Weak Referer Check

**Backend**:
```python
def delete_account(request):
    referer = request.META.get('HTTP_REFERER', '')
    
    # Weak check - what if referer is empty or mismatched?
    if 'example.com' not in referer:
        return JsonResponse({'error': 'Invalid referer'}, status=403)
    
    # Process deletion
    request.user.delete()
    return JsonResponse({'status': 'deleted'})
```

**Attack** (hide referer):
```html
<meta name="referrer" content="no-referrer">
<form action="https://example.com/api/delete-account" method="POST">
</form>
<script>document.forms[0].submit();</script>
```

**Result**: ✅ Attack succeeds - no referer, server accepts it!

---

### ❌ Vulnerable Example 4: CSRF Token in Cookie Only

**Frontend**:
```javascript
// Bad: token only in cookie
const csrfToken = getCookie('csrf_token');
// But doesn't send it in headers or body!

fetch('/api/update', {
  method: 'POST',
  body: JSON.stringify({data: 'value'})
  // csrf_token not sent!
});
```

**Attack**:
```javascript
// Attacker's site can also read and use the cookie
// Or browser automatically includes it anyway
```

**Result**: ✅ Attack succeeds - token not validated!

---

## Protection Mechanisms

### 1. ✅ CSRF Token (Synchronizer Token Pattern)

**How It Works**:
```
1. Server generates unique token per session
2. Token sent to frontend in form/meta tag
3. Frontend includes token in request (header or body)
4. Server validates token matches user's session
5. Token rotated after successful request
```

**Backend Implementation**:
```python
from django.middleware.csrf import get_token, CsrfViewMiddleware
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie

@ensure_csrf_cookie
def get_form(request):
    """Return form with CSRF token"""
    token = get_token(request)
    return JsonResponse({'csrf_token': token})

@csrf_protect
def process_form(request):
    """Process form (CSRF token automatically validated)"""
    data = request.POST.get('data')
    # Token is validated before this code runs
    return JsonResponse({'status': 'success'})
```

**Frontend Implementation**:
```javascript
// Get token from meta tag
function getCSRFToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content;
}

// Send with request
fetch('/api/update', {
  method: 'POST',
  headers: {
    'X-CSRFToken': getCSRFToken(),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({data: 'value'})
});
```

**Frontend HTML**:
```html
<head>
  <meta name="csrf-token" content="{{ csrf_token }}">
</head>
```

**Pros**: Industry standard, proven, Django built-in  
**Cons**: Requires token management

---

### 2. ✅ SameSite Cookie Attribute

**How It Works**:
```
SameSite=Strict:  Don't send cookie in cross-site requests AT ALL
SameSite=Lax:     Send cookie only for safe methods (GET) and same-site forms
SameSite=None:    Send cookie always (must use Secure flag)
```

**Django Configuration**:
```python
# settings.py
SESSION_COOKIE_SAMESITE = 'Lax'  # Recommended
CSRF_COOKIE_SAMESITE = 'Lax'

# Even stricter
SESSION_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_SAMESITE = 'Strict'

# Required with SameSite=None
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

**Benefits**: 
- ✅ Browser automatically prevents cross-site cookie transmission
- ✅ Works without token (partially)
- ✅ Modern browsers enforce this

**Limitations**:
- ❌ Doesn't protect GET requests (Lax mode)
- ❌ Older browsers don't support it

---

### 3. ✅ Double Submit Cookie Pattern

**How It Works**:
```
1. Server sends random token in secure HttpOnly cookie
2. Frontend also sends same token in request header
3. Server verifies both tokens match
4. Attacker can't read cookie (HttpOnly), can't forge matching header
```

**Implementation**:
```python
import secrets
from django.http import JsonResponse

def get_csrf_token(request):
    """Generate and return CSRF token"""
    token = secrets.token_urlsafe(32)
    
    response = JsonResponse({'status': 'ok'})
    response.set_cookie(
        'csrf_token',
        token,
        httponly=False,  # Frontend needs to read it
        secure=True,     # HTTPS only
        samesite='Lax'
    )
    return response

def validate_csrf_token(request):
    """Middleware to validate CSRF token"""
    if request.method in ['POST', 'PUT', 'DELETE']:
        cookie_token = request.COOKIES.get('csrf_token')
        header_token = request.headers.get('X-CSRF-Token')
        
        if not cookie_token or cookie_token != header_token:
            return JsonResponse(
                {'error': 'CSRF token validation failed'}, 
                status=403
            )
    return None
```

**Pros**: Works even with HttpOnly cookies (partially)  
**Cons**: Token visible in cookies (but validated in headers)

---

### 4. ✅ Origin and Referer Header Validation

**How It Works**:
```
Check request's Origin or Referer header against allowed origins
Reject requests from unknown/malicious sources
```

**Implementation**:
```python
from django.conf import settings
from django.http import JsonResponse

ALLOWED_ORIGINS = [
    'https://example.com',
    'https://www.example.com',
    'https://api.example.com',
]

def validate_origin(request):
    """Validate Origin/Referer headers"""
    if request.method in ['POST', 'PUT', 'DELETE']:
        # Check Origin header (newer)
        origin = request.headers.get('Origin')
        if origin and origin not in ALLOWED_ORIGINS:
            return JsonResponse(
                {'error': 'Invalid origin'}, 
                status=403
            )
        
        # Fallback to Referer (older)
        referer = request.headers.get('Referer', '')
        if referer:
            # Parse origin from referer
            from urllib.parse import urlparse
            referer_origin = urlparse(referer).netloc
            
            if referer_origin not in [
                urlparse(o).netloc for o in ALLOWED_ORIGINS
            ]:
                return JsonResponse(
                    {'error': 'Invalid referer'}, 
                    status=403
                )
    
    return None
```

**Best Practices**:
```python
# Always validate both
def is_safe_request(request):
    origin = request.headers.get('Origin')
    referer = request.headers.get('Referer', '')
    
    allowed_domains = ['example.com', 'www.example.com']
    
    # Check origin
    if origin:
        origin_domain = urlparse(origin).netloc
        if origin_domain not in allowed_domains:
            return False
    
    # Check referer as fallback
    if referer:
        referer_domain = urlparse(referer).netloc
        if referer_domain not in allowed_domains:
            return False
    
    return True
```

**Pros**: Server-side only, no token needed  
**Cons**: Can be stripped by proxies/network

---

### 5. ✅ Custom HTTP Header Check

**How It Works**:
```
CSRF attacks from <form> or <img> can't set custom headers
Only JavaScript can, but JavaScript on attacker's site is blocked by CORS
```

**Implementation**:
```python
def validate_custom_header(request):
    """Check for custom header that form can't set"""
    if request.method in ['POST', 'PUT', 'DELETE']:
        if not request.headers.get('X-Requested-With'):
            return JsonResponse(
                {'error': 'Missing X-Requested-With header'}, 
                status=403
            )
    return None
```

**Frontend**:
```javascript
fetch('/api/update', {
  method: 'POST',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',  // Custom header
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({data: 'value'})
});
```

**Pros**: Simple, doesn't require tokens  
**Cons**: CORS must be configured properly

---

## Implementation Guide

### Step 1: Enable Django CSRF Middleware

```python
# settings.py

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',  # ← Add this
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

# CSRF Settings
CSRF_COOKIE_SECURE = True       # HTTPS only
CSRF_COOKIE_HTTPONLY = False    # Frontend needs to read it
CSRF_COOKIE_SAMESITE = 'Lax'    # Cross-site cookie protection
CSRF_TRUSTED_ORIGINS = [
    'https://example.com',
    'https://www.example.com',
]
```

### Step 2: Protect Views

```python
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.http import JsonResponse

@ensure_csrf_cookie
def get_csrf_token(request):
    """Endpoint to get CSRF token for frontend"""
    return JsonResponse({'csrf_token': ''})  # Django sets it

@csrf_protect
def update_profile(request):
    """Protected endpoint - CSRF token required"""
    if request.method == 'POST':
        data = json.loads(request.body)
        request.user.profile.update(data)
        return JsonResponse({'status': 'updated'})
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)
```

### Step 3: Frontend CSRF Token Management

```javascript
// utils/csrf.js
export function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content;
}

export function setApiHeaders(headers = {}) {
  return {
    ...headers,
    'X-CSRFToken': getCsrfToken(),
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json'
  };
}

export async function fetchWithCSRF(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: setApiHeaders(options.headers),
    credentials: 'include'  // Include cookies
  });
}
```

### Step 4: Include Token in HTML

```html
<!DOCTYPE html>
<html>
<head>
  {% csrf_token %}
  <meta name="csrf-token" content="{{ csrf_token }}">
</head>
<body>
  <form method="post" action="/api/update">
    {% csrf_token %}  <!-- Django template tag -->
    <input type="text" name="email">
    <button type="submit">Update</button>
  </form>
</body>
</html>
```

### Step 5: Frontend Form Submission

```jsx
import { fetchWithCSRF, getCsrfToken } from './utils/csrf';

function UpdateProfile() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetchWithCSRF('/api/profile', {
      method: 'POST',
      body: JSON.stringify({
        email: e.target.email.value
      })
    });
    
    if (response.ok) {
      alert('Profile updated');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="email" name="email" required />
      <button type="submit">Update</button>
    </form>
  );
}
```

---

## Code Audit Checklist

### Backend CSRF Audit

- [ ] Django CSRF middleware is enabled in MIDDLEWARE
- [ ] All POST/PUT/DELETE endpoints use @csrf_protect
- [ ] CSRF_COOKIE_SECURE = True
- [ ] CSRF_COOKIE_SAMESITE = 'Lax' or 'Strict'
- [ ] CSRF_TRUSTED_ORIGINS configured for all domains
- [ ] Forms include {% csrf_token %}
- [ ] API endpoints validate CSRF tokens
- [ ] No exceptions to CSRF protection for sensitive operations
- [ ] Error messages don't leak CSRF tokens
- [ ] CSRF tokens rotate after each request

### Frontend CSRF Audit

- [ ] CSRF token included in all non-GET requests
- [ ] Token sent in X-CSRFToken header
- [ ] fetch() and axios calls include token
- [ ] Forms include hidden CSRF token field
- [ ] No XSS vulnerabilities (token could be stolen)
- [ ] Credentials flag set to 'include'
- [ ] SameSite cookies configured
- [ ] Origin/Referer validation in backend

---

## Testing Procedures

### Manual Testing

#### Test 1: GET Request (Should Always Work)
```bash
# Should work without CSRF token
curl https://example.com/api/data
```

#### Test 2: POST Without Token (Should Fail)
```bash
curl -X POST https://example.com/api/update \
  -d "email=test@example.com" \
  # No CSRF token
# Expected: 403 Forbidden
```

#### Test 3: POST With Token (Should Work)
```bash
# Get token first
TOKEN=$(curl -X GET https://example.com/csrf-token | jq .csrf_token)

# Send with token
curl -X POST https://example.com/api/update \
  -H "X-CSRFToken: $TOKEN" \
  -d "email=test@example.com"
# Expected: 200 OK
```

#### Test 4: Cross-Origin Request (Should Fail)
```html
<!-- On attacker.com -->
<form action="https://example.com/api/update" method="POST">
  <input name="email" value="hacked@attacker.com">
</form>
<script>
  document.forms[0].submit();
  // Expected: Browser blocks or 403 from server
</script>
```

### Automated Testing

```python
from django.test import TestCase, Client
from django.middleware.csrf import get_token

class CSRFProtectionTests(TestCase):
    
    def test_csrf_token_required(self):
        """POST without token should fail"""
        response = self.client.post('/api/update', {
            'email': 'test@example.com'
        })
        self.assertEqual(response.status_code, 403)
    
    def test_csrf_token_accepted(self):
        """POST with token should succeed"""
        # Get CSRF token
        self.client.get('/csrf-token')
        token = self.client.cookies['csrftoken'].value
        
        # POST with token
        response = self.client.post(
            '/api/update',
            {'email': 'test@example.com'},
            HTTP_X_CSRFTOKEN=token
        )
        self.assertEqual(response.status_code, 200)
    
    def test_cross_origin_blocked(self):
        """Cross-origin POST should be blocked"""
        response = self.client.post(
            '/api/update',
            {'email': 'test@example.com'},
            HTTP_ORIGIN='https://attacker.com'
        )
        self.assertIn(response.status_code, [403, 400])
    
    def test_invalid_token_rejected(self):
        """Invalid token should be rejected"""
        response = self.client.post(
            '/api/update',
            {'email': 'test@example.com'},
            HTTP_X_CSRFTOKEN='invalid_token'
        )
        self.assertEqual(response.status_code, 403)
```

---

## Best Practices

✅ **DO**:
- Always validate CSRF tokens on state-changing requests
- Use SameSite cookies as first line of defense
- Validate Origin/Referer headers
- Rotate tokens after successful requests
- Log CSRF failures for monitoring
- Use secure, HttpOnly cookies
- Implement all 5 protection mechanisms together

❌ **DON'T**:
- Rely on a single protection mechanism
- Store CSRF tokens in localStorage (XSS vulnerable)
- Accept CSRF tokens from GET parameters
- Trust Referer headers alone
- Disable CSRF protection for "convenience"
- Use predictable CSRF token values
- Log CSRF tokens in error messages

---

## Common Mistakes

❌ **Mistake 1**: Only protecting POST, ignoring PUT/DELETE
```python
# Wrong - only POST protected
if request.method == 'POST':
    validate_csrf(request)
```

✅ **Correct**: Protect all state-changing methods
```python
if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
    validate_csrf(request)
```

---

❌ **Mistake 2**: Token in GET parameters
```python
# Wrong - token in URL (vulnerable)
<form action="/api/update?csrf_token=abc123">
```

✅ **Correct**: Token in header or body
```python
# Correct - token in header
fetch('/api/update', {
  headers: {'X-CSRFToken': token}
})
```

---

❌ **Mistake 3**: No SameSite attribute
```python
# Wrong - no SameSite protection
SESSION_COOKIE_SAMESITE = None
```

✅ **Correct**: Enable SameSite
```python
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
```

---

## Summary

| Protection | Pros | Cons | Effectiveness |
|-----------|------|------|----------------|
| CSRF Token | Industry standard, proven | Token management | 95% |
| SameSite Cookie | Automatic, simple | Limited browser support | 90% |
| Origin/Referer Check | Simple, server-side | Can be stripped | 85% |
| Custom Header | Simple, CORS enforces | JavaScript dependent | 90% |
| Double Submit | Works with HttpOnly | Token visibility | 95% |

**Recommendation**: Use CSRF tokens + SameSite cookies + Origin validation = 99% protection

