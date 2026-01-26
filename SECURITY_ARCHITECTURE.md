# Security Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          UI Components (SecureAuthComponents)            │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  • SecureLoginForm (with MFA support)                   │   │
│  │  • SecureRegisterForm (with password strength)          │   │
│  │  • SecureFileUpload (with progress tracking)            │   │
│  │  • PasswordResetForm (token-based)                      │   │
│  │  • SessionWarning (30-min timeout)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ▲                                      │
│                            │ Uses                                 │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Utility Layer (csrfAuthUtils)                    │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  • CSRFUtils (token mgmt, safe fetch)                   │   │
│  │  • AuthUtils (login, logout, password validation)       │   │
│  │  • FileUploadUtils (file validation, XHR upload)        │   │
│  │  • SessionUtils (timeout, extension)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ▲                                      │
│                            │ HTTP Requests                        │
│                            │ (+ CSRF Token)                      │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Browser Security Storage                       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  • CSRF Token (from meta tag)                            │   │
│  │  • Session Cookie (httpOnly, secure, SameSite)          │   │
│  │  • Auth Token (localStorage or sessionStorage)          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS Only
                            │
┌─────────────────────────────────────────────────────────────────┐
│                    REVERSE PROXY (Nginx)                        │
├─────────────────────────────────────────────────────────────────┤
│  • TLS/SSL Termination                                           │
│  • Rate Limiting (optional)                                     │
│  • Security Headers (HSTS, CSP, X-Frame-Options)               │
│  • Block execution in /uploads/ directory                       │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Django/Python)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Django Views Layer                           │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  @csrf_protect_ajax          ← CSRF protection          │   │
│  │  @rate_limit_login           ← Rate limiting            │   │
│  │  @secure_upload_handler()    ← File validation          │   │
│  │  @login_required             ← Authentication           │   │
│  │  @otp_required               ← MFA check               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ▲                                      │
│                            │ Uses                                 │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │     Security Utilities (csrf_auth_upload_utils.py)       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  CSRFProtection                                 │   │   │
│  │  │  ├─ generate_token()                            │   │   │
│  │  │  ├─ validate_token()                            │   │   │
│  │  │  ├─ validate_origin()                           │   │   │
│  │  │  └─ log_csrf_attempt()                          │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  AuthenticationSecurity                         │   │   │
│  │  │  ├─ hash_password() [Argon2]                    │   │   │
│  │  │  ├─ validate_password_strength()                │   │   │
│  │  │  ├─ is_account_locked() [5 failures]            │   │   │
│  │  │  ├─ record_failed_attempt()                     │   │   │
│  │  │  ├─ clear_failed_attempts()                     │   │   │
│  │  │  ├─ generate_session_token()                    │   │   │
│  │  │  └─ log_authentication_event()                  │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  PasswordReset                                  │   │   │
│  │  │  ├─ generate_reset_token() [64 bytes]           │   │   │
│  │  │  ├─ create_reset_request() [1 hour expiry]      │   │   │
│  │  │  ├─ validate_reset_token()                      │   │   │
│  │  │  └─ reset_password()                            │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  FileUploadSecurity                             │   │   │
│  │  │  ├─ validate_extension() [whitelist]            │   │   │
│  │  │  ├─ validate_file_content() [magic bytes]       │   │   │
│  │  │  ├─ validate_file_size() [5MB/10MB limit]       │   │   │
│  │  │  ├─ sanitize_filename() [UUID]                  │   │   │
│  │  │  ├─ validate_upload() [full pipeline]           │   │   │
│  │  │  └─ log_file_upload()                           │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ▲                                      │
│                            │ Access                               │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Database Layer                              │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  • User (passwords hashed with Argon2)                  │   │
│  │  • Session (30-min timeout)                             │   │
│  │  • PasswordResetToken (1-hour expiry)                   │   │
│  │  • FailedLoginAttempt (lockout tracking)                │   │
│  │  • FileUploadLog (security audit trail)                 │   │
│  │  • CSRFLog (attack logging)                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  File Storage │
                    │  (Outside     │
                    │   Web Root)   │
                    └───────────────┘
```

---

## Request Flow - CSRF Protected Endpoint

```
User Browser                    Nginx                      Django Backend
     │                           │                              │
     │─ GET /app ─────────────────>                             │
     │                           │─────────────────────────────>│
     │                           │  (Request CSRF token)        │
     │                           │                        Token Generated
     │<───────────────────────────────────────────────────────────│
     │  (Page + CSRF token in meta tag + cookie)
     │
     │─ Form Submit (POST) ─────────────────>                  │
     │  (with CSRF token in X-CSRFToken header + cookies)
     │                           │                              │
     │                           │─────────────────────────────>│
     │                           │  POST /api/update            │
     │                           │  X-CSRFToken: token          │
     │                           │  Cookie: csrftoken=token     │
     │                           │
     │                           │              @csrf_protect
     │                           │              Validate:
     │                           │              ✓ Token present
     │                           │              ✓ Token matches cookie
     │                           │              ✓ Origin header valid
     │                           │              ✓ Request authenticated
     │                           │
     │                           │              Process request
     │                           │
     │<────────────────────────────────────────────────────────│
     │  200 OK (data updated)
```

---

## Request Flow - File Upload

```
User Browser                Nginx              Django Backend        Storage
     │                        │                      │                  │
     │─ POST /api/upload ────────────────────────────>                 │
     │  File: shell.php                              │                 │
     │  (renamed as profile.jpg)                      │                 │
     │                        │                      │                 │
     │                        │    @secure_upload_handler
     │                        │    Step 1: Check extension
     │                        │    ❌ .jpg only (no .php)
     │                        │    File rejected! ───────────────────>│
     │                        │                      │                 │
     │<──── 400 Bad Request ─────────────────────────│                 │
     │                        │                      │                 │
     │                        │                      │                 │
     │─ POST /api/upload ────────────────────────────>                 │
     │  File: real photo.jpg                         │                 │
     │                        │                      │                 │
     │                        │    Step 1: Extension check ✓
     │                        │    Step 2: Magic bytes check ✓
     │                        │    Step 3: MIME type check ✓
     │                        │    Step 4: Size check ✓
     │                        │    Step 5: Filename sanitize (UUID)
     │                        │    → /var/uploads/a3f5e2c1.jpg
     │                        │                      │
     │                        │    Upload to storage ────────────────>│
     │                        │                      │   ✓ Saved
     │<───── 200 OK ────────────────────────────────<─────────────────│
     │  { "url": "/files/a3f5e2c1.jpg" }
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      Layer 1: Browser                           │
│  ├─ CSRF Token from meta tag                                   │
│  ├─ Secure Cookies (httpOnly, secure, SameSite=Lax)            │
│  ├─ Content-Security-Policy (blocks inline scripts)            │
│  └─ X-Frame-Options (prevents clickjacking)                    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Layer 2: Network (Nginx)                       │
│  ├─ HTTPS/TLS only (no HTTP)                                    │
│  ├─ HSTS header (force HTTPS for 1 year)                        │
│  ├─ Rate limiting (optional)                                   │
│  ├─ Block execution in /uploads/ (disable PHP)                 │
│  └─ Add security headers                                       │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Layer 3: Application (Django)                      │
│  ├─ CSRF Token validation on every POST/PUT/DELETE             │
│  ├─ Origin/Referer header validation                           │
│  ├─ Authentication required (@login_required)                  │
│  ├─ Rate limiting on login endpoints                           │
│  ├─ Account lockout (5 failures = 30 min lockout)              │
│  ├─ Input validation & sanitization                            │
│  ├─ Parameterized queries (SQL injection prevention)           │
│  ├─ Output encoding (XSS prevention)                           │
│  ├─ File upload validation (extension/MIME/content)            │
│  └─ Security logging & audit trail                             │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Layer 4: Database                               │
│  ├─ Passwords hashed with Argon2 (not plain text)              │
│  ├─ Prepared statements (SQL injection prevention)             │
│  ├─ Least privilege user accounts                              │
│  └─ Encrypted sensitive data                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Layer 5: File Storage                              │
│  ├─ Storage outside web root (/var/uploads/)                   │
│  ├─ UUID-based filenames (prevent enumeration)                 │
│  ├─ No execute permissions on upload directory                 │
│  ├─ Optional: ClamAV antivirus scanning                         │
│  └─ Regular backups with encryption                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow with MFA

```
┌──────────────────────────────────────────────────────────────┐
│                     Login Flow                               │
└──────────────────────────────────────────────────────────────┘

Step 1: User enters credentials
  ┌─────────────────┐
  │ Login Page      │
  │ Username: ___   │
  │ Password: ___   │
  └────────┬────────┘
           │
           ▼
Step 2: Check rate limiting
  ├─ Check: Is this IP rate limited?
  │  (10 login attempts per minute)
  │  ✓ Not rate limited → Continue
  │  ❌ Rate limited → Return 429 (Too Many Requests)
  │
Step 3: Check account lockout
  ├─ Check: Failed login attempts?
  │  (5 failures = 30 minute lockout)
  │  ✓ Not locked → Continue
  │  ❌ Account locked → Return error
  │
Step 4: Authenticate user
  ├─ Find user by username
  ├─ Verify password (Argon2 hash comparison)
  │  ✓ Password correct → Continue
  │  ❌ Password wrong → Record failure, return error
  │
Step 5: Check MFA requirement
  ├─ Check: Is MFA enabled for this user?
  │
  │  If MFA disabled:
  │  ├─ Create session
  │  ├─ Clear failed attempts
  │  ├─ Return: "Login successful"
  │  └─ User redirected to dashboard
  │
  │  If MFA enabled:
  │  ├─ Return: "Enter MFA code"
  │  └─ User shown MFA input screen
  │
Step 6: Verify MFA code (if enabled)
  ├─ User enters TOTP code from authenticator
  ├─ Verify code matches
  │  ✓ Code correct → Continue
  │  ❌ Code wrong → Return error
  │
Step 7: Create session
  ├─ Generate secure session token
  ├─ Set session timeout (30 minutes)
  ├─ Clear failed login attempts
  ├─ Log authentication event
  │
Step 8: Redirect to dashboard
  └─ User now authenticated
     Session expires in 30 minutes
     5 minutes before expiry: Show timeout warning
```

---

## File Upload Validation Pipeline

```
User uploads: shell.php (renamed as profile.jpg)

                     ┌──────────────────┐
                     │ Receive Upload   │
                     │ Filename: profile.jpg
                     │ Content: PHP code
                     └────────┬─────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │ Step 1: Size Check   │
                   │ Limit: 5MB (images)  │
                   │ File size: 2KB       │
                   │ ✓ Pass               │
                   └────────┬─────────────┘
                            │
                            ▼
              ┌──────────────────────────────┐
              │ Step 2: Extension Check      │
              │ Whitelist: jpg, png, gif     │
              │ Filename ext: jpg            │
              │ ✓ Pass                       │
              └────────┬─────────────────────┘
                       │
                       ▼
           ┌──────────────────────────────────┐
           │ Step 3: MIME Type Check          │
           │ Header says: image/jpeg          │
           │ ✓ Pass                           │
           └────────┬────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────────────────┐
        │ Step 4: Magic Bytes Check            │
        │ Expected (JPEG): FFD8 FF...          │
        │ Actual (PHP): 3C3F 70 68...          │
        │ ❌ FAIL - Not a real image           │
        │                                      │
        │ Upload rejected with error message  │
        │ "Invalid file format"                │
        └──────────────────────────────────────┘
```

---

## Password Reset Flow

```
User clicks "Forgot Password"

        ┌──────────────────┐
        │ Reset Page       │
        │ Email: ___       │
        │ [Send]           │
        └────────┬─────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ Generate Reset Token       │
    │ Length: 64 bytes           │
    │ Expiry: 1 hour             │
    │ Example: aB3Xk9m2P5nQv...  │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ Send Email                 │
    │ Subject: Reset Password    │
    │ Link: /reset?token=aB3...  │
    │ Expires: 1 hour            │
    └────────┬───────────────────┘
             │
             ▼
    User receives email
    User clicks link
             │
             ▼
    ┌────────────────────────────┐
    │ Reset Form                 │
    │ Token: aB3Xk9m2P5nQv...    │
    │ New Password: ___          │
    │ Confirm: ___               │
    │ [Reset]                    │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ Validate Token             │
    │ ✓ Token valid              │
    │ ✓ Token not expired        │
    │ ✓ User exists              │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ Validate Password          │
    │ ✓ 12+ characters           │
    │ ✓ Uppercase + lowercase    │
    │ ✓ Contains number          │
    │ ✓ Contains special char    │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ Hash & Save Password       │
    │ Hash: Argon2               │
    │ Salt: Auto-generated       │
    │ Work factor: High          │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ Invalidate Old Tokens      │
    │ Delete used token          │
    │ Delete all old tokens      │
    └────────┬───────────────────┘
             │
             ▼
    ✓ Password reset successful
    User redirected to login
```

---

## Account Lockout Mechanism

```
Failed Login Attempts

Attempt 1: Wrong password
  → Record failure
  → Message: "Invalid credentials"
  → Display: ✓ Unlocked

Attempt 2: Wrong password
  → Record failure
  → Count: 2 failed attempts
  → Message: "Invalid credentials"
  → Display: ✓ Unlocked

Attempt 3: Wrong password
  → Record failure
  → Count: 3 failed attempts
  → Message: "Invalid credentials"
  → Display: ✓ Unlocked

Attempt 4: Wrong password
  → Record failure
  → Count: 4 failed attempts
  → Message: "Invalid credentials"
  → Display: ✓ Unlocked

Attempt 5: Wrong password
  → Record failure
  → Count: 5 failed attempts (THRESHOLD REACHED)
  → Lockout duration: 30 minutes
  → Clear failed attempts in 30 minutes
  → Message: "Account locked. Try again later."
  → Display: ❌ Account locked

Attempt 6: Correct password (within 30 min window)
  → Check: Account locked?
  → ❌ Yes, locked until [timestamp + 30 min]
  → Return: 429 Too Many Requests
  → Message: "Account locked. Try again in X minutes."

After 30 minutes: Lockout expires
  → Clear lockout flag
  → Reset failed attempt counter
  → Attempt 6: Correct password
  → ✓ Login successful!
```

---

## Session Timeout with Warning

```
User logs in at 10:00 AM
Session timeout: 30 minutes
Warning threshold: 5 minutes before timeout

Timeline:
10:00 - User logs in
        Session expires at: 10:30

10:20 - User actively using app
        (Session auto-extended on activity)
        New expiry: 10:50

10:25 - User reading page (no activity for 5 min)
        Time until logout: 5 minutes
        ⚠️ Show warning: "Your session will expire in 5 minutes"
        Options:
        └─ [Stay Logged In] - Extends session another 30 min
        └─ [Logout] - Log out now

10:26 - User clicks [Stay Logged In]
        Session extended to 10:56

10:30 - (Original timeout point)
        User still logged in because of extension
        (No logout happens)

10:50 - 5 minutes before new timeout
        ⚠️ Show warning again

10:55 - User ignores warning
        No activity
        1 minute remaining

10:56 - Session expires
        User redirected to login
        ✓ "Your session has expired. Please log in again."
```

---

## Multi-Layer Defense Example: Shell.php Attack

```
Attack Vector: Attacker uploads shell.php as profile.jpg

Layer 1: Browser
├─ File input has accept="image/*" ✓
└─ Client-side validation shows "Invalid file" ✓

Layer 2: Network (Nginx)
├─ Upload goes through HTTPS ✓
└─ File upload to /uploads/ path ✓

Layer 3: Application (Django)
├─ @secure_upload_handler decorator active
├─ Step 1: Size check: 2KB < 5MB ✓
├─ Step 2: Extension check: '.jpg' in whitelist ✓
├─ Step 3: MIME check: 'image/jpeg' expected ✓
├─ Step 4: Magic bytes check:
│  ├─ Expected: FFD8 FF... (JPEG signature)
│  ├─ Actual: 3C3F 70... (PHP signature <?p)
│  └─ ❌ MISMATCH - UPLOAD REJECTED
│
├─ Error returned: "Invalid file format"
├─ File NOT saved to storage
└─ Security event logged

Layer 4: Storage
├─ File never reaches storage ✓
└─ Attack vector completely blocked ✓

Result: ✓✓✓ Attack prevented at multiple layers
```

---

## Deployment Topology

```
┌──────────────────────────────────────────────────────────────┐
│                      Internet                                │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   CDN (Optional)             │
        │   • Static files             │
        │   • Caching                  │
        │   • DDoS protection          │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Load Balancer (Optional)    │
        │  • Round-robin               │
        │  • SSL termination           │
        │  • Rate limiting             │
        └──────────────┬───────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    ┌───────┐     ┌───────┐      ┌───────┐
    │Nginx 1│     │Nginx 2│      │Nginx 3│
    │Django │     │Django │      │Django │
    │+DB    │     │+DB    │      │+DB    │
    └───────┘     └───────┘      └───────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Database (PostgreSQL)       │
        │  • User accounts             │
        │  • Sessions                  │
        │  • Password reset tokens     │
        │  • Audit logs                │
        └──────────────────────────────┘
        
        ┌──────────────────────────────┐
        │  File Storage                │
        │  • Outside web root          │
        │  • /var/uploads/             │
        │  • Backups encrypted         │
        │  • ClamAV scanning           │
        └──────────────────────────────┘

Security:
├─ HTTPS everywhere (port 443)
├─ HTTP → HTTPS redirect (port 80)
├─ Firewall blocks all except 80/443
├─ Rate limiting at load balancer
├─ Security headers on all responses
└─ Audit logging on all security events
```

---

This architecture ensures:

✅ Defense in depth (multiple security layers)  
✅ No single point of failure (distributed)  
✅ Performance optimization (CDN, load balancing)  
✅ Scalability (horizontal scaling)  
✅ Monitoring and logging (security events)  
✅ Data protection (encryption, secure storage)  
✅ Compliance ready (OWASP, PCI DSS, GDPR)  

All protections are active and integrated into the system.
