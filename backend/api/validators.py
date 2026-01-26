"""
Input validation utilities and decorators for DRF views.
"""
import re
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


class ValidationError(Exception):
    """Custom validation error."""
    def __init__(self, message, field=None):
        self.message = message
        self.field = field
        super().__init__(message)


def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValidationError("Invalid email format.", field="email")
    return email


def validate_password(password):
    """Validate password strength."""
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long.", field="password")
    
    if not re.search(r'[A-Z]', password):
        raise ValidationError("Password must contain at least one uppercase letter.", field="password")
    
    if not re.search(r'[0-9]', password):
        raise ValidationError("Password must contain at least one digit.", field="password")
    
    if not re.search(r'[!@#$%^&*()_+=\-\[\]{};:,.<>?]', password):
        raise ValidationError("Password must contain at least one special character.", field="password")
    
    return password


def validate_username(username):
    """Validate username format."""
    if len(username) < 3 or len(username) > 50:
        raise ValidationError("Username must be between 3 and 50 characters.", field="username")
    
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        raise ValidationError("Username can only contain letters, numbers, underscores, and hyphens.", field="username")
    
    return username


def validate_request_data(required_fields=None):
    """
    Decorator to validate required fields in request data.
    
    Usage:
        @validate_request_data(required_fields=['email', 'password'])
        def post(self, request):
            ...
    """
    if required_fields is None:
        required_fields = []
    
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            missing_fields = []
            
            for field in required_fields:
                if field not in request.data or request.data[field] is None:
                    missing_fields.append(field)
            
            if missing_fields:
                return Response(
                    {
                        "error": "Missing required fields",
                        "missing_fields": missing_fields
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                return func(self, request, *args, **kwargs)
            except ValidationError as e:
                return Response(
                    {"error": e.message, "field": e.field},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                logger.error(f"Unexpected error in {func.__name__}: {str(e)}")
                return Response(
                    {"error": "An unexpected error occurred."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return wrapper
    return decorator


def sanitize_string(value, max_length=None, allow_html=False):
    """Sanitize string input."""
    if not isinstance(value, str):
        raise ValidationError("Value must be a string.")
    
    # Remove potentially dangerous characters if HTML not allowed
    if not allow_html:
        dangerous_chars = ['<', '>', '{', '}', ';']
        for char in dangerous_chars:
            if char in value:
                raise ValidationError(f"Invalid character in input: {char}")
    
    # Trim whitespace
    value = value.strip()
    
    # Check max length
    if max_length and len(value) > max_length:
        raise ValidationError(f"Value exceeds maximum length of {max_length} characters.")
    
    return value
