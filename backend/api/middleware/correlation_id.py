# backend/api/middleware/correlation_id.py
"""
Middleware for adding correlation IDs to requests for better logging and tracing.
"""

import uuid
import logging
from django.conf import settings

logger = logging.getLogger('api')


class CorrelationIdFilter(logging.Filter):
    """
    Logging filter that adds correlation ID to log records.
    """

    def filter(self, record):
        # Try to get correlation ID from current request context
        # This is a simplified version - in production you'd use thread-local storage
        correlation_id = getattr(record, 'correlation_id', 'unknown')

        # Add correlation ID to the log record
        record.correlation_id = correlation_id

        # Add other contextual information if available
        if hasattr(record, 'user_id'):
            record.user_id = getattr(record, 'user_id', None)
        if hasattr(record, 'ip'):
            record.ip = getattr(record, 'ip', None)
        if hasattr(record, 'method'):
            record.method = getattr(record, 'method', None)
        if hasattr(record, 'path'):
            record.path = getattr(record, 'path', None)
        if hasattr(record, 'status_code'):
            record.status_code = getattr(record, 'status_code', None)

        return True


class CorrelationIdMiddleware:
    """
    Middleware that adds a correlation ID to each request for tracing.
    The correlation ID is added to request metadata and included in logs.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Generate or use existing correlation ID
        correlation_id = self._get_correlation_id(request)

        # Add to request for use in views
        request.correlation_id = correlation_id

        # Add to response headers
        response = self.get_response(request)
        response['X-Correlation-ID'] = correlation_id

        return response

    def _get_correlation_id(self, request):
        """
        Get correlation ID from header or generate new one.
        """
        # Check if correlation ID was provided in request headers
        correlation_id = request.META.get('HTTP_X_CORRELATION_ID')

        if correlation_id:
            # Validate that it's a valid UUID
            try:
                uuid.UUID(correlation_id)
                return correlation_id
            except (ValueError, TypeError):
                logger.warning(f"Invalid correlation ID provided: {correlation_id}")

        # Generate new correlation ID
        return str(uuid.uuid4())


class RequestLoggingMiddleware:
    """
    Middleware for enhanced request logging with correlation IDs.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log request start
        correlation_id = getattr(request, 'correlation_id', 'unknown')
        user_id = request.user.id if request.user.is_authenticated else None
        ip = self._get_client_ip(request)

        logger.info(
            "Request started",
            extra={
                'correlation_id': correlation_id,
                'user_id': user_id,
                'ip': ip,
                'method': request.method,
                'path': request.path,
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            }
        )

        response = self.get_response(request)

        # Log request completion
        logger.info(
            "Request completed",
            extra={
                'correlation_id': correlation_id,
                'user_id': user_id,
                'ip': ip,
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'response_time': getattr(response, 'response_time', None),
            }
        )

        return response

    def _get_client_ip(self, request):
        """Extract client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')