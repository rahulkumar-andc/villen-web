# SQLi & XSS Protection Quick Reference

## One-Page Cheat Sheet for Developers

### SQLi Protection (SQL Injection)

**✅ SAFE PATTERNS**
```python
# Django ORM (always safe)
User.objects.filter(id=user_id)
User.objects.filter(name__icontains=search_term)

# Parameterized raw SQL
User.objects.raw("SELECT * FROM users WHERE id = %s", [user_id])

# Validated identifiers
from .security_utils import SQLiProtection
field = SQLiProtection.validate_identifier(user_input, allowed=['name', 'email'])
User.objects.order_by(field)
```

**❌ DANGEROUS PATTERNS**
```python
# String concatenation - NEVER DO THIS!
User.objects.raw(f"SELECT * FROM users WHERE id={user_id}")

# String formatting - NEVER DO THIS!
query = "SELECT * FROM users WHERE id='%s'" % user_id

# Dynamic field names without validation - NEVER DO THIS!
User.objects.order_by(user_input)  # user_input could be "id); DROP TABLE users; --"
```

---

### XSS Protection (Cross-Site Scripting)

**✅ SAFE PATTERNS**
```jsx
// Text content (auto-escaped)
<div>{userInput}</div>

// Safe components
<SafeText text={userInput} />
<SafeHTML content={userInput} />
<SafeLink href={userInput} text="Click" />

// Backend template (auto-escaped)
{{ user.comment }}
```

**❌ DANGEROUS PATTERNS**
```jsx
// Unescaped HTML - NEVER DO THIS!
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// Direct code execution - NEVER DO THIS!
eval(userInput)
new Function(userInput)

// Django template without escape - NEVER DO THIS!
{% autoescape off %}
{{ untrusted_html }}
{% endautoescape %}
```

---

## Quick Integration

### 1. Backend Setup
```python
from django.core.exceptions import ValidationError
from .security_utils import XSSProtection, SQLiProtection

# In your view
try:
    comment = XSSProtection.sanitize_user_input(request.POST['comment'])
    user_id = SQLiProtection.validate_integer(request.GET['user_id'])
except ValidationError as e:
    return Response({'error': str(e)}, status=400)
```

### 2. Frontend Setup
```jsx
import { SafeText, SafeHTML } from './components/SafeComponents';
import { sanitizeUserInput } from './utils/xssProtection';

// In your component
<SafeText text={userName} />
<SafeHTML content={userBio} />

// In your form
try {
  const safe = sanitizeUserInput(formInput);
  // send to API
} catch (error) {
  setError(error.message);
}
```

---

## Common Scenarios

### Scenario 1: Display User Comment
```python
# Backend
comment = XSSProtection.escape_html(user_comment)
return Response({'comment': comment})
```
```jsx
// Frontend
<SafeText text={comment} tag="p" />
```

### Scenario 2: Search Users
```python
# Backend
search = XSSProtection.sanitize_user_input(request.GET['q'])
users = User.objects.filter(name__icontains=search)
```
```jsx
// Frontend
const [search, setSearch] = useState('');

const handleSearch = () => {
  try {
    const safe = sanitizeUserInput(search);
    // call API with safe value
  } catch (error) {
    setError(error.message);
  }
}
```

### Scenario 3: Sort Users
```python
# Backend
sort_field = request.GET.get('sort', 'name')
allowed_fields = ['name', 'created_at', 'email']

try:
    sort_field = SQLiProtection.validate_identifier(
        sort_field, 
        allowed=allowed_fields
    )
except ValidationError:
    sort_field = 'name'

users = User.objects.all().order_by(sort_field)
```

### Scenario 4: User Bio with HTML
```python
# Backend
bio = XSSProtection.sanitize_html(request.POST['bio'])
```
```jsx
// Frontend
<SafeHTML content={bio} config={{ ALLOWED_TAGS: ['p', 'b', 'i', 'a'] }} />
```

---

## Testing Your Changes

### Unit Test Example
```python
def test_comment_xss_protection(self):
    xss = '<script>alert("XSS")</script>'
    
    # Should raise ValidationError
    with self.assertRaises(ValidationError):
        XSSProtection.sanitize_user_input(xss)
```

### Integration Test Example
```python
def test_api_post_comment(self):
    response = self.client.post('/api/comments/', {
        'content': '<script>alert("XSS")</script>'
    })
    
    # Should either reject (400) or sanitize
    self.assertIn(response.status_code, [400, 422, 201])
```

---

## Red Flags (Code Review Checklist)

- 🚨 See `f"SELECT ... {variable}"`? → Use ORM or parameterized query
- 🚨 See `string.format()` with SQL? → Use parameterized query
- 🚨 See `.raw()` without `%s`? → Add parameters
- 🚨 See `dangerouslySetInnerHTML` without sanitizing? → Use SafeHTML
- 🚨 See `eval()` with user input? → STOP, find alternative
- 🚨 See `{% autoescape off %}`? → Remove unless absolutely necessary
- 🚨 See `order_by(user_input)`? → Validate with whitelist
- 🚨 See dynamic column names? → Validate with whitelist

---

## When to Use What

| Situation | Solution |
|-----------|----------|
| Display text from user | `<SafeText text={...} />` or `{{ var }}` |
| Display HTML from user | `<SafeHTML content={...} />` with DOMPurify |
| Filter by user input | Django ORM with filter (safe by default) |
| Sort by user input | Validate column name with whitelist |
| Search database | Use ORM `icontains` or parameterized query |
| Display user link | `<SafeLink href={...} text={...} />` |
| User bio with HTML | `<SafeHTML>` or `sanitize_html()` |
| Form validation | `sanitizeUserInput()` frontend + backend |

---

## File Locations

```
backend/
  api/
    security_utils.py          ← XSSProtection, SQLiProtection classes

frontend/
  src/
    utils/
      xssProtection.js         ← sanitizeHTML, escapeHTML, etc
    components/
      SafeComponents.jsx       ← SafeText, SafeHTML, SafeLink, etc
```

---

## Documentation Files

1. **SQLI_PREVENTION_GUIDE.md** - Deep dive into SQL Injection attacks and defenses
2. **XSS_PREVENTION_GUIDE.md** - Deep dive into XSS attacks and defenses
3. **SQLI_XSS_IMPLEMENTATION.md** - Step-by-step integration examples
4. **SECURITY_TEST_EXAMPLES.md** - Test cases and attack payloads
5. **This file** - Quick reference for daily development

---

## Need Help?

1. See an unfamiliar vulnerability? Read the corresponding `*_PREVENTION_GUIDE.md`
2. Want to integrate protection? Check `SQLI_XSS_IMPLEMENTATION.md`
3. Writing tests? See `SECURITY_TEST_EXAMPLES.md`
4. Quick question? Check this file first

---

## Common Questions

**Q: Do I need to use safe components everywhere?**
A: Yes, especially for user-generated content. It's better to be safe.

**Q: Can I use dangerouslySetInnerHTML?**
A: Only if you sanitize with `SafeHTML` first. Never use it with raw user input.

**Q: Should I validate on frontend and backend?**
A: Yes! Frontend for UX, backend for security. Never trust frontend validation.

**Q: What if DOMPurify isn't installed?**
A: It falls back to escaping. But you should install it: `npm install dompurify`

**Q: Can I use eval()?**
A: No. Find an alternative (JSON.parse, template literals, etc).

**Q: What about file uploads?**
A: That's a different vulnerability (not covered here). Use separate file security guidelines.

---

## Remember

- **Never trust user input**
- **Always validate on backend**
- **Always escape on output**
- **Use frameworks' built-in protections**
- **When in doubt, escape or sanitize**
