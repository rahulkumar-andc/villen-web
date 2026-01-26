# backend/api/csrf_auth_upload_utils.py
"""
Unified security utilities for CSRF, Authentication, and File Upload protection.
"""

import os
import uuid
import secrets
import hashlib
import logging
from datetime import datetime, timedelta
from functools import wraps

from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings
from django.middleware.csrf import get_token

logger = logging.getLogger('django.security')


# ==================== CSRF Protection ====================

class CSRFProtection:
    """CSRF (Cross-Site Request Forgery) protection utilities."""
    
    @staticmethod
    def generate_token(request):
        """Generate CSRF token for session"""
        token = get_token(request)
        return token
    
    @staticmethod
    def validate_token(request):
        """Validate CSRF token in request"""
        if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            token_from_header = request.headers.get('X-CSRFToken', '')
            token_from_cookie = request.COOKIES.get('csrftoken', '')
            
            # Token should be in header (from form or JS)
            if not token_from_header:
                logger.warning(f"CSRF token missing from headers: {request.path}")
                return False
            
            # Validate token matches
            from django.middleware.csrf import CsrfViewMiddleware
            middleware = CsrfViewMiddleware(lambda r: None)
            
            try:
                middleware.process_request(request)
                return True
            except:
                return False
        
        return True
    
    @staticmethod
    def validate_origin(request):
        """Validate Origin/Referer headers"""
        if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            origin = request.headers.get('Origin', '')
            referer = request.headers.get('Referer', '')
            
            allowed_origins = getattr(settings, 'CSRF_TRUSTED_ORIGINS', [])
            
            if origin:
                if origin not in allowed_origins and origin not in [
                    f"https://{host}" for host in getattr(settings, 'ALLOWED_HOSTS', [])
                ]:
                    logger.warning(f"CSRF origin mismatch: {origin} not in {allowed_origins}")
                    return False
            
            if referer:
                from urllib.parse import urlparse
                referer_origin = urlparse(referer).netloc
                
                if referer_origin not in [
                    urlparse(o).netloc for o in allowed_origins
                ]:
                    logger.warning(f"CSRF referer mismatch: {referer_origin}")
                    return False
        
        return True
    
    @staticmethod
    def log_csrf_attempt(request, reason):
        """Log potential CSRF attack"""
        logger.warning(
            f"CSRF attack detected: {reason}",
            extra={
                'ip': _get_client_ip(request),
                'path': request.path,
                'method': request.method,
                'origin': request.headers.get('Origin', ''),
                'referer': request.headers.get('Referer', ''),
            }
        )


def csrf_protect_ajax(view_func):
    """Decorator to protect AJAX endpoints from CSRF"""
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        if not CSRFProtection.validate_token(request):
            CSRFProtection.log_csrf_attempt(request, "Invalid CSRF token")
            return JsonResponse({'error': 'CSRF validation failed'}, status=403)
        
        if not CSRFProtection.validate_origin(request):
            CSRFProtection.log_csrf_attempt(request, "Invalid origin")
            return JsonResponse({'error': 'Invalid origin'}, status=403)
        
        return view_func(request, *args, **kwargs)
    
    return wrapped_view


# ==================== Authentication ====================

class AuthenticationSecurity:
    """Secure authentication and session management."""
    
    FAILED_ATTEMPTS_KEY = 'login_attempts_{}'
    MAX_FAILED_ATTEMPTS = 5
    LOCKOUT_DURATION = 1800  # 30 minutes
    
    @staticmethod
    def hash_password(password):
        """Hash password (Django handles automatically)"""
        user = User(username='temp')
        user.set_password(password)
        return user.password
    
    @staticmethod
    def validate_password_strength(password):
        """Validate password strength"""
        from django.contrib.auth.password_validation import validate_password
        
        try:
            validate_password(password)
            return True, "Password is strong"
        except ValidationError as e:
            return False, str(e)
    
    @staticmethod
    def is_account_locked(username):
        """Check if account is locked"""
        attempts_key = AuthenticationSecurity.FAILED_ATTEMPTS_KEY.format(username)
        attempts = cache.get(attempts_key, 0)
        return attempts >= AuthenticationSecurity.MAX_FAILED_ATTEMPTS
    
    @staticmethod
    def record_failed_attempt(username):
        """Record failed login attempt"""
        attempts_key = AuthenticationSecurity.FAILED_ATTEMPTS_KEY.format(username)
        attempts = cache.get(attempts_key, 0)
        cache.set(
            attempts_key,
            attempts + 1,
            AuthenticationSecurity.LOCKOUT_DURATION
        )
        
        logger.warning(f"Failed login attempt for {username} (attempt {attempts + 1})")
    
    @staticmethod
    def clear_failed_attempts(username):
        """Clear failed attempts on successful login"""
        attempts_key = AuthenticationSecurity.FAILED_ATTEMPTS_KEY.format(username)
        cache.delete(attempts_key)
    
    @staticmethod
    def generate_session_token():
        """Generate secure session token"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def log_authentication_event(user, event_type, success=True):
        """Log authentication events"""
        log_message = f"Authentication {event_type}: {user.username}"
        
        if success:
            logger.info(log_message)
        else:
            logger.warning(log_message)


class PasswordReset:
    """Secure password reset functionality."""
    
    TOKEN_EXPIRY = 3600  # 1 hour
    TOKEN_LENGTH = 64
    
    @staticmethod
    def generate_reset_token():
        """Generate secure reset token"""
        return secrets.token_urlsafe(PasswordReset.TOKEN_LENGTH)
    
    @staticmethod
    def create_reset_request(user):
        """Create password reset request"""
        from .models import PasswordResetToken
        
        # Invalidate old tokens
        PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
        
        token = PasswordReset.generate_reset_token()
        expires_at = timezone.now() + timedelta(seconds=PasswordReset.TOKEN_EXPIRY)
        
        reset = PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
        
        logger.info(f"Password reset requested for {user.email}")
        
        return token
    
    @staticmethod
    def validate_reset_token(token):
        """Validate reset token"""
        from .models import PasswordResetToken
        
        try:
            reset = PasswordResetToken.objects.get(
                token=token,
                used=False,
                expires_at__gte=timezone.now()
            )
            return reset
        except PasswordResetToken.DoesNotExist:
            logger.warning(f"Invalid password reset token: {token}")
            return None
    
    @staticmethod
    def reset_password(reset_token, new_password):
        """Reset password with token"""
        from .models import PasswordResetToken
        
        # Validate token
        if not reset_token or reset_token.used:
            return False, "Token already used"
        
        if reset_token.expires_at < timezone.now():
            return False, "Token expired"
        
        # Validate password strength
        is_strong, message = AuthenticationSecurity.validate_password_strength(new_password)
        if not is_strong:
            return False, message
        
        # Update password
        user = reset_token.user
        user.set_password(new_password)
        user.save()
        
        # Mark token as used
        reset_token.used = True
        reset_token.save()
        
        logger.info(f"Password reset successful for {user.email}")
        
        return True, "Password reset successful"


def rate_limit_login(view_func):
    """Decorator to rate limit login attempts"""
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        # Get client IP
        ip = _get_client_ip(request)
        ip_key = f'login_rate_limit_{ip}'
        
        # Check rate limit
        attempts = cache.get(ip_key, 0)
        if attempts >= 10:  # 10 attempts
            logger.warning(f"Login rate limit exceeded for IP: {ip}")
            return JsonResponse(
                {'error': 'Too many login attempts'},
                status=429
            )
        
        # Increment counter
        cache.set(ip_key, attempts + 1, 60)  # 1 minute window
        
        return view_func(request, *args, **kwargs)
    
    return wrapped_view


# ==================== File Upload ====================

class FileUploadSecurity:
    """Secure file upload handling."""
    
    # Allowed file types
    ALLOWED_EXTENSIONS = {
        'image': {'jpg', 'jpeg', 'png', 'gif', 'webp'},
        'document': {'pdf', 'doc', 'docx', 'txt', 'xlsx'},
        'archive': {'zip', 'tar', 'gz'},
    }
    
    ALLOWED_MIMES = {
        'image': {'image/jpeg', 'image/png', 'image/gif', 'image/webp'},
        'document': {'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'},
    }
    
    MAX_SIZES = {
        'image': 5 * 1024 * 1024,      # 5MB
        'document': 10 * 1024 * 1024,  # 10MB
        'archive': 50 * 1024 * 1024,   # 50MB
    }
    
    FILE_SIGNATURES = {
        b'\xFF\xD8\xFF': 'jpg',
        b'\x89PNG': 'png',
        b'GIF87a': 'gif',
        b'GIF89a': 'gif',
        b'%PDF': 'pdf',
        b'PK\x03\x04': 'zip',
    }
    
    DANGEROUS_EXTENSIONS = {
        'exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'vbs', 'js',
        'php', 'php3', 'php4', 'php5', 'phtml', 'jsp', 'asp',
        'aspx', 'cgi', 'pl', 'py', 'rb', 'sh', 'bash',
        'htaccess', 'web.config'
    }
    
    @staticmethod
    def validate_extension(filename, file_type='image'):
        """Validate file extension against whitelist"""
        if '.' not in filename:
            return False, "No file extension"
        
        ext = filename.rsplit('.', 1)[1].lower()
        
        # Check dangerous extensions first
        if ext in FileUploadSecurity.DANGEROUS_EXTENSIONS:
            return False, f"File type not allowed: {ext}"
        
        # Check whitelist
        allowed = FileUploadSecurity.ALLOWED_EXTENSIONS.get(file_type, set())
        if ext not in allowed:
            return False, f"Extension .{ext} not allowed for {file_type}"
        
        return True, ext
    
    @staticmethod
    def validate_file_content(file_obj):
        """Validate file content using magic bytes"""
        file_obj.seek(0)
        header = file_obj.read(20)
        file_obj.seek(0)
        
        for signature, ext in FileUploadSecurity.FILE_SIGNATURES.items():
            if header.startswith(signature):
                return True, ext
        
        return False, "Unknown file type"
    
    @staticmethod
    def validate_file_size(file_size, file_type='image'):
        """Validate file size"""
        max_size = FileUploadSecurity.MAX_SIZES.get(file_type, 5 * 1024 * 1024)
        
        if file_size > max_size:
            return False, f"File too large (max {max_size / 1024 / 1024:.0f}MB)"
        
        return True, "Size OK"
    
    @staticmethod
    def sanitize_filename(filename):
        """Generate safe filename"""
        _, ext = os.path.splitext(filename)
        ext = ext.lower()
        
        # Validate extension
        is_valid, _ = FileUploadSecurity.validate_extension(filename)
        if not is_valid:
            raise ValidationError("Invalid file extension")
        
        # Generate UUID-based filename
        safe_filename = f"{uuid.uuid4().hex}{ext}"
        
        return safe_filename
    
    @staticmethod
    def validate_upload(file_obj, file_type='image'):
        """Validate file upload comprehensively"""
        errors = []
        
        # Check size
        is_valid, message = FileUploadSecurity.validate_file_size(file_obj.size, file_type)
        if not is_valid:
            errors.append(message)
        
        # Check extension
        is_valid, message = FileUploadSecurity.validate_extension(file_obj.name, file_type)
        if not is_valid:
            errors.append(message)
        
        # Check content
        is_valid, ext = FileUploadSecurity.validate_file_content(file_obj)
        if not is_valid:
            errors.append(f"Invalid file content: {message}")
        
        if errors:
            return False, errors
        
        return True, "File is valid"
    
    @staticmethod
    def log_file_upload(user, filename, file_type, success=True, reason=''):
        """Log file upload events"""
        event = "File upload" if success else "File upload blocked"
        log_message = f"{event}: {filename} ({file_type})"
        
        if success:
            logger.info(log_message)
        else:
            logger.warning(f"{log_message} - Reason: {reason}")


def secure_upload_handler(file_type='image'):
    """Decorator for secure file upload endpoints"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            if 'file' not in request.FILES:
                return JsonResponse({'error': 'No file provided'}, status=400)
            
            file_obj = request.FILES['file']
            
            # Validate upload
            is_valid, message = FileUploadSecurity.validate_upload(file_obj, file_type)
            
            if not is_valid:
                FileUploadSecurity.log_file_upload(
                    request.user,
                    file_obj.name,
                    file_type,
                    success=False,
                    reason=str(message)
                )
                return JsonResponse({'error': message}, status=400)
            
            # Generate safe filename
            try:
                safe_filename = FileUploadSecurity.sanitize_filename(file_obj.name)
            except ValidationError as e:
                return JsonResponse({'error': str(e)}, status=400)
            
            # Log successful upload
            FileUploadSecurity.log_file_upload(
                request.user,
                safe_filename,
                file_type,
                success=True
            )
            
            # Pass safe filename to view
            request.safe_filename = safe_filename
            
            return view_func(request, *args, **kwargs)
        
        return wrapped_view
    return decorator


# ==================== Utility Functions ====================

def _get_client_ip(request):
    """Extract client IP from request"""
    if not request:
        return None
    
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    
    return request.META.get('REMOTE_ADDR')


# ==================== Models ====================

"""
Add these models to your models.py:

from django.db import models
from django.contrib.auth.models import User

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def is_valid(self):
        return not self.used and self.expires_at > timezone.now()


class FileUploadLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    success = models.BooleanField()
    reason = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
"""
