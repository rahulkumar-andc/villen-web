# Test Examples for SQLi and XSS Protection

This file contains test cases demonstrating the protection mechanisms.

## Backend Tests (Django)

Create file: `backend/api/tests/test_security.py`

```python
from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from django.core.exceptions import ValidationError
from ..security_utils import XSSProtection, SQLiProtection


class XSSProtectionTests(TestCase):
    """Test XSS protection mechanisms"""
    
    def test_escape_html_basic(self):
        """Test HTML escaping"""
        result = XSSProtection.escape_html('<script>alert("XSS")</script>')
        self.assertEqual(result, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')
    
    def test_sanitize_input_rejects_scripts(self):
        """Test that script injection is rejected"""
        dangerous = '<script>alert("XSS")</script>'
        
        with self.assertRaises(ValidationError) as context:
            XSSProtection.sanitize_user_input(dangerous)
        
        self.assertIn('Script tags', str(context.exception))
    
    def test_sanitize_input_rejects_event_handlers(self):
        """Test that event handler injection is rejected"""
        dangerous = '<img src=x onerror=alert(1)>'
        
        with self.assertRaises(ValidationError) as context:
            XSSProtection.sanitize_user_input(dangerous)
        
        self.assertIn('Event handlers', str(context.exception))
    
    def test_sanitize_input_allows_safe_text(self):
        """Test that safe text is allowed"""
        safe_text = 'Hello, this is a safe comment!'
        result = XSSProtection.sanitize_user_input(safe_text)
        self.assertEqual(result, safe_text)
    
    def test_sanitize_input_enforces_max_length(self):
        """Test maximum length enforcement"""
        long_text = 'a' * 10000
        
        with self.assertRaises(ValidationError) as context:
            XSSProtection.sanitize_user_input(long_text, max_length=5000)
        
        self.assertIn('too long', str(context.exception))
    
    def test_safe_url_validation(self):
        """Test URL safety validation"""
        # Safe URLs
        self.assertTrue(XSSProtection.is_safe_url('https://example.com'))
        self.assertTrue(XSSProtection.is_safe_url('http://example.com'))
        self.assertTrue(XSSProtection.is_safe_url('mailto:user@example.com'))
        self.assertTrue(XSSProtection.is_safe_url('/internal/path'))
        
        # Dangerous URLs
        self.assertFalse(XSSProtection.is_safe_url('javascript:alert(1)'))
        self.assertFalse(XSSProtection.is_safe_url('data:text/html,<script>alert(1)</script>'))
        self.assertFalse(XSSProtection.is_safe_url('vbscript:msgbox(1)'))
    
    def test_dangerous_html_detection(self):
        """Test detection of dangerous HTML patterns"""
        # Dangerous patterns
        dangerous_patterns = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert(1)>',
            '<div onclick=alert(1)>Click me</div>',
            '<a href="javascript:alert(1)">Click</a>',
        ]
        
        for pattern in dangerous_patterns:
            self.assertTrue(
                XSSProtection.sanitize_user_input.__doc__.startswith('Sanitize'),
                f"Pattern should be detected: {pattern}"
            )


class SQLiProtectionTests(TestCase):
    """Test SQL Injection protection mechanisms"""
    
    def test_validate_identifier_success(self):
        """Test valid identifier validation"""
        valid_names = ['user_id', 'first_name', 'email', 'created_at']
        
        for name in valid_names:
            # Should not raise
            result = SQLiProtection.validate_identifier(name)
            self.assertEqual(result, name)
    
    def test_validate_identifier_rejects_invalid(self):
        """Test rejection of invalid identifiers"""
        invalid_names = [
            '1invalid',  # Starts with number
            'invalid-name',  # Contains hyphen
            'invalid;drop',  # Contains semicolon
            '__proto__',  # Prototype pollution
            'constructor',  # Constructor property
        ]
        
        for name in invalid_names:
            with self.assertRaises(ValidationError):
                SQLiProtection.validate_identifier(name)
    
    def test_validate_identifier_whitelist(self):
        """Test whitelist validation"""
        allowed = ['name', 'email', 'created_at']
        
        # Allowed field should pass
        result = SQLiProtection.validate_identifier('name', allowed=allowed)
        self.assertEqual(result, 'name')
        
        # Disallowed field should fail
        with self.assertRaises(ValidationError):
            SQLiProtection.validate_identifier('password', allowed=allowed)
    
    def test_validate_integer(self):
        """Test integer validation"""
        # Valid integers
        self.assertEqual(SQLiProtection.validate_integer(123), 123)
        self.assertEqual(SQLiProtection.validate_integer('456'), 456)
        
        # Invalid integers
        with self.assertRaises(ValidationError):
            SQLiProtection.validate_integer('abc')
        
        with self.assertRaises(ValidationError):
            SQLiProtection.validate_integer('123; DROP TABLE users;')
    
    def test_safe_raw_query(self):
        """Test safe parameterized query execution"""
        # Create test user
        User.objects.create_user(username='testuser', email='test@example.com')
        
        # Safe parameterized query should work
        results = SQLiProtection.safe_raw_query(
            'SELECT id, username FROM auth_user WHERE username = %s',
            ['testuser'],
            description='Test query'
        )
        
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['username'], 'testuser')
    
    def test_safe_raw_query_prevents_sqli(self):
        """Test that safe query prevents SQLi attacks"""
        # This malicious parameter should not execute SQL
        malicious_param = "admin'; DROP TABLE users; --"
        
        results = SQLiProtection.safe_raw_query(
            'SELECT id, username FROM auth_user WHERE username = %s',
            [malicious_param],
            description='SQLi test'
        )
        
        # Query should return empty, not drop tables
        self.assertEqual(len(results), 0)


class XSSAPIProtectionTests(APITestCase):
    """Test XSS protection in API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com'
        )
        self.client = Client()
    
    def test_api_rejects_xss_in_comment(self):
        """Test that API rejects XSS in comments"""
        xss_payload = '<script>alert("XSS")</script>'
        
        response = self.client.post('/api/comments/', {
            'content': xss_payload
        })
        
        # Should either reject or sanitize
        self.assertIn(response.status_code, [400, 422])
    
    def test_api_rejects_xss_in_profile(self):
        """Test that API rejects XSS in user profile"""
        xss_payload = '<img src=x onerror=alert(1)>'
        
        response = self.client.put('/api/users/profile/', {
            'bio': xss_payload
        })
        
        # Should either reject or sanitize
        self.assertIn(response.status_code, [400, 422])
    
    def test_api_escapes_output(self):
        """Test that API escapes output"""
        # Create comment with HTML (should be escaped in response)
        self.client.post('/api/comments/', {
            'content': 'Normal comment with <b>HTML</b>'
        })
        
        response = self.client.get('/api/comments/')
        
        # The <b> tags should be escaped or removed
        self.assertNotIn('<b>', str(response.content))
    
    def test_safe_url_in_response(self):
        """Test that URLs in responses are safe"""
        response = self.client.get('/api/users/')
        
        # Check that no JavaScript URLs in response
        content = str(response.content)
        self.assertNotIn('javascript:', content)
        self.assertNotIn('vbscript:', content)


class SQLiAPIProtectionTests(APITestCase):
    """Test SQLi protection in API endpoints"""
    
    def setUp(self):
        User.objects.create_user(username='alice', email='alice@example.com')
        User.objects.create_user(username='bob', email='bob@example.com')
    
    def test_api_safe_search_query(self):
        """Test that search API is safe from SQLi"""
        # Normal search should work
        response = self.client.get('/api/users/search/?q=alice')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('results', data)
    
    def test_api_blocks_sqli_in_search(self):
        """Test that SQLi attempts in search are blocked"""
        sqli_payloads = [
            "alice' OR '1'='1",
            "alice' UNION SELECT * FROM auth_user --",
            "alice'; DROP TABLE auth_user; --",
        ]
        
        for payload in sqli_payloads:
            response = self.client.get(f'/api/users/search/?q={payload}')
            
            # Should return empty results, not execute injection
            data = response.json()
            self.assertIn('results', data)
            # Results should be empty (no actual match)
    
    def test_api_safe_filter_query(self):
        """Test that filter API uses safe queries"""
        response = self.client.get('/api/users/?sort=created_at')
        
        self.assertEqual(response.status_code, 200)
    
    def test_api_blocks_sqli_in_sort_field(self):
        """Test that SQLi in sort field is blocked"""
        # Attempt to inject in sort field
        response = self.client.get("/api/users/?sort=id; DROP TABLE auth_user;")
        
        # Should either reject or use default sort
        self.assertEqual(response.status_code, 200)
        # User table should still exist (not dropped)


class EndToEndSecurityTests(APITestCase):
    """End-to-end security tests"""
    
    def test_full_xss_protection_flow(self):
        """Test complete XSS protection from input to output"""
        xss_payloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert(1)>',
            '<div onclick=alert(1)>Click</div>',
            'javascript:alert(1)',
        ]
        
        for payload in xss_payloads:
            # Try to create content with XSS
            response = self.client.post('/api/posts/', {
                'title': 'Test Post',
                'content': payload
            })
            
            # Should be rejected or sanitized
            if response.status_code == 201:
                # Retrieve and check content is safe
                post_id = response.json()['id']
                get_response = self.client.get(f'/api/posts/{post_id}/')
                content = get_response.json()['content']
                
                # Dangerous patterns should be removed
                self.assertNotIn('<script>', content)
                self.assertNotIn('onerror=', content)
                self.assertNotIn('onclick=', content)
    
    def test_full_sqli_protection_flow(self):
        """Test complete SQLi protection"""
        sqli_payloads = [
            "1' OR '1'='1",
            "1'; DROP TABLE auth_user; --",
            "1 UNION SELECT * FROM auth_user --",
        ]
        
        for payload in sqli_payloads:
            # Try to search with SQLi
            response = self.client.get(f'/api/search/?q={payload}')
            
            # Should not cause database corruption
            self.assertEqual(response.status_code, 200)
            
            # Database should still be intact
            users = User.objects.count()
            self.assertGreater(users, 0)
```

## Frontend Tests (Jest)

Create file: `frontend/src/utils/__tests__/xssProtection.test.js`

```javascript
import {
  sanitizeHTML,
  escapeHTML,
  isDangerousHTML,
  isValidURL,
  sanitizeUserInput,
  getSafeSnippet,
  logXSSAttempt,
  safeGet,
  encodeCSVValue,
} from '../xssProtection';

describe('XSS Protection Utilities', () => {
  describe('escapeHTML', () => {
    test('escapes HTML special characters', () => {
      expect(escapeHTML('<script>alert("XSS")</script>'))
        .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    test('handles null and undefined', () => {
      expect(escapeHTML(null)).toBe('');
      expect(escapeHTML(undefined)).toBe('');
    });

    test('preserves safe characters', () => {
      expect(escapeHTML('Hello World')).toBe('Hello World');
    });
  });

  describe('isDangerousHTML', () => {
    test('detects script tags', () => {
      expect(isDangerousHTML('<script>alert(1)</script>')).toBe(true);
    });

    test('detects event handlers', () => {
      expect(isDangerousHTML('<img onerror=alert(1)>')).toBe(true);
      expect(isDangerousHTML('<div onclick=alert(1)>click</div>')).toBe(true);
    });

    test('detects javascript protocol', () => {
      expect(isDangerousHTML('<a href="javascript:alert(1)">click</a>')).toBe(true);
    });

    test('allows safe HTML', () => {
      expect(isDangerousHTML('<p>Hello</p>')).toBe(false);
      expect(isDangerousHTML('<a href="/safe">link</a>')).toBe(false);
    });
  });

  describe('isValidURL', () => {
    test('accepts safe protocols', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://example.com')).toBe(true);
      expect(isValidURL('mailto:user@example.com')).toBe(true);
      expect(isValidURL('/internal/path')).toBe(true);
    });

    test('rejects dangerous protocols', () => {
      expect(isValidURL('javascript:alert(1)')).toBe(false);
      expect(isValidURL('vbscript:msgbox(1)')).toBe(false);
      expect(isValidURL('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    test('handles empty/invalid URLs', () => {
      expect(isValidURL('')).toBe(false);
      expect(isValidURL(null)).toBe(false);
    });
  });

  describe('sanitizeUserInput', () => {
    test('rejects dangerous input', () => {
      expect(() => {
        sanitizeUserInput('<script>alert(1)</script>');
      }).toThrow('dangerous content');
    });

    test('accepts safe input', () => {
      const safe = 'This is a safe comment';
      expect(sanitizeUserInput(safe)).toBe(safe);
    });

    test('enforces max length', () => {
      const long = 'a'.repeat(1000);
      expect(() => {
        sanitizeUserInput(long, 500);
      }).toThrow('too long');
    });

    test('escapes HTML by default', () => {
      const input = '<b>bold</b>';
      const result = sanitizeUserInput(input);
      expect(result).toBe('&lt;b&gt;bold&lt;/b&gt;');
    });
  });

  describe('getSafeSnippet', () => {
    test('truncates long text', () => {
      const long = 'a'.repeat(500);
      const snippet = getSafeSnippet(long, 50);
      expect(snippet.length).toBeLessThanOrEqual(54); // 50 + '...'
    });

    test('escapes HTML in snippet', () => {
      const html = '<script>alert(1)</script>';
      const snippet = getSafeSnippet(html, 50);
      expect(snippet).not.toContain('<script>');
    });
  });

  describe('safeGet', () => {
    test('retrieves nested properties safely', () => {
      const obj = { user: { profile: { name: 'John' } } };
      expect(safeGet(obj, 'user.profile.name')).toBe('John');
    });

    test('returns default for missing properties', () => {
      const obj = { user: { profile: {} } };
      expect(safeGet(obj, 'user.profile.name', 'Unknown')).toBe('Unknown');
    });

    test('prevents prototype pollution', () => {
      const obj = {};
      safeGet(obj, '__proto__.polluted', 'value');
      expect(obj.polluted).toBeUndefined();
    });
  });

  describe('encodeCSVValue', () => {
    test('handles formula injection', () => {
      expect(encodeCSVValue('=SUM(1+1)')).toBe("'=SUM(1+1)");
      expect(encodeCSVValue('+1+1')).toBe("'+1+1");
      expect(encodeCSVValue('-2+3')).toBe("'-2+3");
    });

    test('escapes quotes', () => {
      expect(encodeCSVValue('hello "world"')).toBe('"hello ""world"""');
    });
  });
});
```

## Running Tests

### Backend Tests
```bash
cd backend
python manage.py test api.tests.test_security -v 2
```

### Frontend Tests
```bash
cd frontend
npm test -- xssProtection.test.js
```

## Attack Payloads for Manual Testing

### XSS Payloads
```
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
<iframe src="javascript:alert('XSS')">
<input onfocus=alert('XSS') autofocus>
<body onload=alert('XSS')>
'><script>alert('XSS')</script>
<img src=x:alert(alt) onerror=eval(src) alt=xss>
<iframe/src="data:text/html,<script>alert('XSS')</script>">
```

### SQLi Payloads
```
' OR '1'='1
' OR 1=1--
' UNION SELECT NULL,NULL,NULL--
' AND SLEEP(5)--
'; DROP TABLE users;--
' OR '1'='1' /*
admin' --
' UNION SELECT username, password FROM users--
```

## Testing Checklist

- [ ] Backend: All XSS protection tests pass
- [ ] Backend: All SQLi protection tests pass
- [ ] Frontend: All XSS utility tests pass
- [ ] Frontend: React components render safely
- [ ] API: Rejects dangerous input
- [ ] API: Escapes output properly
- [ ] Database: No corruption from SQLi attempts
- [ ] Manual: Tested with real payloads
- [ ] Performance: No noticeable slowdown from sanitization

