# Broken Authentication & Session Management Security Guide

**OWASP Top 10 (2021)**: A07:2021 – Identification and Authentication Failures  
**Severity**: 🔴 Critical  
**Exploitability**: High  
**Impact**: Critical (full account compromise)

---

## Table of Contents
1. [What is Broken Authentication?](#what-is-broken-authentication)
2. [Attack Types](#attack-types)
3. [Vulnerable Code Examples](#vulnerable-code-examples)
4. [Protection Mechanisms](#protection-mechanisms)
5. [Implementation Guide](#implementation-guide)
6. [Code Audit Checklist](#code-audit-checklist)
7. [Testing Procedures](#testing-procedures)

---

## What is Broken Authentication?

### Definition
**Broken Authentication** occurs when authentication mechanisms are flawed, allowing attackers to:
- Compromise user accounts
- Bypass login requirements
- Escalate privileges
- Steal session tokens
- Perform actions as other users

### Common Vulnerabilities
- 🔐 Weak passwords
- 🔑 Default credentials
- ❌ No MFA/2FA
- 📋 Session fixation
- 🕐 No session timeout
- 📝 Plaintext password storage
- 🔄 Insecure password reset
- 💾 Insecure "remember me"
- 🚫 Account lockout missing

### Real-World Impact
- 💳 Credit card fraud
- 👤 Identity theft
- 🔓 Data breach
- 💰 Financial loss
- 📊 Reputation damage

---

## Attack Types

### 1. Credential Stuffing / Brute Force

**Attack Vector**:
```python
# Attacker tries common passwords
passwords = ['password', '123456', 'admin', 'letmein']
for pwd in passwords:
    for username in usernames:
        attempt_login(username, pwd)
```

**Vulnerable Code**:
```python
def login(request):
    username = request.POST['username']
    password = request.POST['password']
    
    user = User.objects.get(username=username)
    
    # ❌ No rate limiting
    # ❌ No account lockout
    # ❌ No failed attempt tracking
    
    if user.password == password:  # ❌ Plain text comparison!
        login_user(request, user)
        return redirect('dashboard')
    
    return render(request, 'login.html', {'error': 'Invalid credentials'})
```

**Attack Execution**:
```bash
# Attacker runs 1000s of login attempts
for i in {1..1000}; do
  curl -X POST https://example.com/login \
    -d "username=admin&password=password$i"
done
```

**Impact**: Account takeover after finding correct password

---

### 2. Default Credentials

**Attack Vector**:
```python
# Attacker uses known defaults
default_creds = {
    'admin': 'admin',
    'root': 'root',
    'test': 'test',
    'demo': 'demo'
}

for username, password in default_creds.items():
    attempt_login(username, password)  # Likely to succeed!
```

**Vulnerable Code**:
```python
# In seed_db.py or initial setup
User.objects.create_user(
    username='admin',
    password='admin'  # ❌ Never changed!
)

User.objects.create_user(
    username='test',
    password='test'  # ❌ Default test account left in production!
)
```

**Impact**: Immediate admin access

---

### 3. Session Fixation

**Attack Vector**:
```html
<!-- Attacker sets a known session ID -->
<a href="https://example.com/login?session_id=attacker_controlled_id">
  Click to Login
</a>

<!-- User clicks and logs in with attacker's session ID -->
<!-- Attacker then uses that session_id to access user's account -->
```

**Vulnerable Code**:
```python
def login(request):
    session_id = request.GET.get('session_id')
    
    # ❌ Accepts user-provided session ID!
    if session_id:
        request.session.session_key = session_id
    
    username = request.POST['username']
    password = request.POST['password']
    
    if authenticate(username, password):
        # User logs in with attacker's session!
        return JsonResponse({'status': 'logged in'})
```

**Attack**:
```
1. Attacker knows session_id = "attacker123"
2. Attacker sends link: /login?session_id=attacker123
3. User clicks and logs in
4. User's session is now "attacker123"
5. Attacker uses "attacker123" to impersonate user
```

**Impact**: Full account compromise

---

### 4. Insecure Password Storage

**Attack Vector** (if database is compromised):
```python
# Vulnerable: Plain text password in database
User.objects.create_user(username='admin', password='SecurePass123')
# Stored as: password='SecurePass123' ❌

# Vulnerable: Weak hashing
import hashlib
hashed = hashlib.md5('SecurePass123').hexdigest()
# Easy to crack with rainbow tables!

# Vulnerable: No salt
hashed = hashlib.sha256('SecurePass123').hexdigest()
# Same password = same hash across users!
```

**Impact** (database compromised):
- Attacker gains all passwords
- Can crack weak hashes with GPU/rainbow tables
- Can reverse weak passwords

---

### 5. Weak Session Management

**Attack Vector 1: Predictable Session ID**
```python
# ❌ Bad - Sequential/predictable
import time
session_id = str(int(time.time()))  # Predictable!

# ❌ Bad - User ID as session
session_id = str(user.id)  # Guess any ID!
```

**Attack Execution**:
```python
# Attacker guesses session IDs
for session_id in range(1, 10000):
    response = requests.get(
        'https://example.com/dashboard',
        cookies={'session_id': str(session_id)}
    )
    if 'dashboard' in response.text:
        print(f"Found valid session: {session_id}")  # ✅ Compromised!
```

**Attack Vector 2: No Session Timeout**
```python
# ❌ No timeout
SESSION_COOKIE_AGE = None  # Session never expires!

# User logs in, walks away
# Attacker sits at their computer and uses their session
```

**Impact**: Unauthorized access to abandoned sessions

---

### 6. Insecure Password Reset

**Attack Vector 1: Guessable Reset Token**
```python
def request_password_reset(request):
    user = User.objects.get(email=request.POST['email'])
    
    # ❌ Weak token generation
    import random
    token = str(random.randint(1000, 9999))  # Only 9000 possibilities!
    
    send_reset_email(user, token)
    return JsonResponse({'status': 'email sent'})

def reset_password(request):
    token = request.GET['token']
    user = User.objects.get(password_reset_token=token)
    
    # ❌ Token never expires
    # ❌ Token can be brute forced
    
    user.password = request.POST['password']
    user.save()
```

**Attack**:
```bash
# Attacker brute forces 4-digit token
for i in {1000..9999}; do
  curl "https://example.com/reset?token=$i&password=hacked123&email=victim@example.com"
done
# Likely finds valid token!
```

**Attack Vector 2: Email Enumeration**
```python
def request_password_reset(request):
    email = request.POST['email']
    
    try:
        user = User.objects.get(email=email)
        send_reset_email(user, token)
        return JsonResponse({'status': 'email sent'})
    except User.DoesNotExist:
        # ❌ Different response reveals user doesn't exist!
        return JsonResponse({'error': 'User not found'})
```

**Attack**:
```python
# Attacker enumerates valid accounts
valid_emails = []
for email in email_list:
    response = requests.post('https://example.com/reset', 
                            data={'email': email})
    if 'email sent' in response.text:
        valid_emails.append(email)  # Found valid account!
```

---

### 7. No Account Lockout

**Attack Vector** (continued brute force):
```python
# ❌ No protection against repeated failed attempts
def login(request):
    username = request.POST['username']
    password = request.POST['password']
    
    user = User.objects.get(username=username)
    
    # ❌ No check for failed attempts
    # ❌ No lockout mechanism
    
    if check_password(password, user.password):
        login_user(request, user)
    else:
        # Attacker tries again immediately
        pass
```

**Attack**:
```bash
# Attacker tries thousands of passwords with no throttling
for pwd in $(cat wordlist.txt); do
  curl -X POST https://example.com/login \
    -d "username=admin&password=$pwd"
    # No delay, no lockout!
done
```

---

### 8. "Remember Me" Insecurity

**Attack Vector**:
```python
# ❌ Insecure remember me token
def login(request):
    user = User.objects.get(username=request.POST['username'])
    
    if request.POST.get('remember_me'):
        # ❌ Token too simple
        import hashlib
        token = hashlib.md5(user.username).hexdigest()
        
        # ❌ Token never expires
        user.remember_token = token
        user.save()
        
        response.set_cookie('remember_token', token)
```

**Attack**:
```python
# Attacker intercepts remember token
# Token is deterministic - can be computed!
username = 'victim'
token = hashlib.md5(username).hexdigest()

# Attacker sets cookie and is logged in as victim
headers = {'Cookie': f'remember_token={token}'}
```

**Impact**: Persistent unauthorized access

---

## Vulnerable Code Examples

### ❌ Complete Vulnerable Login System

```python
# views.py - VULNERABLE!

import hashlib
from django.http import JsonResponse
from django.contrib.auth import authenticate

def register(request):
    username = request.POST['username']
    password = request.POST['password']  # ❌ No validation
    email = request.POST['email']
    
    # ❌ Password stored as plain text!
    user = User.objects.create(
        username=username,
        password=password,  # ❌ CRITICAL VULNERABILITY
        email=email,
        is_active=True  # ❌ No email verification
    )
    
    return JsonResponse({'status': 'registered'})


def login(request):
    username = request.POST['username']
    password = request.POST['password']
    
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        # ❌ User enumeration - different error message
        return JsonResponse({'error': 'User not found'}, status=400)
    
    # ❌ No rate limiting
    # ❌ No failed attempt tracking
    # ❌ Plain text comparison
    if user.password == password:
        request.session['user_id'] = user.id
        request.session.set_expiry(86400 * 365)  # ❌ 1 year! Too long!
        
        if request.POST.get('remember_me'):
            # ❌ Insecure remember me
            token = hashlib.md5(f"{user.id}{username}".encode()).hexdigest()
            response.set_cookie('remember', token, max_age=86400*30)
        
        return JsonResponse({'status': 'logged in'})
    
    return JsonResponse({'error': 'Invalid credentials'}, status=400)


def change_password(request):
    # ❌ No current password verification!
    new_password = request.POST['new_password']
    
    # ❌ No password complexity check
    # ❌ New password stored as plain text
    request.user.password = new_password
    request.user.save()
    
    return JsonResponse({'status': 'changed'})
```

---

## Protection Mechanisms

### 1. ✅ Secure Password Hashing

**Django's Built-in**: Uses PBKDF2 by default (good)

```python
from django.contrib.auth.models import User

# ✅ Correct - Django handles hashing
user = User.objects.create_user(
    username='john',
    email='john@example.com',
    password='SecurePassword123'  # Automatically hashed!
)

# Stored password: pbkdf2_sha256$260000$randomsalt$hashedvalue
```

**Better: Use Argon2** (resistant to GPU/ASIC attacks)

```python
# settings.py
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',  # ← Strongest
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

# Install: pip install django[argon2]
```

**How It Works**:
```python
# Setting password (automatic)
from django.contrib.auth.models import User
user = User()
user.set_password('MyPassword123')  # Hashed automatically
user.save()

# Checking password
from django.contrib.auth import authenticate
user = authenticate(username='john', password='MyPassword123')
if user:
    print("✅ Correct password")
```

---

### 2. ✅ Multi-Factor Authentication (MFA)

**Implementation with TOTP (Time-based One-Time Password)**:

```python
# Install: pip install django-otp

from django_otp.decorators import otp_required
from django_otp.plugins.otp_totp.models import StaticDevice, StaticToken
from django_otp.plugins.otp_totp.forms import PatchedQRGeneratorForm

def enable_mfa(request):
    """User enables TOTP MFA"""
    user = request.user
    
    # Create device
    device = StaticDevice.objects.create(
        user=user,
        name='totp',
        confirmed=False
    )
    
    # Generate QR code
    form = PatchedQRGeneratorForm(initial_data={'device': device})
    
    return JsonResponse({
        'qr_code': form.as_p(),
        'secret_key': device.key
    })

def verify_mfa(request):
    """User scans QR and enters code"""
    user = request.user
    token = request.POST['token']
    
    device = user.staticdevice_set.get(name='totp')
    
    if device.verify_token(token):
        device.confirmed = True
        device.save()
        return JsonResponse({'status': 'mfa enabled'})
    
    return JsonResponse({'error': 'Invalid token'}, status=400)

@otp_required  # ← Requires MFA to access
def dashboard(request):
    return JsonResponse({'data': 'sensitive'})
```

**Usage Flow**:
```
1. User logs in with username/password
2. System sends: "Enter 6-digit code from authenticator app"
3. User opens Authenticator app (Google Authenticator, Authy, etc)
4. User enters 6-digit code
5. System verifies code matches TOTP
6. Access granted
```

---

### 3. ✅ Session Security

**Django Configuration**:

```python
# settings.py

# Session timeout (30 minutes)
SESSION_COOKIE_AGE = 1800

# Expire session when browser closes
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# Security flags
SESSION_COOKIE_SECURE = True      # HTTPS only
SESSION_COOKIE_HTTPONLY = True    # JavaScript can't read it
SESSION_COOKIE_SAMESITE = 'Lax'   # CSRF protection

# Session storage (secure)
SESSION_ENGINE = 'django.contrib.sessions.backends.db'  # Database storage
# Or: 'django.contrib.sessions.backends.cache' (Redis)

# Regenerate session after login
from django.contrib.auth import login as auth_login

def login_view(request):
    user = authenticate(username=username, password=password)
    if user:
        auth_login(request, user)  # Automatically regenerates session
        return redirect('dashboard')
```

**Benefits**:
- ✅ Sessions timeout automatically
- ✅ New session after login (prevents fixation)
- ✅ Cookie flags prevent theft
- ✅ Secure storage

---

### 4. ✅ Account Lockout & Rate Limiting

```python
# Install: pip install django-ratelimit

from django.views.decorators.cache import cache_page
from django_ratelimit.decorators import ratelimit
from django.core.cache import cache
from django.http import JsonResponse
from django.contrib.auth import authenticate

FAILED_LOGIN_ATTEMPTS_KEY = 'login_attempts_{}'
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION = 1800  # 30 minutes

def check_account_locked(username):
    """Check if account is locked"""
    attempts_key = FAILED_LOGIN_ATTEMPTS_KEY.format(username)
    attempts = cache.get(attempts_key, 0)
    return attempts >= MAX_FAILED_ATTEMPTS

def record_failed_attempt(username):
    """Record failed login attempt"""
    attempts_key = FAILED_LOGIN_ATTEMPTS_KEY.format(username)
    attempts = cache.get(attempts_key, 0)
    cache.set(attempts_key, attempts + 1, LOCKOUT_DURATION)

def clear_failed_attempts(username):
    """Clear failed attempts on successful login"""
    attempts_key = FAILED_LOGIN_ATTEMPTS_KEY.format(username)
    cache.delete(attempts_key)

@ratelimit(key='ip', rate='10/m', method='POST')  # 10 requests per minute
def login(request):
    username = request.POST.get('username')
    password = request.POST.get('password')
    
    # Check if account is locked
    if check_account_locked(username):
        return JsonResponse(
            {'error': 'Account locked. Try again in 30 minutes'},
            status=429  # Too Many Requests
        )
    
    # Attempt authentication
    user = authenticate(username=username, password=password)
    
    if user:
        clear_failed_attempts(username)
        auth_login(request, user)
        return JsonResponse({'status': 'logged in'})
    else:
        record_failed_attempt(username)
        return JsonResponse(
            {'error': 'Invalid credentials'},
            status=401
        )
```

---

### 5. ✅ Secure Password Reset

```python
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

def request_password_reset(request):
    """Request password reset"""
    email = request.POST.get('email')
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # ✅ Same response for all (prevent enumeration)
        return JsonResponse({
            'status': 'If account exists, reset email sent'
        })
    
    # Generate secure token
    token = get_random_string(64)  # ✅ Cryptographically random
    
    # Set expiration (1 hour)
    PasswordResetToken.objects.create(
        user=user,
        token=token,
        expires_at=timezone.now() + timedelta(hours=1)
    )
    
    # Send email
    send_password_reset_email(user, token)
    
    return JsonResponse({
        'status': 'If account exists, reset email sent'
    })

def reset_password(request):
    """Reset password with token"""
    token = request.POST.get('token')
    new_password = request.POST.get('new_password')
    
    # Validate token
    try:
        reset_token = PasswordResetToken.objects.get(
            token=token,
            used=False,
            expires_at__gte=timezone.now()  # ✅ Check expiration
        )
    except PasswordResetToken.DoesNotExist:
        return JsonResponse(
            {'error': 'Invalid or expired token'},
            status=400
        )
    
    # Validate password
    if len(new_password) < 12:
        return JsonResponse(
            {'error': 'Password too weak'},
            status=400
        )
    
    # Update password
    user = reset_token.user
    user.set_password(new_password)  # ✅ Hashed automatically
    user.save()
    
    # Mark token as used (prevent reuse)
    reset_token.used = True
    reset_token.save()
    
    # Invalidate all sessions (forces re-login)
    user.password_change_date = timezone.now()
    user.save()
    
    return JsonResponse({'status': 'Password reset successfully'})
```

---

### 6. ✅ Password Complexity Requirements

```python
from django.contrib.auth.password_validation import (
    UserAttributeSimilarityValidator,
    MinimumLengthValidator,
    CommonPasswordValidator,
    NumericPasswordValidator,
)

# settings.py
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,  # ✅ Require 12+ characters
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Usage
from django.contrib.auth.password_validation import validate_password

def register(request):
    password = request.POST.get('password')
    
    try:
        validate_password(password)  # ✅ Checks all validators
    except ValidationError as e:
        return JsonResponse({'error': str(e)}, status=400)
    
    # Password is strong, create user
```

---

### 7. ✅ Email Verification

```python
class User(models.Model):
    email = models.EmailField()
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=64, blank=True)

def register(request):
    """Register user with email verification"""
    email = request.POST.get('email')
    password = request.POST.get('password')
    username = request.POST.get('username')
    
    # Validate password
    try:
        validate_password(password)
    except ValidationError as e:
        return JsonResponse({'error': str(e)}, status=400)
    
    # Create user (not active yet)
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        is_active=False  # ✅ Require email verification
    )
    
    # Generate verification token
    token = get_random_string(64)
    user.email_verification_token = token
    user.save()
    
    # Send verification email
    send_verification_email(user, token)
    
    return JsonResponse({
        'status': 'Check your email to verify'
    })

def verify_email(request):
    """Verify email with token"""
    token = request.GET.get('token')
    
    try:
        user = User.objects.get(
            email_verification_token=token,
            email_verified=False
        )
    except User.DoesNotExist:
        return JsonResponse({'error': 'Invalid token'}, status=400)
    
    # Mark as verified
    user.email_verified = True
    user.is_active = True  # ✅ Now user can log in
    user.email_verification_token = ''  # Clear token
    user.save()
    
    return JsonResponse({'status': 'Email verified! You can now log in.'})
```

---

## Implementation Guide

### Step 1: Configure Django Authentication

```python
# settings.py

# Use built-in authentication
INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    # ...
]

# Password hashers (Argon2 first)
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

# Session security
SESSION_COOKIE_AGE = 1800
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
```

### Step 2: Implement Secure Login

```python
# views.py
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django_ratelimit.decorators import ratelimit

@ratelimit(key='ip', rate='10/m', method='POST')
def login_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    username = request.POST.get('username')
    password = request.POST.get('password')
    
    if not username or not password:
        return JsonResponse(
            {'error': 'Username and password required'},
            status=400
        )
    
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        if user.is_active:
            login(request, user)  # Creates session, regenerates token
            
            # Check if MFA is enabled
            if user.mfa_enabled:
                return JsonResponse({
                    'status': 'enter_mfa',
                    'session_id': request.session.session_key
                })
            
            return JsonResponse({'status': 'logged in'})
        else:
            return JsonResponse(
                {'error': 'Account not activated'},
                status=403
            )
    else:
        return JsonResponse(
            {'error': 'Invalid credentials'},
            status=401
        )
```

### Step 3: Enable MFA

```python
# Install: pip install django-otp qrcode pillow
# Add to INSTALLED_APPS: 'django_otp', 'django_otp.plugins.otp_totp'

from django_otp.decorators import otp_required
from django_otp.util import random_hex

@otp_required
def protected_view(request):
    """This view requires MFA"""
    return JsonResponse({'data': 'sensitive'})
```

### Step 4: Frontend Authentication

```javascript
// api/auth.js
export async function login(username, password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRFToken': getCsrfToken()
    },
    credentials: 'include',
    body: `username=${username}&password=${password}`
  });
  
  return response.json();
}

export async function logout() {
  await fetch('/api/logout', {
    method: 'POST',
    credentials: 'include'
  });
}

export function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content;
}
```

```jsx
// components/Login.jsx
import React, { useState } from 'react';
import { login } from '../api/auth';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const result = await login(username, password);
      
      if (result.status === 'enter_mfa') {
        setMfaRequired(true);
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  if (mfaRequired) {
    return <MFAPrompt />;
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password (min 12 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
```

---

## Code Audit Checklist

- [ ] Passwords hashed with Argon2 or PBKDF2
- [ ] Password complexity requirements enforced (min 12 chars)
- [ ] MFA/2FA implemented for sensitive accounts
- [ ] Session timeout configured (30 min or less)
- [ ] Session regenerated after login
- [ ] Account lockout after 5 failed attempts
- [ ] Rate limiting on login endpoint
- [ ] Email verification required for new accounts
- [ ] Password reset tokens expire after 1 hour
- [ ] Password reset tokens are cryptographically random
- [ ] No password reuse for last 5 passwords
- [ ] Default credentials removed from production
- [ ] Session storage secure (database or Redis, not filesystem)
- [ ] SESSION_COOKIE_SECURE = True
- [ ] SESSION_COOKIE_HTTPONLY = True
- [ ] SESSION_COOKIE_SAMESITE = 'Lax'
- [ ] Failed login attempts logged
- [ ] MFA recovery codes generated and stored securely
- [ ] No user enumeration (same response for valid/invalid users)
- [ ] Password changes invalidate all sessions

---

## Testing Procedures

```python
# tests.py
from django.test import TestCase, Client
from django.contrib.auth.models import User

class AuthenticationTests(TestCase):
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='SecurePassword123'
        )
    
    def test_weak_password_rejected(self):
        """Weak password should be rejected"""
        response = self.client.post('/register', {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': '123'  # Too weak
        })
        self.assertEqual(response.status_code, 400)
    
    def test_login_success(self):
        """Valid credentials should log in"""
        response = self.client.post('/login', {
            'username': 'testuser',
            'password': 'SecurePassword123'
        })
        self.assertEqual(response.status_code, 200)
    
    def test_login_failure(self):
        """Invalid credentials should fail"""
        response = self.client.post('/login', {
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, 401)
    
    def test_account_lockout(self):
        """Account locked after failed attempts"""
        for i in range(5):
            self.client.post('/login', {
                'username': 'testuser',
                'password': 'wrong'
            })
        
        # 6th attempt should be blocked
        response = self.client.post('/login', {
            'username': 'testuser',
            'password': 'SecurePassword123'
        })
        self.assertEqual(response.status_code, 429)  # Too Many Requests
```

---

## Summary

✅ **DO**:
- Hash passwords with Argon2
- Enforce strong password requirements (12+ chars)
- Implement MFA for sensitive accounts
- Use session timeouts (30 minutes)
- Regenerate sessions on login
- Lock accounts after failed attempts
- Verify emails before activation
- Use secure password reset with expiring tokens
- Log authentication events
- Implement rate limiting

❌ **DON'T**:
- Store passwords in plain text
- Use weak hashing (MD5, SHA1)
- Leave default credentials in production
- Accept user-provided session IDs
- Trust clients for authentication
- Enumerate users (same response for all)
- Store sensitive data in localStorage
- Allow password reuse
- Skip MFA for admin accounts
- Log passwords or sensitive data

