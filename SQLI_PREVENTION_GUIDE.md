# 🛡️ SQL Injection (SQLi) Prevention Guide

**Version**: 1.0  
**Date**: January 25, 2026  
**Status**: Complete Protection Implementation

---

## 📋 Table of Contents

1. [What is SQL Injection?](#what-is-sql-injection)
2. [SQL Injection Types](#sql-injection-types)
3. [Vulnerability Examples](#vulnerability-examples)
4. [Protection Mechanisms](#protection-mechanisms)
5. [Implementation Guide](#implementation-guide)
6. [Code Audit Checklist](#code-audit-checklist)
7. [Testing for SQLi](#testing-for-sqli)

---

## What is SQL Injection?

**SQL Injection (SQLi)** is a code injection technique where malicious SQL statements are inserted into entry fields, allowing attackers to:
- Read sensitive data from the database
- Modify or delete database records
- Execute administrative operations
- Potentially gain system-level access

### Attack Example

```python
# ❌ VULNERABLE CODE
username = request.POST['username']  # User input: admin' --
password = request.POST['password']

query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
# Resulting query:
# SELECT * FROM users WHERE username='admin' --' AND password='...'
# The -- comments out the password check!
```

---

## SQL Injection Types

### 1. Union-Based SQLi

```python
# ❌ VULNERABLE
user_id = request.GET['id']  # Input: 1 UNION SELECT credit_card FROM payments --
query = f"SELECT name, email FROM users WHERE id={user_id}"

# Resulting query:
# SELECT name, email FROM users WHERE id=1 UNION SELECT credit_card FROM payments --
```

**Attack**: Extract data from other tables using UNION

### 2. Time-Based Blind SQLi

```python
# ❌ VULNERABLE
search = request.GET['search']  # Input: abc' OR SLEEP(5) --
query = f"SELECT * FROM products WHERE name LIKE '%{search}%'"

# Attack waits 5 seconds, indicating successful injection
```

**Attack**: Infer data by observing response timing

### 3. Boolean-Based Blind SQLi

```python
# ❌ VULNERABLE
username = request.GET['user']  # Input: admin' OR '1'='1
query = f"SELECT * FROM users WHERE username='{username}'"

# Returns all users if injection is successful
```

**Attack**: Infer data from true/false responses

### 4. Stacked Queries

```python
# ❌ VULNERABLE (in some databases)
command = request.POST['cmd']  # Input: test'; DROP TABLE users; --
query = f"INSERT INTO logs (action) VALUES ('{command}')"

# Both INSERT and DROP are executed!
```

**Attack**: Execute multiple SQL statements

---

## Vulnerability Examples

### ❌ VULNERABLE PATTERNS

#### Pattern 1: String Concatenation

```python
# ❌ DON'T DO THIS
user_id = request.GET['id']
user = User.objects.raw(f"SELECT * FROM api_user WHERE id = {user_id}")
```

#### Pattern 2: String Formatting

```python
# ❌ DON'T DO THIS
email = request.POST['email']
user = User.objects.raw("SELECT * FROM api_user WHERE email = '%s'" % email)
```

#### Pattern 3: String Concatenation with .raw()

```python
# ❌ DON'T DO THIS
search_term = request.GET['q']
results = Product.objects.raw(
    "SELECT * FROM api_product WHERE title LIKE '%" + search_term + "%'"
)
```

#### Pattern 4: filter() with F expressions (Incorrect)

```python
# ❌ DON'T DO THIS
filter_value = request.GET['status']
items = Item.objects.filter(status=filter_value)  # OK if value is passed correctly
# But unsafe if using raw SQL within F expressions
```

---

## Protection Mechanisms

### ✅ MECHANISM 1: Django ORM (Parameterized Queries)

**Best Practice**: Always use Django's ORM instead of raw SQL

```python
# ✅ SAFE - Using Django ORM
user_id = request.GET['id']
user = User.objects.get(id=user_id)  # Parameterized internally

# ✅ SAFE - Using filter()
users = User.objects.filter(email=email)  # Parameterized internally

# ✅ SAFE - Using exclude()
inactive = User.objects.exclude(is_active=True)  # Parameterized internally

# ✅ SAFE - Using Q objects
from django.db.models import Q
users = User.objects.filter(
    Q(email=email) | Q(username=username)
)  # Parameterized internally
```

**Why it's safe**: Django ORM uses parameterized queries internally, separating SQL code from data.

### ✅ MECHANISM 2: Parameterized Raw Queries

When you must use raw SQL, use parameter placeholders:

```python
# ✅ SAFE - Using %s placeholders
user_id = request.GET['id']
user = User.objects.raw(
    "SELECT * FROM api_user WHERE id = %s",
    [user_id]  # Parameters passed separately
)

# ✅ SAFE - Using dictionary placeholders
email = request.POST['email']
users = User.objects.raw(
    "SELECT * FROM api_user WHERE email = %(email)s",
    {'email': email}  # Parameters passed separately
)
```

**Why it's safe**: Parameters are bound to placeholders AFTER SQL is parsed, preventing injection.

### ✅ MECHANISM 3: Input Validation

Validate and sanitize all inputs before use:

```python
# ✅ SAFE - Validate input type
from django.core.exceptions import ValidationError

def get_user_by_id(user_id):
    try:
        # Ensure it's an integer
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise ValidationError("Invalid user ID")
    
    return User.objects.get(id=user_id)

# ✅ SAFE - Validate input format (email)
from django.core.validators import validate_email

def get_user_by_email(email):
    try:
        validate_email(email)
    except ValidationError:
        raise ValidationError("Invalid email format")
    
    return User.objects.get(email=email)
```

### ✅ MECHANISM 4: Whitelist Validation

For enum values, use whitelist validation:

```python
# ✅ SAFE - Whitelist enum values
ALLOWED_STATUSES = ['active', 'inactive', 'pending']

def filter_by_status(status):
    if status not in ALLOWED_STATUSES:
        raise ValidationError(f"Invalid status: {status}")
    
    return User.objects.filter(status=status)

# Better: Use Django choices
class User(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending', 'Pending'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

# ✅ SAFE - Using choices prevents invalid values
users = User.objects.filter(status='active')  # Validated by model
```

### ✅ MECHANISM 5: Escape Special Characters

For LIKE queries, escape wildcards:

```python
# ✅ SAFE - Escape LIKE wildcards
from django.db.models import F
from django.db.models.functions import Replace

search_term = request.GET['q']

# Escape special characters
escaped = search_term.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')

results = User.objects.filter(
    username__icontains=escaped
)

# Or use F expressions with Replace function
results = User.objects.annotate(
    safe_search=Replace(
        F('username'),
        Value('%'),
        Value('\\%')
    )
).filter(safe_search__icontains=search_term)
```

---

## Implementation Guide

### Step 1: Code Audit

Scan for vulnerable patterns:

```bash
# Find raw() calls
grep -r "\.raw(" backend/api/ --include="*.py"

# Find format strings with database operations
grep -r "f\".*SELECT\|INSERT\|UPDATE\|DELETE" backend/api/ --include="*.py"

# Find string concatenation with SQL
grep -r "\+ \"SELECT\|+ 'SELECT" backend/api/ --include="*.py"
```

### Step 2: Secure Utilities

Create helper functions for safe database operations:

```python
# backend/api/db_utils.py
from django.db import connection
from django.core.exceptions import ValidationError

def safe_raw_query(sql, params):
    """
    Execute raw SQL safely with parameterized queries.
    
    Args:
        sql (str): SQL query with %s placeholders
        params (list/tuple): Parameters to bind to placeholders
    
    Returns:
        QuerySet: Results from the query
    
    Example:
        users = safe_raw_query(
            "SELECT * FROM api_user WHERE email = %s AND active = %s",
            [email, True]
        )
    """
    if not isinstance(params, (list, tuple)):
        raise ValueError("Parameters must be a list or tuple")
    
    # Use parameterized query
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        columns = [col[0] for col in cursor.description]
        return [
            dict(zip(columns, row))
            for row in cursor.fetchall()
        ]

def validate_filter_field(field_name, allowed_fields):
    """
    Validate that a filter field is in the whitelist.
    
    Args:
        field_name (str): Field to filter by
        allowed_fields (list): List of allowed field names
    
    Returns:
        str: Validated field name
    
    Raises:
        ValidationError: If field is not allowed
    
    Example:
        field = validate_filter_field('status', ['active', 'inactive'])
    """
    if field_name not in allowed_fields:
        raise ValidationError(f"Invalid field: {field_name}")
    return field_name

def build_safe_filter(model, **kwargs):
    """
    Build ORM filter safely with validation.
    
    Args:
        model: Django model class
        **kwargs: Filter arguments (all safe via ORM)
    
    Returns:
        QuerySet: Filtered results
    """
    # Django ORM handles parameterization
    return model.objects.filter(**kwargs)
```

### Step 3: Use in Views

```python
# backend/api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from .db_utils import safe_raw_query, validate_filter_field, build_safe_filter
from .models import User

class SafeUserView(APIView):
    """
    ✅ SAFE - Demonstrates secure database operations
    """
    
    def get(self, request):
        """Retrieve user by ID (safe parameterized query)"""
        user_id = request.query_params.get('id')
        
        try:
            # Validate input
            user_id = int(user_id)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid user ID'}, status=400)
        
        # ✅ SAFE - Using Django ORM
        try:
            user = User.objects.get(id=user_id)
            return Response({'id': user.id, 'email': user.email})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
    
    def post(self, request):
        """Create user (safe via ORM)"""
        email = request.data.get('email', '').strip()
        
        if not email:
            return Response({'error': 'Email required'}, status=400)
        
        # ✅ SAFE - Using Django ORM with validation
        try:
            from django.core.validators import validate_email
            validate_email(email)
            
            user = User.objects.create(email=email)
            return Response({'id': user.id, 'email': user.email})
        except ValidationError as e:
            return Response({'error': str(e)}, status=400)

class SafeSearchView(APIView):
    """
    ✅ SAFE - Search without SQL injection
    """
    
    def get(self, request):
        """Search users by username"""
        query = request.query_params.get('q', '').strip()
        
        if not query or len(query) < 2:
            return Response({'error': 'Query too short'}, status=400)
        
        # ✅ SAFE - Using Django ORM with icontains
        users = User.objects.filter(
            username__icontains=query
        ).values('id', 'username')[:10]
        
        return Response(list(users))

class SafeFilterView(APIView):
    """
    ✅ SAFE - Filter with whitelist validation
    """
    
    ALLOWED_FILTERS = ['status', 'role', 'is_active']
    
    def get(self, request):
        """Filter users by field"""
        filter_field = request.query_params.get('field')
        filter_value = request.query_params.get('value')
        
        if not filter_field or not filter_value:
            return Response({'error': 'Field and value required'}, status=400)
        
        try:
            # ✅ SAFE - Validate filter field against whitelist
            validate_filter_field(filter_field, self.ALLOWED_FILTERS)
            
            # ✅ SAFE - Build filter dynamically
            filter_kwargs = {filter_field: filter_value}
            users = User.objects.filter(**filter_kwargs).values()
            
            return Response(list(users))
        except ValidationError as e:
            return Response({'error': str(e)}, status=400)
```

---

## Code Audit Checklist

Review all database operations with this checklist:

### Backend Audit

- [ ] ✅ All User lookups use `User.objects.get()` or `filter()`
- [ ] ✅ No string concatenation in SQL queries
- [ ] ✅ No f-strings in SQL queries
- [ ] ✅ All `.raw()` calls use parameterized placeholders (`%s`)
- [ ] ✅ All search inputs validated before LIKE queries
- [ ] ✅ Enum/choice fields use model choices, not free text
- [ ] ✅ ID fields validated as integers
- [ ] ✅ Email fields validated with `validate_email()`
- [ ] ✅ All inputs from `request.GET`, `request.POST`, `request.data` are sanitized
- [ ] ✅ No direct SQL construction in admin custom actions
- [ ] ✅ No database operations in template logic
- [ ] ✅ All ORM queries use `filter()` not raw SQL

### Check Files

```bash
# backend/api/views.py
grep -n "\.raw(" backend/api/views.py
grep -n "f\".*SELECT\|f'.*SELECT" backend/api/views.py

# backend/api/models.py
grep -n "\.raw(" backend/api/models.py
grep -n "def.*sql\|def.*query" backend/api/models.py

# backend/api/serializers.py
grep -n "\.raw(" backend/api/serializers.py
```

---

## Testing for SQLi

### Manual Testing

```python
# Test 1: Union-based SQLi
# URL: /api/users/?id=1 UNION SELECT password FROM users --
# Expected: Error or normal response (no data leak)

# Test 2: Boolean-based SQLi
# URL: /api/users/?id=1' OR '1'='1
# Expected: Error or validation failure

# Test 3: Time-based SQLi
# URL: /api/users/?id=1; WAITFOR DELAY '00:00:05' --
# Expected: Immediate response (not delayed)

# Test 4: Escaped quotes
# URL: /api/users/?id=1' OR 1=1 --
# Expected: Error or validation failure
```

### Automated Testing

```python
# backend/api/tests/test_sqli.py
from django.test import TestCase, Client
from django.contrib.auth.models import User

class SQLInjectionTests(TestCase):
    """Test SQL injection protection"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_union_based_sqli(self):
        """Test UNION-based SQL injection"""
        # Attempt: 1 UNION SELECT password FROM users --
        response = self.client.get('/api/users/?id=1 UNION SELECT password FROM users --')
        
        # Should not expose password
        self.assertNotIn('password', response.json().get('data', []))
        self.assertIn(response.status_code, [400, 404, 500])
    
    def test_boolean_based_sqli(self):
        """Test boolean-based SQL injection"""
        # Attempt: 1' OR '1'='1
        response = self.client.get("/api/users/?id=1' OR '1'='1")
        
        # Should handle gracefully
        self.assertIn(response.status_code, [400, 404])
    
    def test_time_based_sqli(self):
        """Test time-based SQL injection"""
        import time
        
        # Attempt: 1; WAITFOR DELAY '00:00:05' --
        start_time = time.time()
        response = self.client.get("/api/users/?id=1; WAITFOR DELAY '00:00:05' --")
        elapsed = time.time() - start_time
        
        # Should respond quickly (not wait 5 seconds)
        self.assertLess(elapsed, 2)
    
    def test_safe_parameterized_query(self):
        """Test that parameterized queries work correctly"""
        response = self.client.get(f'/api/users/?id={self.user.id}')
        
        # Should return valid user
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['username'], 'testuser')
```

---

## Best Practices Summary

### ✅ DO

```python
# Use Django ORM
user = User.objects.get(id=user_id)

# Use parameterized queries
User.objects.raw("SELECT * FROM api_user WHERE id = %s", [user_id])

# Validate input types
user_id = int(request.GET['id'])

# Use whitelists for enum values
if status not in ['active', 'inactive']:
    raise ValidationError("Invalid status")

# Use Django validators
from django.core.validators import validate_email
validate_email(email)
```

### ❌ DON'T

```python
# String concatenation
user_id = request.GET['id']
user = User.objects.raw(f"SELECT * FROM api_user WHERE id = {user_id}")

# String formatting
user = User.objects.raw("SELECT * FROM api_user WHERE id = '%s'" % user_id)

# No validation
user = User.objects.raw("SELECT * FROM api_user WHERE email = ?", [email])

# Trust user input
filter_field = request.GET['field']
User.objects.filter(**{filter_field: value})
```

---

## Summary

| Method | Safety | Example |
|--------|--------|---------|
| Django ORM | ✅ Excellent | `User.objects.get(id=user_id)` |
| Parameterized Raw | ✅ Excellent | `raw("... WHERE id = %s", [user_id])` |
| Input Validation | ✅ Excellent | `user_id = int(user_id)` |
| Whitelist Validation | ✅ Excellent | `if status in ALLOWED_VALUES` |
| String Concatenation | ❌ Dangerous | `f"... WHERE id = {user_id}"` |
| String Formatting | ❌ Dangerous | `"... id = %s" % user_id` |
| No Validation | ❌ Dangerous | `User.objects.filter(**user_input)` |

---

**Status**: ✅ **FULLY PROTECTED**

Your application is protected from SQL Injection when:
1. Using Django ORM exclusively
2. Using parameterized raw queries (if needed)
3. Validating all inputs
4. Using whitelists for enum values

---

**Last Updated**: January 25, 2026  
**Version**: 1.0
