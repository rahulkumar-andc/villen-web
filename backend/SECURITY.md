# 🔐 Shadow Layer - Security Documentation

Complete security implementation for the authentication system.

---

## 🛡️ Threat Protection Matrix

| # | Attack Vector | Protection | Status |
|---|--------------|------------|--------|
| 1 | Dummy User Registration | OTP before user creation | ✅ |
| 2 | OTP Brute Force | 5 attempts, then locked | ✅ |
| 3 | Email Enumeration | Generic responses | ✅ |
| 4 | Password Brute Force | 5 attempts, 15min lockout | ✅ |
| 5 | JWT Token Theft | Blacklisting + 30min expiry | ✅ |
| 6 | Role Escalation | Server-side only assignment | ✅ |
| 7 | Password Reset Abuse | Email OTP verification | ✅ |
| 8 | Token Replay | All tokens invalidated on reset | ✅ |

---

## 📋 Attack Mitigations

### 1. Dummy User Registration
**Attack**: Random emails create fake accounts.
```
Protection:
✅ OTP verification before user creation
✅ No DB entry until verified
✅ OTP expires in 10 min
```

### 2. OTP Brute Force
**Attack**: Guess OTP repeatedly.
```
Protection:
✅ Max 5 attempts per OTP
✅ OTP locked after 5 failures
✅ Must request new OTP
```

### 3. Email Enumeration
**Attack**: Check which emails exist.
```
Protection:
✅ Same response for valid/invalid emails
✅ "If this email exists, an OTP has been sent"
```

### 4. Password Brute Force
**Attack**: Guess password repeatedly.
```
Protection:
✅ Max 5 login attempts
✅ 15-minute account lockout
✅ Attempts reset on success
```

### 5. JWT Token Theft
**Attack**: Stolen token reuse.
```
Protection:
✅ 30-minute access token expiry
✅ 7-day refresh token expiry
✅ Token rotation enabled
✅ Logout blacklists tokens
```

### 6. Role Escalation
**Attack**: Self-promote to Admin.
```
Protection:
✅ Roles assigned server-side only
✅ RBAC permission checks
✅ No public role change API
```

### 7. Password Reset Abuse
**Attack**: Reset another user's password.
```
Protection:
✅ OTP sent to registered email only
✅ OTP expiry + one-time use
✅ Brute force protection
```

### 8. Token Replay
**Attack**: Reuse old tokens.
```
Protection:
✅ Password reset invalidates ALL tokens
✅ Token blacklist enforced
```

---

## 🔑 JWT Configuration

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': 30 minutes,
    'REFRESH_TOKEN_LIFETIME': 7 days,
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

---

## 👥 RBAC Hierarchy

| Level | Role | Type |
|-------|------|------|
| 1 | Super Admin | System |
| 2 | Admin | System |
| 3 | Monitor | System |
| 4 | Developer | Application |
| 5 | Premium | User |
| 6 | Normal | User (default) |
| 7 | Guest | User |

---

## 📡 Auth Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/send-otp/` | POST | Registration OTP |
| `/api/auth/verify-otp/` | POST | Verify OTP |
| `/api/auth/register/` | POST | Create user |
| `/api/auth/login/` | POST | Login |
| `/api/auth/logout/` | POST | Blacklist token |
| `/api/auth/forgot-password/` | POST | Reset OTP |
| `/api/auth/verify-reset-otp/` | POST | Verify reset |
| `/api/auth/reset-password/` | POST | New password |
| `/api/auth/token/refresh/` | POST | Refresh JWT |

---

## 🏗️ Production Checklist

- [ ] Enable HTTPS (SSL/TLS)
- [ ] Configure real SMTP (Gmail/SendGrid)
- [ ] Set `DEBUG = False`
- [ ] Use strong `SECRET_KEY`
- [ ] Enable CORS restrictions
- [ ] Set up logging & monitoring

---

**Author**: Shadow Layer Security Team  
**Version**: 1.0
