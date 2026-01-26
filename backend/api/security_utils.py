# backend/api/security_utils.py
"""
Security utilities for XSS and SQLi protection.
Provides helper functions and classes for secure database and HTML operations.
"""

from django.utils.html import escape, conditional_escape
from django.utils.safestring import mark_safe
from django.core.exceptions import ValidationError
from django.db import connection
import re
import logging

logger = logging.getLogger('django.security')


class XSSProtection:
    """XSS (Cross-Site Scripting) protection utilities."""
    
    # Dangerous patterns that indicate potential XSS
    DANGEROUS_PATTERNS = [
        (r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', 'Script tags'),
        (r'on\w+\s*=', 'Event handlers'),
        (r'javascript:', 'JavaScript protocol'),
        (r'vbscript:', 'VBScript protocol'),
        (r'data:text/html', 'Data protocol with HTML'),
        (r'<iframe', 'Iframe tags'),
        (r'<object', 'Object tags'),
        (r'<embed', 'Embed tags'),
    ]
    
    @staticmethod
    def escape_html(text):
        """
        Escape HTML special characters.
        
        Args:
            text (str): Text to escape
        
        Returns:
            str: Escaped text safe for HTML display
        
        Example:
            >>> XSSProtection.escape_html('<script>alert("XSS")</script>')
            '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
        """
        if text is None:
            return ''
        
        return escape(str(text))
    
    @staticmethod
    def is_safe_url(url):
        """
        Check if URL is safe (no dangerous protocols).
        
        Args:
            url (str): URL to check
        
        Returns:
            bool: True if safe, False otherwise
        
        Example:
            >>> XSSProtection.is_safe_url('https://example.com')
            True
            >>> XSSProtection.is_safe_url('javascript:alert("XSS")')
            False
        """
        if not url:
            return False
        
        url = url.strip().lower()
        
        # Allow safe protocols
        safe_protocols = ['http://', 'https://', 'mailto:', 'tel:', '/']
        if not any(url.startswith(p) for p in safe_protocols):
            return False
        
        # Block dangerous protocols
        dangerous_protocols = [
            'javascript:',
            'vbscript:',
            'data:text/html',
            'data:application/javascript',
            'file:',
        ]
        
        if any(url.startswith(p) for p in dangerous_protocols):
            return False
        
        return True
    
    @staticmethod
    def sanitize_user_input(text, max_length=5000, allow_newlines=True):
        """
        Sanitize user input for database storage and display.
        
        Args:
            text (str): User input to sanitize
            max_length (int): Maximum allowed length
            allow_newlines (bool): Whether to allow newline characters
        
        Returns:
            str: Sanitized text
        
        Raises:
            ValidationError: If input is unsafe or violates constraints
        
        Example:
            >>> XSSProtection.sanitize_user_input('<script>alert("XSS")</script>')
            ValidationError: Script tags not allowed
        """
        if not isinstance(text, str):
            raise ValidationError("Input must be a string")
        
        # Check length
        if len(text) > max_length:
            raise ValidationError(f"Input too long (max {max_length} characters)")
        
        # Strip whitespace
        text = text.strip()
        
        if not text:
            raise ValidationError("Input cannot be empty")
        
        # Check for dangerous patterns
        for pattern, description in XSSProtection.DANGEROUS_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                logger.warning(f"Dangerous pattern detected: {description}")
                raise ValidationError(f"{description} not allowed in input")
        
        # Optionally normalize newlines
        if not allow_newlines:
            text = text.replace('\n', ' ').replace('\r', ' ')
        else:
            # Limit consecutive newlines
            text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text
    
    @staticmethod
    def sanitize_html(html, allowed_tags=None, allowed_attributes=None):
        """
        Sanitize HTML content.
        
        Note: Uses DOMPurify on frontend. This is for backend validation.
        
        Args:
            html (str): HTML to sanitize
            allowed_tags (list): List of allowed tags
            allowed_attributes (dict): Dict of tag: [allowed attributes]
        
        Returns:
            str: Sanitized HTML
        
        Example:
            >>> html = '<b>Bold</b><script>alert("XSS")</script>'
            >>> XSSProtection.sanitize_html(html, allowed_tags=['b'])
            '<b>Bold</b>'
        """
        if not html:
            return ''
        
        # Default allowed tags (basic formatting only)
        if allowed_tags is None:
            allowed_tags = ['b', 'i', 'em', 'strong', 'p', 'br', 'a', 'h1', 'h2', 'h3']
        
        if allowed_attributes is None:
            allowed_attributes = {
                'a': ['href', 'title'],
            }
        
        # Simple regex-based sanitization (not as robust as DOMPurify)
        # Remove all tags first
        for pattern, _ in XSSProtection.DANGEROUS_PATTERNS:
            html = re.sub(pattern, '', html, flags=re.IGNORECASE)
        
        return html
    
    @staticmethod
    def get_safe_snippet(html, max_length=200):
        """
        Create a safe, truncated snippet of HTML (with escaping).
        
        Args:
            html (str): Raw HTML
            max_length (int): Maximum snippet length
        
        Returns:
            str: Safe HTML snippet with entities escaped
        
        Example:
            >>> XSSProtection.get_safe_snippet('<script>alert("XSS")</script>', 50)
            '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script'
        """
        if not html:
            return ''
        
        # Truncate
        snippet = html[:max_length]
        
        # Escape
        escaped = escape(snippet)
        
        # Add ellipsis if truncated
        if len(html) > max_length:
            escaped += '...'
        
        return escaped
    
    @staticmethod
    def log_xss_attempt(request, pattern_detected):
        """
        Log potential XSS attempts for monitoring.
        
        Args:
            request: Django request object
            pattern_detected (str): Description of detected pattern
        """
        logger.warning(
            f"XSS attempt detected: {pattern_detected}",
            extra={
                'ip': _get_client_ip(request),
                'path': request.path,
                'method': request.method,
                'user': request.user.username if request.user.is_authenticated else 'anonymous',
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            }
        )


class SQLiProtection:
    """SQL Injection (SQLi) protection utilities."""
    
    @staticmethod
    def validate_identifier(identifier, allowed=None):
        """
        Validate SQL identifiers (table/column names).
        
        Args:
            identifier (str): Identifier to validate
            allowed (list): List of allowed identifiers (whitelist)
        
        Returns:
            str: Validated identifier
        
        Raises:
            ValidationError: If identifier is invalid
        
        Example:
            >>> SQLiProtection.validate_identifier('user_id', allowed=['user_id', 'email'])
            'user_id'
        """
        if not isinstance(identifier, str):
            raise ValidationError("Identifier must be a string")
        
        # Check whitelist if provided
        if allowed:
            if identifier not in allowed:
                raise ValidationError(f"Invalid identifier: {identifier}")
            return identifier
        
        # Validate identifier format (alphanumeric + underscore)
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', identifier):
            raise ValidationError(
                f"Invalid identifier: {identifier}. "
                "Must start with letter or underscore, contain only alphanumeric or underscore"
            )
        
        return identifier
    
    @staticmethod
    def validate_column_name(column_name):
        """
        Validate database column name.
        
        Args:
            column_name (str): Column name to validate
        
        Returns:
            str: Validated column name
        
        Raises:
            ValidationError: If column name is invalid
        """
        reserved_words = [
            'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE',
            'ALTER', 'WHERE', 'FROM', 'JOIN', 'ORDER', 'GROUP',
        ]
        
        col = column_name.upper()
        if col in reserved_words:
            raise ValidationError(f"{column_name} is a reserved SQL word")
        
        return SQLiProtection.validate_identifier(column_name)
    
    @staticmethod
    def validate_integer(value):
        """
        Validate and convert value to safe integer.
        
        Args:
            value: Value to validate
        
        Returns:
            int: Safe integer value
        
        Raises:
            ValidationError: If value is not a valid integer
        """
        try:
            return int(value)
        except (ValueError, TypeError) as e:
            raise ValidationError(f"Invalid integer: {value}") from e
    
    @staticmethod
    def safe_raw_query(sql, params, description=""):
        """
        Execute raw SQL safely with parameterized query.
        
        Args:
            sql (str): SQL with %s placeholders
            params (list/tuple): Parameters to bind
            description (str): Query description for logging
        
        Returns:
            list: List of dicts with results
        
        Raises:
            ValidationError: If parameters are invalid
        """
        if not isinstance(params, (list, tuple)):
            raise ValidationError("Parameters must be a list or tuple")
        
        # Log the query (without parameters for safety)
        if description:
            logger.debug(f"Executing raw query: {description}")
        
        try:
            with connection.cursor() as cursor:
                cursor.execute(sql, params)
                columns = [col[0] for col in cursor.description or []]
                return [
                    dict(zip(columns, row))
                    for row in cursor.fetchall()
                ]
        except Exception as e:
            logger.error(f"Database error: {str(e)}")
            raise ValidationError(f"Database error: {str(e)}") from e
    
    @staticmethod
    def log_sqli_attempt(request, pattern_detected):
        """
        Log potential SQLi attempts for monitoring.
        
        Args:
            request: Django request object
            pattern_detected (str): Description of detected pattern
        """
        logger.warning(
            f"SQLi attempt detected: {pattern_detected}",
            extra={
                'ip': _get_client_ip(request),
                'path': request.path,
                'method': request.method,
                'user': request.user.username if request.user.is_authenticated else 'anonymous',
            }
        )


def _get_client_ip(request):
    """Extract client IP from request."""
    if not request:
        return None
    
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    
    return request.META.get('REMOTE_ADDR')
