from django.db import models
from django.contrib.auth.models import User


class Role(models.Model):
    """
    Role hierarchy for RBAC.
    Lower level = higher power.
    """
    SUPER_ADMIN = 1
    ADMIN = 2
    MONITOR = 3
    DEVELOPER = 4
    PREMIUM = 5
    NORMAL = 6
    GUEST = 7

    ROLE_CHOICES = [
        (SUPER_ADMIN, 'Super Admin'),
        (ADMIN, 'Admin'),
        (MONITOR, 'Monitor'),
        (DEVELOPER, 'Developer'),
        (PREMIUM, 'Premium User'),
        (NORMAL, 'Normal User'),
        (GUEST, 'Guest'),
    ]

    ROLE_TYPE_CHOICES = [
        ('SYSTEM', 'System Level'),
        ('APPLICATION', 'Application Level'),
        ('USER', 'User Level'),
    ]

    name = models.CharField(max_length=50, unique=True)
    level = models.PositiveIntegerField(unique=True, help_text="Lower = more power")
    role_type = models.CharField(max_length=20, choices=ROLE_TYPE_CHOICES, default='USER')
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['level']

    def __str__(self):
        return f"{self.name} (Level {self.level})"


class UserProfile(models.Model):
    """
    Extends User model with role and verification status.
    """
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 15

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    lockout_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        role_name = self.role.name if self.role else 'No Role'
        return f"{self.user.username} - {role_name}"

    def has_permission(self, required_level):
        """Check if user's role level allows access."""
        if not self.role:
            return False
        return self.role.level <= required_level

    def is_locked_out(self):
        """Check if account is temporarily locked."""
        from django.utils import timezone
        if self.lockout_until and timezone.now() < self.lockout_until:
            return True
        return False

    def record_failed_login(self):
        """Increment failed login counter and lock if needed."""
        from django.utils import timezone
        from datetime import timedelta
        
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= self.MAX_LOGIN_ATTEMPTS:
            self.lockout_until = timezone.now() + timedelta(minutes=self.LOCKOUT_DURATION_MINUTES)
        self.save()

    def reset_login_attempts(self):
        """Reset counter on successful login."""
        self.failed_login_attempts = 0
        self.lockout_until = None
        self.save()





class EmailOTP(models.Model):
    """
    Temporary OTP storage for email verification.
    Used for both registration and password reset.
    """
    MAX_ATTEMPTS = 5
    
    PURPOSE_CHOICES = [
        ('registration', 'Registration'),
        ('password_reset', 'Password Reset'),
    ]

    email = models.EmailField()
    otp = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='registration')
    expiry_time = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Email OTP"
        verbose_name_plural = "Email OTPs"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email} - {self.purpose} - {'Verified' if self.is_verified else 'Pending'}"

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expiry_time

    def is_locked(self):
        """Check if max attempts exceeded."""
        return self.attempts >= self.MAX_ATTEMPTS

    def increment_attempts(self):
        """Increment failed attempt counter."""
        self.attempts += 1
        self.save()


# =============================================================================
# Blog Models
# =============================================================================

class BlogCategory(models.Model):
    """Blog post categories."""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default='#00d4ff')  # Hex color
    
    class Meta:
        verbose_name_plural = "Blog Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class BlogPost(models.Model):
    """Blog posts with access control."""
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    excerpt = models.TextField(max_length=500)
    content = models.TextField()
    
    category = models.ForeignKey(BlogCategory, on_delete=models.SET_NULL, null=True, related_name='posts')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blog_posts')
    
    is_public = models.BooleanField(default=True)
    is_restricted = models.BooleanField(default=False, help_text="Requires login to view")
    min_role_level = models.PositiveIntegerField(default=7, help_text="Min role level required (7=Guest, 5=Premium)")
    
    reading_time_mins = models.PositiveIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def can_access(self, user):
        """Check if user can access this post."""
        if self.is_public and not self.is_restricted:
            return True
        if not user or not user.is_authenticated:
            return False
        profile = getattr(user, 'profile', None)
        if not profile or not profile.role:
            return False
        return profile.role.level <= self.min_role_level


# =============================================================================
# CORE CONTENT MODELS (Projects & Notes)
# =============================================================================

class Project(models.Model):
    CATEGORY_CHOICES = [
        ('DESKTOP APP', 'Desktop App'),
        ('WEB DEV', 'Web Dev'),
        ('NETWORK SEC', 'Network Sec'),
        ('OSINT TOOLS', 'OSINT Tools'),
        ('INFOSEC', 'InfoSec'),
        ('WEB APP', 'Web App'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Research', 'Research'),
        ('Coming Soon', 'Coming Soon'),
        ('Legacy', 'Legacy'),
    ]

    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Active')
    tagline = models.CharField(max_length=300)
    link = models.URLField(blank=True, null=True, help_text="External link (GitHub, Deployment)")
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    order = models.IntegerField(default=0, help_text="Order in which projects appear")

    class Meta:
        ordering = ['-order', '-created_at']

    def __str__(self):
        return self.title

    @property
    def status_color(self):
        # Map status to frontend classes
        colors = {
            'Active': 'status-green',
            'Research': 'status-yellow',
            'Coming Soon': 'status-grey',
            'Legacy': 'status-red'
        }
        return colors.get(self.status, 'status-grey')


class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes', null=True, blank=True)
    title = models.CharField(max_length=200, default='Field Note')
    body = models.TextField()
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.created_at.strftime('%Y-%m-%d')}"


class ContactMessage(models.Model):
    name = models.CharField(max_length=100, blank=True)
    email = models.EmailField()
    message = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Msg from {self.email} - {self.created_at.strftime('%Y-%m-%d')}"





class AuditLog(models.Model):
    """
    Security and action logs for Super Admin / Monitor.
    """
    ACTION_CHOICES = [
        ('LOGIN', 'Login'),
        ('LOGIN_FAILED', 'Login Failed'),
        ('LOGOUT', 'Logout'),
        ('REGISTER', 'Register'),
        ('ROLE_CHANGE', 'Role Change'),
        ('BAN_USER', 'Ban User'),
        ('UNBAN_USER', 'Unban User'),
        ('DELETE_CONTENT', 'Delete Content'),
        ('FLAG_CONTENT', 'Flag Content'),
        ('PASSWORD_RESET', 'Password Reset'),
        ('SYSTEM_CONFIG', 'System Config Change'),
    ]

    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs_actor')
    target_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs_target')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    details = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        actor_name = self.actor.username if self.actor else 'System'
        return f"{self.created_at} - {actor_name} - {self.action}"


# =============================================================================
# Blog Comments
# =============================================================================

class BlogComment(models.Model):
    """Comments on blog posts."""
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name='comments')
    author_name = models.CharField(max_length=100, help_text="Name for guest commenters")
    author_email = models.EmailField(blank=True, null=True)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='blog_comments')
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.author_name} on {self.post.title}"


# =============================================================================
# Analytics
# =============================================================================

class PageView(models.Model):
    """Track page views for analytics."""
    path = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.path} - {self.created_at}"


class DailyStats(models.Model):
    """Daily aggregated statistics."""
    date = models.DateField(unique=True)
    total_visits = models.PositiveIntegerField(default=0)
    unique_visitors = models.PositiveIntegerField(default=0)
    total_page_views = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Stats for {self.date}"
