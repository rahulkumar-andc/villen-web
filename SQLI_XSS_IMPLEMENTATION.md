# SQLi & XSS Implementation Guide

This guide shows how to integrate SQLi and XSS protection into the Villen project.

## Quick Reference

### SQLi Protection
```python
# ✅ SAFE - Use Django ORM
User.objects.filter(id=user_id)

# ✅ SAFE - Use parameterized queries
from .security_utils import SQLiProtection
SQLiProtection.safe_raw_query(
    "SELECT * FROM users WHERE id = %s", 
    [user_id]
)

# ❌ DANGEROUS - String concatenation
User.objects.raw(f"SELECT * FROM users WHERE id={user_id}")
```

### XSS Protection
```jsx
// ✅ SAFE - Text content (auto-escaped in React)
<div>{userInput}</div>

// ✅ SAFE - HTML content with sanitization
import { SafeHTML } from './components/SafeComponents';
<SafeHTML content={userInput} />

// ❌ DANGEROUS - Unsanitized HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

## Backend Implementation

### 1. Import Security Utilities

```python
# In your view file
from .security_utils import XSSProtection, SQLiProtection

# In models or serializers
from django.core.exceptions import ValidationError
```

### 2. Validate User Input

```python
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from .security_utils import XSSProtection, SQLiProtection

class UserViewSet(viewsets.ModelViewSet):
    """User API with SQLi/XSS protection"""
    
    def create(self, request, *args, **kwargs):
        """Create user with input validation"""
        
        # Get data
        name = request.data.get('name', '')
        email = request.data.get('email', '')
        
        # Validate and sanitize input
        try:
            # Validate name
            name = XSSProtection.sanitize_user_input(
                name, 
                max_length=100,
                allow_newlines=False
            )
            
            # Validate email format
            from django.core.validators import validate_email
            validate_email(email)
            
        except ValidationError as e:
            return Response(
                {'error': str(e)}, 
                status=400
            )
        
        # Now create user safely
        user = User.objects.create(
            name=name,
            email=email
        )
        
        return Response({'id': user.id})
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search users safely"""
        
        query = request.query_params.get('q', '')
        
        try:
            # Validate search input
            query = XSSProtection.sanitize_user_input(
                query, 
                max_length=100
            )
        except ValidationError:
            return Response({'results': []})
        
        # Use safe Django ORM search
        users = User.objects.filter(
            name__icontains=query
        )[:10]
        
        return Response({
            'results': [
                {'id': u.id, 'name': u.name} 
                for u in users
            ]
        })
```

### 3. Safe Database Operations

```python
from .security_utils import SQLiProtection

class ReportViewSet(viewsets.ViewSet):
    """Report generation with safe queries"""
    
    def list(self, request):
        """List reports with safe filtering"""
        
        # Validate sort field
        sort_by = request.query_params.get('sort_by', 'created_at')
        
        allowed_fields = ['created_at', 'name', 'status']
        
        try:
            sort_by = SQLiProtection.validate_identifier(
                sort_by, 
                allowed=allowed_fields
            )
        except ValidationError:
            sort_by = 'created_at'
        
        # Build safe query
        reports = Report.objects.all().order_by(sort_by)
        
        return Response({
            'results': ReportSerializer(reports, many=True).data
        })
    
    def custom_report(self, request):
        """Custom report with parameterized query"""
        
        # Get user input
        date_from = request.query_params.get('from')
        date_to = request.query_params.get('to')
        
        try:
            # Validate dates
            from datetime import datetime
            datetime.fromisoformat(date_from)
            datetime.fromisoformat(date_to)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid date format'}, 
                status=400
            )
        
        # Execute safe parameterized query
        results = SQLiProtection.safe_raw_query(
            """
            SELECT id, name, created_at 
            FROM reports 
            WHERE created_at BETWEEN %s AND %s
            ORDER BY created_at DESC
            """,
            [date_from, date_to],
            description="Report date range query"
        )
        
        return Response({'results': results})
```

### 4. Protect Django Templates

```django
{% comment %}
✅ SAFE - Django auto-escapes by default
{% endcomment %}
<h1>{{ user.name }}</h1>
<p>{{ post.content }}</p>

{% comment %}
❌ DANGEROUS - Disable auto-escape
{% endcomment %}
{% autoescape off %}
{{ untrusted_html }}
{% endautoescape %}

{% comment %}
✅ SAFE - Use built-in filters
{% endcomment %}
{{ post.content|escape }}
{{ post.url|urlize }}
{{ post.html|striptags }}
```

## Frontend Implementation

### 1. Setup (in main.jsx or App.jsx)

```jsx
// Install DOMPurify
// npm install dompurify

// In your main app setup
import DOMPurify from 'dompurify';

// Make it globally available for xssProtection utilities
window.DOMPurify = DOMPurify;
```

### 2. Use Safe Components

```jsx
import React, { useState } from 'react';
import { 
  SafeText, 
  SafeHTML, 
  SafeLink,
  SafeUserContent 
} from './components/SafeComponents';

function UserProfile({ user, bio }) {
  return (
    <div>
      {/* ✅ SAFE - Always escaped */}
      <SafeText text={user.name} tag="h1" />
      
      {/* ✅ SAFE - Sanitized HTML */}
      <SafeHTML content={bio} />
      
      {/* ✅ SAFE - Validated link */}
      <SafeLink 
        href={user.website} 
        text="Visit website"
        title={`Visit ${user.name}'s website`}
      />
      
      {/* ✅ SAFE - User-generated content */}
      <SafeUserContent content={user.bio} allowHTML={true} />
    </div>
  );
}
```

### 3. Form Input Validation

```jsx
import React, { useState } from 'react';
import { sanitizeUserInput, isDangerousHTML } from './utils/xssProtection';

function CommentForm() {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate input
      const sanitized = sanitizeUserInput(comment, 500);
      
      // Check for dangerous content
      if (isDangerousHTML(sanitized)) {
        setError('Comment contains invalid content');
        return;
      }
      
      // Send to API
      const response = await fetch('/api/comments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: sanitized 
        }),
      });
      
      if (response.ok) {
        setComment('');
        setError('');
        // Refresh comments
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        placeholder="Write a comment (max 500 characters)"
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Post Comment</button>
    </form>
  );
}
```

### 4. API Integration

```jsx
import { sanitizeUserInput } from './utils/xssProtection';

// Create API interceptor to sanitize responses
export const sanitizeAPIResponse = (data) => {
  if (typeof data !== 'object') return data;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      try {
        sanitized[key] = sanitizeUserInput(value);
      } catch {
        sanitized[key] = value; // Use original if sanitization fails
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};
```

## Security Checklist

### Backend Checklist
- [ ] All user input validated with `XSSProtection.sanitize_user_input()`
- [ ] All database queries use Django ORM (no string concatenation)
- [ ] Raw SQL uses parameterized queries: `%s` placeholders
- [ ] Column names validated with `SQLiProtection.validate_identifier()`
- [ ] Email fields validated with `validate_email()`
- [ ] Integer IDs validated with `SQLiProtection.validate_integer()`
- [ ] Template auto-escape enabled (don't use `{% autoescape off %}`)
- [ ] HTML output escaped with `escape()` or Django filters
- [ ] Error messages don't leak system information
- [ ] Sensitive operations logged with `logger.warning()`

### Frontend Checklist
- [ ] All user text displayed with SafeText or `{text}` in JSX
- [ ] User HTML sanitized with SafeHTML or `sanitizeHTML()`
- [ ] Links validated with SafeLink or `isValidURL()`
- [ ] Images validated with SafeImage
- [ ] Form input validated with `sanitizeUserInput()`
- [ ] API responses checked with `isDangerousHTML()`
- [ ] No `dangerouslySetInnerHTML` with unsanitized content
- [ ] No `eval()` or `new Function()` with user input
- [ ] No `innerHTML`, `outerHTML` with user input
- [ ] CSP headers configured in backend

## Testing Examples

### Backend Test
```python
from django.test import TestCase
from .security_utils import XSSProtection, SQLiProtection

class SecurityTestCase(TestCase):
    
    def test_xss_input_validation(self):
        """Test XSS protection"""
        dangerous = '<script>alert("XSS")</script>'
        
        with self.assertRaises(ValidationError):
            XSSProtection.sanitize_user_input(dangerous)
    
    def test_sqli_parameterized_query(self):
        """Test SQLi protection"""
        # This should work (safe)
        results = SQLiProtection.safe_raw_query(
            "SELECT * FROM users WHERE id = %s",
            [1]
        )
        self.assertIsInstance(results, list)
    
    def test_url_validation(self):
        """Test URL validation"""
        self.assertTrue(
            XSSProtection.is_safe_url('https://example.com')
        )
        self.assertFalse(
            XSSProtection.is_safe_url('javascript:alert("XSS")')
        )
```

### Frontend Test (Jest)
```javascript
import { 
  sanitizeHTML, 
  isDangerousHTML, 
  sanitizeUserInput 
} from '../utils/xssProtection';

describe('XSS Protection', () => {
  test('sanitizes script tags', () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('<script>');
  });
  
  test('detects dangerous HTML', () => {
    expect(isDangerousHTML('<img src=x onerror=alert(1)>')).toBe(true);
    expect(isDangerousHTML('<p>Hello</p>')).toBe(false);
  });
  
  test('validates user input', () => {
    expect(() => {
      sanitizeUserInput('<script>alert("XSS")</script>');
    }).toThrow();
  });
});
```

## Integration Steps

1. **Backend**:
   - Copy `security_utils.py` to `backend/api/`
   - Import in views: `from .security_utils import XSSProtection, SQLiProtection`
   - Use in form validation and database operations
   - Add tests

2. **Frontend**:
   - Copy `xssProtection.js` to `frontend/src/utils/`
   - Copy `SafeComponents.jsx` to `frontend/src/components/`
   - Install DOMPurify: `npm install dompurify`
   - Replace dangerous patterns with safe components
   - Add tests

3. **Testing**:
   - Run backend tests: `python manage.py test`
   - Run frontend tests: `npm test`
   - Manual testing with provided payloads

4. **Deployment**:
   - Enable CSP headers
   - Review security checklist
   - Run code audit
   - Monitor logs for attacks

## Common Mistakes to Avoid

❌ **Bad**: String concatenation in SQL
```python
query = f"SELECT * FROM users WHERE id={user_id}"
```

✅ **Good**: Parameterized query
```python
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, [user_id])
```

---

❌ **Bad**: Unescaped HTML in React
```jsx
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

✅ **Good**: Use safe components
```jsx
<SafeHTML content={userInput} />
```

---

❌ **Bad**: No input validation
```python
def create_post(request):
    Post.objects.create(content=request.POST['content'])
```

✅ **Good**: Validate input
```python
def create_post(request):
    content = XSSProtection.sanitize_user_input(
        request.POST['content']
    )
    Post.objects.create(content=content)
```

## Resources

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Django Security](https://docs.djangoproject.com/en/stable/topics/security/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
