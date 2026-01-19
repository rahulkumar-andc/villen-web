from functools import wraps
from django.http import JsonResponse
from rest_framework.permissions import BasePermission


# ============================================================
# DRF Permission Classes
# ============================================================

class IsSystemLevel(BasePermission):
    """
    Allows access only to System Level users (Super Admin, Admin, Monitor).
    """
    message = "System level access required."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.role:
            return False
        return profile.role.level <= 3  # MONITOR and above


class IsApplicationLevel(BasePermission):
    """
    Allows access to Application Level and above (includes Developers).
    """
    message = "Application level access required."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.role:
            return False
        return profile.role.level <= 4  # DEVELOPER and above


class IsPremiumUser(BasePermission):
    """
    Allows access to Premium users and above.
    """
    message = "Premium access required."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.role:
            return False
        return profile.role.level <= 5  # PREMIUM and above


class IsNormalUser(BasePermission):
    """
    Allows access to any registered user (Normal and above).
    """
    message = "Authentication required."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.role:
            return False
        return profile.role.level <= 6  # NORMAL and above


# ============================================================
# Function-Based View Decorators
# ============================================================

def role_required(min_level):
    """
    Decorator for function-based views.
    Usage: @role_required(Role.PREMIUM)
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'Authentication required'}, status=401)
            
            profile = getattr(request.user, 'profile', None)
            if not profile or not profile.role:
                return JsonResponse({'error': 'No role assigned'}, status=403)
            
            if profile.role.level > min_level:
                return JsonResponse({'error': 'Insufficient permissions'}, status=403)
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


# ============================================================
# Utility Functions
# ============================================================

def get_user_role(user):
    """Get user's role or None."""
    if not user.is_authenticated:
        return None
    profile = getattr(user, 'profile', None)
    return profile.role if profile else None


def get_user_level(user):
    """Get user's role level (7 for guest/unauthenticated)."""
    role = get_user_role(user)
    return role.level if role else 7
