from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """
    Level 1: Super Admin (System Owner).
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'profile') or not request.user.profile.role:
            return False
        return request.user.profile.role.level == 1

class IsAdmin(permissions.BasePermission):
    """
    Level 2: Admin (Operations Manager).
    access: Super Admin (1) and Admin (2).
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'profile') or not request.user.profile.role:
            return False
        return request.user.profile.role.level <= 2

class IsMonitor(permissions.BasePermission):
    """
    Level 3: Monitor (Moderator).
    access: Level 1, 2, and 3.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'profile') or not request.user.profile.role:
            return False
        return request.user.profile.role.level <= 3

class IsPremium(permissions.BasePermission):
    """
    Level 5: Premium User.
    access: Level 1-5.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'profile') or not request.user.profile.role:
            return False
        return request.user.profile.role.level <= 5
