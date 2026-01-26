"""
Security Headers Middleware for Django

Adds comprehensive security headers to all responses:
- X-Frame-Options: Prevents clickjacking
- X-Content-Type-Options: Prevents MIME sniffing
- X-XSS-Protection: Enables browser XSS filtering
- Strict-Transport-Security: Enforces HTTPS
- Content-Security-Policy: Controls resource loading
"""

import logging
from django.conf import settings

logger = logging.getLogger('django.security')


class SecurityHeadersMiddleware:
    """
    Add security headers to all responses.
    
    Headers added:
    - X-Frame-Options: DENY (prevent clickjacking)
    - X-Content-Type-Options: nosniff (prevent MIME sniffing)
    - X-XSS-Protection: 1; mode=block (enable XSS filter)
    - Strict-Transport-Security: max-age=31536000; includeSubDomains (HTTPS only)
    - X-Permitted-Cross-Domain-Policies: none (prevent cross-domain policies)
    - Referrer-Policy: strict-origin-when-cross-origin (limit referrer info)
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # ============================================================
        # Clickjacking Protection
        # ============================================================
        response['X-Frame-Options'] = 'DENY'
        
        # ============================================================
        # MIME Sniffing Prevention
        # ============================================================
        response['X-Content-Type-Options'] = 'nosniff'
        
        # ============================================================
        # XSS Protection
        # ============================================================
        response['X-XSS-Protection'] = '1; mode=block'
        
        # ============================================================
        # HTTPS Enforcement
        # ============================================================
        if not settings.DEBUG:
            # Strict-Transport-Security: Force HTTPS for 1 year
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        # ============================================================
        # Cross-Domain Policy
        # ============================================================
        response['X-Permitted-Cross-Domain-Policies'] = 'none'
        
        # ============================================================
        # Referrer Policy
        # ============================================================
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # ============================================================
        # Content Security Policy (CSP)
        # ============================================================
        if settings.DEBUG:
            # Development CSP - more permissive
            csp_directives = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173 https://localhost:5173",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https: blob:",
                "connect-src 'self' http://localhost:5173 https://localhost:5173 ws://localhost:5173 wss://localhost:5173",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "upgrade-insecure-requests",
            ]
        else:
            # Production CSP - strict
            csp_directives = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline'",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https:",
                "connect-src 'self'",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "upgrade-insecure-requests",
                "block-all-mixed-content",
            ]
        
        response['Content-Security-Policy'] = '; '.join(csp_directives)
        
        # ============================================================
        # Permissions Policy (Feature Policy)
        # ============================================================
        response['Permissions-Policy'] = (
            'accelerometer=(), '
            'ambient-light-sensor=(), '
            'autoplay=(), '
            'camera=(), '
            'encrypted-media=(), '
            'fullscreen=(self), '
            'geolocation=(), '
            'gyroscope=(), '
            'magnetometer=(), '
            'microphone=(), '
            'midi=(), '
            'payment=(), '
            'usb=(), '
            'vr=()'
        )
        
        return response


class RateLimitExceededMiddleware:
    """
    Log when rate limits are exceeded.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Log 429 (Too Many Requests) responses
        if response.status_code == 429:
            logger.warning(
                f"Rate limit exceeded",
                extra={
                    'ip': self._get_client_ip(request),
                    'path': request.path,
                    'method': request.method,
                    'user': request.user.username if request.user.is_authenticated else 'anonymous',
                }
            )
        
        # Log 403 (Forbidden) responses
        if response.status_code == 403:
            logger.warning(
                f"Forbidden request",
                extra={
                    'ip': self._get_client_ip(request),
                    'path': request.path,
                    'method': request.method,
                    'user': request.user.username if request.user.is_authenticated else 'anonymous',
                }
            )
        
        return response
    
    @staticmethod
    def _get_client_ip(request):
        """Extract client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class IPWhitelistMiddleware:
    """
    Optionally whitelist IPs for sensitive endpoints.
    Configure via SECURITY_IP_WHITELIST environment variable.
    """
    
    WHITELISTED_IPS = None
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Load whitelisted IPs from environment
        import os
        whitelist_str = os.getenv('SECURITY_IP_WHITELIST', '')
        if whitelist_str:
            self.WHITELISTED_IPS = set(ip.strip() for ip in whitelist_str.split(','))
    
    def __call__(self, request):
        # Check if request is to a protected endpoint
        protected_paths = ['/api/dashboard/', '/api/admin/']
        
        if self.WHITELISTED_IPS and any(request.path.startswith(p) for p in protected_paths):
            client_ip = self._get_client_ip(request)
            
            if client_ip not in self.WHITELISTED_IPS:
                logger.warning(
                    f"Access attempt from non-whitelisted IP",
                    extra={
                        'ip': client_ip,
                        'path': request.path,
                        'user': request.user.username if request.user.is_authenticated else 'anonymous',
                    }
                )
        
        return self.get_response(request)
    
    @staticmethod
    def _get_client_ip(request):
        """Extract client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
