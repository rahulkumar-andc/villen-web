# File Upload Security Guide

**OWASP Top 10 (2021)**: A04:2021 – Insecure Design (File Upload)  
**Severity**: 🔴 Critical  
**Exploitability**: High  
**Impact**: Critical (full server compromise)

---

## Table of Contents
1. [What is File Upload Vulnerability?](#what-is-file-upload-vulnerability)
2. [Attack Types](#attack-types)
3. [Vulnerable Code Examples](#vulnerable-code-examples)
4. [Protection Mechanisms](#protection-mechanisms)
5. [Implementation Guide](#implementation-guide)
6. [Code Audit Checklist](#code-audit-checklist)
7. [Testing Procedures](#testing-procedures)

---

## What is File Upload Vulnerability?

### Definition
**File Upload Vulnerability** occurs when an application improperly handles file uploads, allowing attackers to:
- Upload and execute malicious files
- Overwrite existing files
- Perform Denial of Service (DoS)
- Access sensitive files
- Achieve Remote Code Execution (RCE)

### Real-World Example: Profile Picture Attack

```
User tries to upload profile picture: profile.jpg
Attacker uploads instead: shell.php

1. Attacker crafts malicious PHP file
   └─ <? system($_GET['cmd']); ?>

2. Attacker uploads as "profile.jpg"
   └─ Validation only checks filename, not content

3. File stored in web root: /uploads/profile.jpg

4. Attacker accesses: /uploads/profile.jpg?cmd=whoami
   └─ Server executes PHP code!

5. Attacker now has shell access:
   └─ Can execute any command
   └─ Can read/modify files
   └─ Can install backdoors
   └─ Complete server compromise!
```

### Common Impacts
- 🔓 Remote Code Execution (RCE)
- 💻 Server compromise
- 🗂️ File overwrite/deletion
- 🔐 Credential theft
- 🌐 Website defacement
- 🚫 Denial of Service (DoS)
- 📊 Database access
- 🔄 Lateral movement (internal network)

---

## Attack Types

### 1. Executable File Upload (PHP/JSP/ASP)

**Attack Vector**:
```
Attacker crafts: shell.php
<?php
  system($_GET['cmd']);  // Execute system commands
?>

User uploads "profile.jpg" but it's actually shell.php
Attacker accesses: /uploads/profile.jpg?cmd=whoami
Server executes PHP code, attacker gains shell
```

**Vulnerable Code**:
```python
def upload_profile_picture(request):
    file = request.FILES['profile_pic']
    
    # ❌ Only checks filename extension!
    if file.name.endswith('.jpg'):
        # Save directly to web-accessible directory
        with open(f'/app/media/{file.name}', 'wb') as f:
            f.write(file.read())
        
        return JsonResponse({'status': 'uploaded'})
    
    return JsonResponse({'error': 'Only JPG allowed'}, status=400)
```

**Attack**:
```
1. Attacker renames shell.php to profile.jpg
2. File contains PHP code
3. Uploaded successfully (filename check passes)
4. Accessed as: /media/profile.jpg?cmd=id
5. PHP code executes with web server privileges
6. Remote command execution!
```

---

### 2. Double Extension Attack

**Attack Vector**:
```
.php.jpg - Server sees .jpg, processes as .php
.php5.jpg - Bypass .php filter
.phtml, .php3, .php4, .php5, .shtml
```

**Vulnerable Code**:
```python
def upload_file(request):
    file = request.FILES['file']
    
    # ❌ Only checks if ends with .jpg
    if file.name.endswith('.jpg'):
        with open(f'/uploads/{file.name}', 'wb') as f:
            f.write(file.read())
```

**Attack**:
```
Attacker uploads: profile.php.jpg
- Filename ends with .jpg (passes check)
- But if .htaccess is misconfigured:
  AddType application/x-httpd-php .php
  - Server may execute .php even with .jpg extension!
```

---

### 3. MIME Type Spoofing

**Attack Vector**:
```
File headers determine actual type, not extension
Attacker can change headers to fake file type
```

**Vulnerable Code**:
```python
def upload_file(request):
    file = request.FILES['file']
    
    # ❌ Only checks MIME type from filename
    if file.content_type == 'image/jpeg':
        with open(f'/uploads/{file.name}', 'wb') as f:
            f.write(file.read())
```

**Attack**:
```
Browser headers: Content-Type: image/jpeg
But file content is: <?php system($_GET['cmd']); ?>
Server accepts it (MIME type check passes)
Attacker accesses file and PHP executes
```

---

### 4. Path Traversal in Filename

**Attack Vector**:
```
Filename: ../../../../etc/passwd
Or: ../../shell.php
```

**Vulnerable Code**:
```python
def upload_file(request):
    file = request.FILES['file']
    filename = file.name  # ❌ User-controlled!
    
    # ❌ No path sanitization
    with open(f'/uploads/{filename}', 'wb') as f:
        f.write(file.read())
```

**Attack**:
```
Filename: ../../app.py
Upload directory: /app/uploads/
Actual path: /app/uploads/../../app.py = /app/app.py
Overwrites production code!
```

---

### 5. Zip Slip

**Attack Vector**:
```
Attacker creates ZIP with path traversal:
  ../../shell.php
  
When extracted: overwrites files outside directory
```

**Vulnerable Code**:
```python
import zipfile

def upload_archive(request):
    zip_file = request.FILES['archive']
    
    # ❌ No path validation in archive
    with zipfile.ZipFile(zip_file) as z:
        z.extractall('/uploads/')  # Extracts to arbitrary paths!
```

**Attack**:
```
ZIP contains: ../../shell.php
Extraction path: /uploads/../../shell.php = /app/shell.php
PHP code written outside upload directory
```

---

### 6. Denial of Service (DoS)

**Attack Vector 1: Large File**
```
Attacker uploads 10GB file
Server disk fills up
Application crashes
```

**Attack Vector 2: Zip Bomb**
```
50MB ZIP expands to 500GB when extracted
Kills server resources
```

---

### 7. XXE (XML External Entity) via File Upload

**Attack Vector**:
```xml
<?xml version="1.0"?>
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<foo>&xxe;</foo>
```

**Vulnerable Code**:
```python
import xml.etree.ElementTree as ET

def upload_xml(request):
    xml_file = request.FILES['data.xml']
    
    # ❌ No XXE protection
    tree = ET.parse(xml_file)
    data = tree.getroot()
```

---

## Vulnerable Code Examples

### ❌ Complete Vulnerable File Upload System

```python
# views.py - VULNERABLE!

import os
from django.http import JsonResponse
from django.conf import settings

def upload_profile_picture(request):
    """Profile picture upload - VERY VULNERABLE"""
    
    if 'profile_pic' not in request.FILES:
        return JsonResponse({'error': 'No file provided'}, status=400)
    
    file = request.FILES['profile_pic']
    
    # ❌ Minimal validation
    if file.size > 5000000:  # 5MB
        return JsonResponse({'error': 'File too large'}, status=400)
    
    # ❌ Only checks extension
    if not file.name.endswith(('.jpg', '.jpeg', '.png')):
        return JsonResponse({'error': 'Only images allowed'}, status=400)
    
    # ❌ No filename sanitization
    # ❌ Saves to web-accessible directory
    # ❌ Preserves original filename
    upload_path = os.path.join(settings.MEDIA_ROOT, file.name)
    
    with open(upload_path, 'wb') as f:
        # ❌ No file type verification
        # ❌ No virus scan
        # ❌ No content validation
        for chunk in file.chunks():
            f.write(chunk)
    
    # ❌ Returns direct URL to uploaded file
    file_url = f'{settings.MEDIA_URL}{file.name}'
    
    return JsonResponse({
        'status': 'uploaded',
        'url': file_url  # Directly accessible!
    })


def upload_archive(request):
    """Archive upload - VULNERABLE TO ZIP SLIP"""
    
    import zipfile
    
    archive = request.FILES['archive']
    
    # ❌ No archive validation
    # ❌ No path sanitization
    with zipfile.ZipFile(archive) as z:
        z.extractall(settings.MEDIA_ROOT)  # Can extract anywhere!
    
    return JsonResponse({'status': 'extracted'})


def upload_document(request):
    """Document upload - VULNERABLE TO XXE"""
    
    import xml.etree.ElementTree as ET
    
    doc = request.FILES['document']
    
    # ❌ No XXE protection
    # ❌ Can read server files via XXE
    tree = ET.parse(doc)
    data = tree.getroot()
    
    return JsonResponse({'data': data})
```

---

## Protection Mechanisms

### 1. ✅ Whitelist File Extensions

**Implementation**:
```python
ALLOWED_EXTENSIONS = {
    'image': {'jpg', 'jpeg', 'png', 'gif', 'webp'},
    'document': {'pdf', 'doc', 'docx', 'txt'},
    'archive': {'zip', 'tar', 'gz'},
}

def is_allowed_extension(filename, file_type='image'):
    """Check if file extension is whitelisted"""
    if '.' not in filename:
        return False
    
    ext = filename.rsplit('.', 1)[1].lower()
    
    # ❌ Bad: endswith check
    # if filename.lower().endswith('.jpg'):
    #   Vulnerable to .php.jpg
    
    # ✅ Good: extract and check extension
    return ext in ALLOWED_EXTENSIONS.get(file_type, set())

def upload_file(request):
    file = request.FILES['file']
    
    # ✅ Check extension
    if not is_allowed_extension(file.name, 'image'):
        return JsonResponse({'error': 'Invalid file type'}, status=400)
    
    # ... rest of validation
```

**Blacklist to Avoid**:
```python
# ❌ BAD - Easy to bypass
BLOCKED_EXTENSIONS = {
    'exe', 'php', 'jsp', 'asp', 'rb', 'cgi', 'pl', 'aspx',
    'bat', 'cmd', 'com', 'msi', 'scr', 'vbs', 'js'
}

# Attackers use:
# .php5, .phtml, .phar, .shtml
# .htaccess, .web.config
# Double extensions: .php.jpg
# Null bytes: .php%00.jpg (older systems)
```

---

### 2. ✅ Validate File Content (Magic Bytes)

**How It Works**:
```
Every file has magic bytes (file signature):
  JPEG: FF D8 FF E0
  PNG:  89 50 4E 47
  GIF:  47 49 46
  PDF:  25 50 44 46
  ZIP:  50 4B 03 04
```

**Implementation**:
```python
import magic  # Install: pip install python-magic

FILE_SIGNATURES = {
    'image/jpeg': [b'\xFF\xD8\xFF'],
    'image/png': [b'\x89PNG\r\n\x1a\n'],
    'image/gif': [b'GIF87a', b'GIF89a'],
    'application/pdf': [b'%PDF'],
    'application/zip': [b'PK\x03\x04'],
}

def validate_file_content(file_obj, expected_type):
    """Validate file matches expected type"""
    file_obj.seek(0)  # Read from beginning
    magic_bytes = file_obj.read(20)  # Read first 20 bytes
    file_obj.seek(0)  # Reset for later read
    
    # Check magic bytes
    allowed_signatures = FILE_SIGNATURES.get(expected_type, [])
    
    for signature in allowed_signatures:
        if magic_bytes.startswith(signature):
            return True
    
    return False

def upload_file(request):
    file = request.FILES['file']
    
    # ✅ Validate extension
    if not is_allowed_extension(file.name, 'image'):
        return JsonResponse({'error': 'Invalid extension'}, status=400)
    
    # ✅ Validate file content
    if not validate_file_content(file, 'image/jpeg'):
        return JsonResponse({'error': 'Invalid file content'}, status=400)
    
    # ✅ Additional MIME type check
    if file.content_type not in ['image/jpeg', 'image/png']:
        return JsonResponse({'error': 'Invalid MIME type'}, status=400)
    
    # ... rest of upload
```

**Better: Use python-magic**:
```python
import magic

def validate_file_with_magic(file_obj):
    """Use libmagic to detect real file type"""
    file_obj.seek(0)
    mime_type = magic.Magic(mime=True).from_buffer(file_obj.read(1024))
    file_obj.seek(0)
    
    if mime_type not in ['image/jpeg', 'image/png', 'image/gif']:
        return False
    
    return True
```

---

### 3. ✅ Sanitize Filenames

**Implementation**:
```python
import os
import uuid
import re
from django.utils.text import slugify

def sanitize_filename(filename):
    """Remove dangerous characters from filename"""
    
    # ✅ Method 1: Generate random filename (most secure)
    # Completely ignore user's filename
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    
    # Validate extension
    if ext not in ['.jpg', '.jpeg', '.png', '.gif']:
        raise ValueError('Invalid file extension')
    
    # Generate UUID-based filename
    new_filename = f"{uuid.uuid4().hex}{ext}"
    return new_filename

def upload_file(request):
    file = request.FILES['file']
    
    try:
        # ✅ Generate safe filename
        safe_filename = sanitize_filename(file.name)
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)
    
    # ✅ Store with safe filename
    storage_path = os.path.join(settings.MEDIA_ROOT, safe_filename)
    
    with open(storage_path, 'wb') as f:
        for chunk in file.chunks():
            f.write(chunk)
    
    return JsonResponse({
        'status': 'uploaded',
        'filename': safe_filename  # Return safe name only
    })

# ✅ Method 2: If you must keep filename
def sanitize_filename_keep_original(filename):
    """Keep original but remove dangerous characters"""
    # Remove null bytes
    filename = filename.replace('\x00', '')
    
    # Remove path traversal
    filename = os.path.basename(filename)
    
    # Remove dangerous characters
    filename = re.sub(r'[^\w\-_\. ]', '', filename)
    
    # Limit length
    name, ext = os.path.splitext(filename)
    name = name[:50]  # Max 50 chars
    filename = f"{name}{ext}"
    
    return filename
```

---

### 4. ✅ Store Files Outside Web Root

**Bad Configuration**:
```python
# ❌ Files stored in web-accessible directory
MEDIA_ROOT = '/app/uploads/'
MEDIA_URL = '/uploads/'  # ← Directly accessible!
```

**Good Configuration**:
```python
# ✅ Files stored outside web root
MEDIA_ROOT = '/var/uploads/'  # Outside /app/
MEDIA_URL = '/files/'  # Served through application

# Nginx configuration:
# location /files/ {
#   alias /var/uploads/;
#   types { } default_type application/octet-stream;  # Force download
# }
```

**Implementation**:
```python
from django.http import FileResponse
from django.core.files.storage import default_storage

def download_file(request, file_id):
    """Download file through application"""
    # ✅ File is outside web root
    # ✅ Served through application (can add auth checks)
    
    file_path = f'uploads/{file_id}.jpg'
    
    # Check authorization
    if not user_owns_file(request.user, file_id):
        return JsonResponse({'error': 'Forbidden'}, status=403)
    
    response = FileResponse(default_storage.open(file_path, 'rb'))
    response['Content-Disposition'] = f'attachment; filename="{file_id}.jpg"'
    response['Content-Type'] = 'image/jpeg'
    
    return response
```

---

### 5. ✅ Enforce File Size Limits

**Implementation**:
```python
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5MB
MAX_ARCHIVE_SIZE = 50 * 1024 * 1024  # 50MB for archives

def upload_file(request):
    file = request.FILES['file']
    
    # ✅ Check size
    if file.size > MAX_UPLOAD_SIZE:
        return JsonResponse({
            'error': f'File too large (max {MAX_UPLOAD_SIZE / 1024 / 1024:.0f}MB)'
        }, status=400)
    
    # Process file...

# Django settings.py
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880
```

---

### 6. ✅ Scan for Viruses/Malware

**Using ClamAV**:
```python
# Install: pip install pyclamd
import pyclamd

def scan_file_for_virus(file_path):
    """Scan file using ClamAV antivirus"""
    clam = pyclamd.ClamD()
    
    if not clam.ping():
        raise Exception("ClamAV daemon not available")
    
    result = clam.scan_file(file_path)
    
    if result:
        # Virus detected
        os.remove(file_path)  # Delete infected file
        return False
    
    return True

def upload_file(request):
    file = request.FILES['file']
    
    # ... validation ...
    
    # ✅ Store temporarily
    temp_path = f'/tmp/{uuid.uuid4().hex}'
    
    with open(temp_path, 'wb') as f:
        for chunk in file.chunks():
            f.write(chunk)
    
    # ✅ Scan for viruses
    if not scan_file_for_virus(temp_path):
        return JsonResponse({'error': 'File contains malware'}, status=400)
    
    # ✅ Move to permanent location
    final_path = os.path.join(settings.MEDIA_ROOT, sanitize_filename(file.name))
    os.rename(temp_path, final_path)
    
    return JsonResponse({'status': 'uploaded'})
```

---

### 7. ✅ Disable Execution in Upload Directory

**Nginx Configuration**:
```nginx
location /uploads/ {
    # ✅ Prevent script execution
    location ~ \.(php|php3|php4|php5|phtml|jsp|asp|aspx|cgi|pl)$ {
        deny all;
    }
    
    # ✅ Force download, don't display
    default_type application/octet-stream;
    add_header Content-Disposition "attachment";
}
```

**Apache (.htaccess)**:
```apache
<FilesMatch "\.(?:php|php3|php4|php5|phtml|jsp|asp|aspx|cgi|pl)$">
    Deny from all
</FilesMatch>

# Disable script execution
php_flag engine off

# Only allow specific extensions
<FilesMatch "\.(jpg|jpeg|png|gif)$">
    Allow from all
</FilesMatch>
```

---

### 8. ✅ Prevent XXE Attacks

**Implementation**:
```python
import defusedxml.ElementTree as ET

def upload_xml_file(request):
    xml_file = request.FILES['data.xml']
    
    # ✅ Use defusedxml (prevents XXE)
    # Instead of: xml.etree.ElementTree
    # Use: defusedxml.ElementTree
    
    try:
        tree = ET.parse(xml_file)
        data = tree.getroot()
    except ET.ParseError as e:
        return JsonResponse({'error': 'Invalid XML'}, status=400)
    
    return JsonResponse({'status': 'processed'})

# Install: pip install defusedxml
```

---

## Implementation Guide

### Step 1: Configure Django File Upload

```python
# settings.py

# File upload settings
FILE_UPLOAD_TEMP_DIR = '/tmp/'
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880

# Media files
MEDIA_ROOT = '/var/uploads/'  # Outside web root!
MEDIA_URL = '/files/'  # Served through app

# Storage
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
```

### Step 2: Create Secure Upload Handler

```python
# api/file_handler.py

import os
import uuid
import magic
from django.http import JsonResponse
from django.conf import settings
from django.core.files.storage import default_storage

class SecureFileUploader:
    ALLOWED_EXTENSIONS = {
        'image': {'jpg', 'jpeg', 'png', 'gif', 'webp'},
        'document': {'pdf', 'doc', 'docx', 'txt'},
    }
    
    ALLOWED_MIMES = {
        'image': {'image/jpeg', 'image/png', 'image/gif', 'image/webp'},
        'document': {'application/pdf', 'application/msword'},
    }
    
    MAX_SIZES = {
        'image': 5 * 1024 * 1024,  # 5MB
        'document': 10 * 1024 * 1024,  # 10MB
    }
    
    FILE_SIGNATURES = {
        b'\xFF\xD8\xFF': ('image/jpeg', 'jpg'),
        b'\x89PNG': ('image/png', 'png'),
        b'GIF87a': ('image/gif', 'gif'),
        b'GIF89a': ('image/gif', 'gif'),
    }
    
    @classmethod
    def validate_and_upload(cls, file_obj, file_type='image', user=None):
        """Validate and upload file securely"""
        
        # ✅ Step 1: Validate size
        if file_obj.size > cls.MAX_SIZES.get(file_type, 10*1024*1024):
            return {'error': 'File too large'}, 400
        
        # ✅ Step 2: Validate extension
        ext = os.path.splitext(file_obj.name)[1].lower().lstrip('.')
        if ext not in cls.ALLOWED_EXTENSIONS.get(file_type, set()):
            return {'error': 'Invalid file type'}, 400
        
        # ✅ Step 3: Validate content (magic bytes)
        file_obj.seek(0)
        header = file_obj.read(20)
        file_obj.seek(0)
        
        is_valid_content = any(
            header.startswith(sig) for sig in cls.FILE_SIGNATURES.keys()
        )
        if not is_valid_content:
            return {'error': 'File content invalid'}, 400
        
        # ✅ Step 4: Generate safe filename
        safe_filename = f"{uuid.uuid4().hex}.{ext}"
        
        # ✅ Step 5: Store file
        storage_path = default_storage.save(
            f'uploads/{safe_filename}',
            file_obj
        )
        
        # ✅ Step 6: Set proper permissions
        try:
            os.chmod(os.path.join(settings.MEDIA_ROOT, storage_path), 0o644)
        except:
            pass
        
        return {
            'status': 'uploaded',
            'filename': safe_filename,
            'size': file_obj.size
        }, 200

# Usage in views.py
def upload_profile_picture(request):
    if 'file' not in request.FILES:
        return JsonResponse({'error': 'No file'}, status=400)
    
    file = request.FILES['file']
    result, status_code = SecureFileUploader.validate_and_upload(
        file,
        file_type='image',
        user=request.user
    )
    
    return JsonResponse(result, status=status_code)
```

### Step 3: Frontend Upload Handler

```jsx
// components/FileUpload.jsx

import React, { useState } from 'react';

function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // ✅ Frontend validation
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPEG/PNG allowed');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large (max 5MB)');
      return;
    }
    
    // Upload
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
        headers: {
          'X-CSRFToken': getCsrfToken()
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Upload successful');
        e.target.value = '';
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleUpload}
        disabled={uploading}
      />
      {error && <div className="error">{error}</div>}
      {uploading && <div>Uploading...</div>}
    </div>
  );
}

export default FileUpload;
```

---

## Code Audit Checklist

- [ ] Whitelist allowed file extensions
- [ ] Validate file content (magic bytes)
- [ ] Check MIME type
- [ ] Sanitize/randomize filenames
- [ ] Enforce file size limits
- [ ] Store files outside web root
- [ ] Disable script execution in upload directory
- [ ] Require authentication for uploads
- [ ] Scan files for viruses (ClamAV)
- [ ] Check file content matches extension
- [ ] Prevent directory traversal (../)
- [ ] Prevent path traversal in archives (Zip Slip)
- [ ] Validate archive contents before extraction
- [ ] Log all uploads for audit
- [ ] Implement rate limiting on uploads
- [ ] Use HTTPS for file uploads
- [ ] Validate file permissions after upload
- [ ] Check for XXE in XML uploads
- [ ] Quarantine suspicious files
- [ ] Test with known attack payloads

---

## Testing Procedures

### Manual Testing

#### Test 1: PHP Upload (Should Fail)
```bash
# Create shell.php
echo '<?php system($_GET["cmd"]); ?>' > shell.php

# Try to upload
curl -F "file=@shell.php" https://example.com/api/upload
# Expected: 400 - Invalid file type
```

#### Test 2: Renamed PHP File (Should Fail)
```bash
# Rename to shell.php.jpg
mv shell.php shell.php.jpg

curl -F "file=@shell.php.jpg" https://example.com/api/upload
# Expected: 400 - Invalid file content
```

#### Test 3: Valid Image (Should Succeed)
```bash
# Use real image
curl -F "file=@real_image.jpg" https://example.com/api/upload
# Expected: 200 - Upload successful
```

#### Test 4: Path Traversal (Should Fail)
```bash
# Filename with traversal
curl -F "file=@../shell.php" https://example.com/api/upload
# Expected: 400 or file stored safely
```

### Automated Testing

```python
from django.test import TestCase, Client
from django.core.files.uploadedfile import SimpleUploadedFile
from io import BytesIO
from PIL import Image

class FileUploadSecurityTests(TestCase):
    
    def setUp(self):
        self.client = Client()
    
    def test_php_upload_rejected(self):
        """PHP files should be rejected"""
        php_content = b'<?php system($_GET["cmd"]); ?>'
        file = SimpleUploadedFile(
            'shell.php',
            php_content,
            content_type='application/x-php'
        )
        
        response = self.client.post('/api/upload', {'file': file})
        self.assertEqual(response.status_code, 400)
    
    def test_renamed_php_rejected(self):
        """Renamed PHP files should be rejected"""
        php_content = b'<?php system($_GET["cmd"]); ?>'
        file = SimpleUploadedFile(
            'shell.php.jpg',
            php_content,
            content_type='image/jpeg'
        )
        
        response = self.client.post('/api/upload', {'file': file})
        self.assertEqual(response.status_code, 400)
    
    def test_valid_image_accepted(self):
        """Valid images should be accepted"""
        # Create real image
        image = Image.new('RGB', (100, 100), color='red')
        image_io = BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        
        file = SimpleUploadedFile(
            'image.jpg',
            image_io.read(),
            content_type='image/jpeg'
        )
        
        response = self.client.post('/api/upload', {'file': file})
        self.assertEqual(response.status_code, 200)
    
    def test_oversized_file_rejected(self):
        """Large files should be rejected"""
        large_content = b'x' * (6 * 1024 * 1024)  # 6MB
        file = SimpleUploadedFile(
            'large.jpg',
            large_content,
            content_type='image/jpeg'
        )
        
        response = self.client.post('/api/upload', {'file': file})
        self.assertEqual(response.status_code, 400)
    
    def test_path_traversal_prevented(self):
        """Path traversal should be prevented"""
        image = Image.new('RGB', (100, 100))
        image_io = BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        
        file = SimpleUploadedFile(
            '../../../etc/passwd',
            image_io.read(),
            content_type='image/jpeg'
        )
        
        response = self.client.post('/api/upload', {'file': file})
        # Should be safe or rejected
        self.assertIn(response.status_code, [200, 400])
        
        # Verify file wasn't written to parent directory
        # (Implementation specific check)
```

---

## Summary

✅ **DO**:
- Whitelist file extensions
- Validate file content (magic bytes)
- Check MIME type
- Randomize filenames (use UUID)
- Enforce strict size limits
- Store files outside web root
- Disable execution in upload directories
- Scan for viruses
- Require authentication
- Validate archive contents
- Use defusedxml for XML files
- Log all uploads
- Test with known payloads

❌ **DON'T**:
- Trust file extensions alone
- Trust MIME types from client
- Use user-provided filenames
- Store uploads in web root
- Allow script execution
- Extract archives without validation
- Use blacklists instead of whitelists
- Allow arbitrary file types
- Trust magic bytes alone
- Process user-supplied archives
- Allow path traversal (../)
- Upload to predictable locations
- Enable server-side template rendering

