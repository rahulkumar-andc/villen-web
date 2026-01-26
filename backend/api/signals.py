import logging
from django.db.models.signals import post_save, post_delete
from django.contrib.auth.signals import user_logged_in, user_login_failed, user_logged_out
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import AuditLog, UserProfile, Role, BlogPost, Note

logger = logging.getLogger('django.security')

def get_client_ip(request):
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    ip = get_client_ip(request)
    AuditLog.objects.create(
        actor=user,
        target_user=user,
        action='LOGIN',
        details=f"Login successful via {request.method}",
        ip_address=ip
    )

@receiver(user_login_failed)
def log_login_failed(sender, credentials, request, **kwargs):
    ip = get_client_ip(request)
    username = credentials.get('username', 'unknown')
    # Try to find user to link if possible, otherwise just log details
    target_user = User.objects.filter(username=username).first()
    
    AuditLog.objects.create(
        actor=None, # System/Anonymous
        target_user=target_user,
        action='LOGIN_FAILED',
        details=f"Failed login attempt for username: {username}",
        ip_address=ip
    )

@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    if user:
        ip = get_client_ip(request)
        AuditLog.objects.create(
            actor=user,
            target_user=user,
            action='LOGOUT',
            details="User logged out",
            ip_address=ip
        )

# =============================================================================
# Model Changes
# =============================================================================

@receiver(post_save, sender=Role)
def log_role_changes(sender, instance, created, **kwargs):
    action = 'ROLE_CREATED' if created else 'ROLE_UPDATED'
    # For automated tests or scripts, request might not be available
    # Signals don't have access to request context easily without thread locals or custom middleware.
    # We will log it as System action for now.
    
    AuditLog.objects.create(
        actor=None, 
        action='SYSTEM_CONFIG', 
        details=f"Role '{instance.name}' {action.lower()}. Level: {instance.level}"
    )

@receiver(post_save, sender=UserProfile)
def log_profile_changes(sender, instance, created, **kwargs):
    if not created:
         # Check if role changed (tricky without tracking fields, but log update)
         AuditLog.objects.create(
            actor=None,
            target_user=instance.user,
            action='ROLE_CHANGE',
            details=f"UserProfile updated. Current Role: {instance.role.name if instance.role else 'None'}"
        )
