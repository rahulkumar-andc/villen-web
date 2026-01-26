"""
Custom DRF Exception Handler

Provides secure error responses that don't leak sensitive information.
"""

import logging
from rest_framework.views import exception_handler
from rest_framework import status

logger = logging.getLogger('api')


def custom_exception_handler(exc, context):
    """
    Custom exception handler that:
    1. Uses DRF's default handler
    2. Logs all exceptions securely
    3. Removes sensitive information from response
    4. Provides user-friendly error messages
    
    Args:
        exc: Exception that was raised
        context: Context dict with request, view, etc.
    
    Returns:
        Response with safe error message
    """
    
    # Get the standard DRF response
    response = exception_handler(exc, context)
    
    # Log the exception
    request = context.get('request')
    view = context.get('view')
    
    logger.warning(
        f"API Exception: {exc.__class__.__name__}",
        extra={
            'exception': str(exc),
            'method': request.method if request else None,
            'path': request.path if request else None,
            'user': request.user.username if request and request.user.is_authenticated else 'anonymous',
            'ip': _get_client_ip(request) if request else None,
            'view': view.__class__.__name__ if view else None,
        }
    )
    
    # If response is None, create a 500 response
    if response is None:
        logger.error(
            f"Unhandled Exception: {exc.__class__.__name__}",
            extra={'exception': str(exc)},
            exc_info=True
        )
        
        # Don't expose internal errors in production
        response_data = {
            'error': 'Internal Server Error',
            'detail': 'An unexpected error occurred. Our team has been notified.',
            'status': status.HTTP_500_INTERNAL_SERVER_ERROR
        }
        
        # In development, include exception details
        if context.get('request') and hasattr(context['request'], 'user'):
            from django.conf import settings
            if settings.DEBUG:
                response_data['exception'] = str(exc)
        
        from rest_framework.response import Response
        return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # ========================================================================
    # Sanitize response data
    # ========================================================================
    
    if response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR:
        # Hide internal error details from users
        response.data = {
            'error': 'Internal Server Error',
            'detail': 'An unexpected error occurred. Our team has been notified.',
            'status': status.HTTP_500_INTERNAL_SERVER_ERROR
        }
    
    elif response.status_code == status.HTTP_403_FORBIDDEN:
        # Don't reveal why access is denied
        response.data = {
            'error': 'Forbidden',
            'detail': 'You do not have permission to access this resource.',
            'status': status.HTTP_403_FORBIDDEN
        }
    
    elif response.status_code == status.HTTP_401_UNAUTHORIZED:
        # Clear token info
        if 'detail' in response.data:
            response.data['detail'] = 'Authentication credentials were not provided or are invalid.'
        response.data['status'] = status.HTTP_401_UNAUTHORIZED
    
    elif response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
        # Rate limit message
        response.data = {
            'error': 'Too Many Requests',
            'detail': 'You have exceeded the rate limit. Please try again later.',
            'status': status.HTTP_429_TOO_MANY_REQUESTS
        }
        logger.warning(
            'Rate limit exceeded',
            extra={
                'ip': _get_client_ip(request) if request else None,
                'path': request.path if request else None,
                'user': request.user.username if request and request.user.is_authenticated else 'anonymous',
            }
        )
    
    # ========================================================================
    # Add standard response fields
    # ========================================================================
    
    if response and 'status' not in response.data:
        response.data['status'] = response.status_code
    
    return response


def _get_client_ip(request):
    """Extract client IP from request."""
    if not request:
        return None
    
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
