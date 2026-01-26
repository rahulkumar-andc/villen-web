# backend/api/auth_backends.py
"""
Custom authentication backends for API key authentication.
"""

import hmac
import hashlib
import logging
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings
from rest_framework import authentication, exceptions

from .models import APIKey, APIKeyUsage

logger = logging.getLogger('django.security')


class APIKeyAuthentication(authentication.BaseAuthentication):
    """
    REST Framework authentication class for API keys.
    Supports HMAC-SHA256 validation and rate limiting.
    """

    def authenticate(self, request):
        """
        Authenticate the request using API key.
        Returns (user, api_key) or None if authentication fails.
        """
        api_key_header = request.META.get('HTTP_X_API_KEY')
        if not api_key_header:
            return None

        try:
            # Parse API key (format: key:hmac)
            if ':' in api_key_header:
                key_id, provided_hmac = api_key_header.split(':', 1)
            else:
                key_id = api_key_header
                provided_hmac = None

            # Get API key from database
            api_key = APIKey.objects.select_related('user').get(
                key=key_id,
                is_active=True
            )

            # Check if expired
            if api_key.is_expired():
                logger.warning(f"Expired API key used: {key_id}")
                raise exceptions.AuthenticationFailed('API key has expired')

            # Validate HMAC if provided
            if provided_hmac:
                if not self._validate_hmac(request, api_key, provided_hmac):
                    logger.warning(f"Invalid HMAC for API key: {key_id}")
                    raise exceptions.AuthenticationFailed('Invalid API key signature')

            # Check rate limit
            if not self._check_rate_limit(api_key, request):
                logger.warning(f"Rate limit exceeded for API key: {key_id}")
                raise exceptions.AuthenticationFailed('Rate limit exceeded')

            # Update last used timestamp (async to avoid blocking)
            api_key.update_last_used()

            # Log usage
            self._log_usage(api_key, request)

            return (api_key.user, api_key)

        except APIKey.DoesNotExist:
            logger.warning(f"Invalid API key attempted: {api_key_header[:10]}...")
            raise exceptions.AuthenticationFailed('Invalid API key')
        except Exception as e:
            logger.error(f"API key authentication error: {str(e)}")
            raise exceptions.AuthenticationFailed('Authentication failed')

    def _validate_hmac(self, request, api_key, provided_hmac):
        """
        Validate HMAC-SHA256 signature.
        Format: HMAC-SHA256(key, method + url + body + timestamp)
        """
        try:
            # Get request components
            method = request.method
            url = request.build_absolute_uri(request.path)
            body = request.body.decode('utf-8') if request.body else ''
            timestamp = request.META.get('HTTP_X_TIMESTAMP', '')

            # Create message to sign
            message = f"{method}{url}{body}{timestamp}"

            # Calculate expected HMAC
            expected_hmac = hmac.new(
                api_key.key.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            # Use constant-time comparison
            return hmac.compare_digest(expected_hmac, provided_hmac)

        except Exception as e:
            logger.error(f"HMAC validation error: {str(e)}")
            return False

    def _check_rate_limit(self, api_key, request):
        """
        Check if API key is within rate limits.
        Uses cache for efficient rate limiting.
        """
        cache_key = f"api_key_ratelimit:{api_key.id}:{timezone.now().hour}"
        current_usage = cache.get(cache_key, 0)

        if current_usage >= api_key.rate_limit:
            return False

        # Increment usage
        cache.set(cache_key, current_usage + 1, 3600)  # 1 hour expiry
        return True

    def _log_usage(self, api_key, request):
        """
        Log API key usage for analytics and monitoring.
        """
        try:
            APIKeyUsage.objects.create(
                api_key=api_key,
                endpoint=request.path,
                method=request.method,
                status_code=getattr(request, 'status_code', 200),
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )
        except Exception as e:
            logger.error(f"Failed to log API key usage: {str(e)}")

    def _get_client_ip(self, request):
        """Extract client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class APIKeyBackend(BaseBackend):
    """
    Django authentication backend for API keys.
    Used for non-API views that need API key authentication.
    """

    def authenticate(self, request, api_key=None, **credentials):
        """Authenticate using API key."""
        if not api_key:
            return None

        try:
            api_key_obj = APIKey.objects.select_related('user').get(
                key=api_key,
                is_active=True
            )

            if not api_key_obj.is_expired():
                return api_key_obj.user

        except APIKey.DoesNotExist:
            pass

        return None

    def get_user(self, user_id):
        """Get user by ID."""
        from django.contrib.auth.models import User
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None