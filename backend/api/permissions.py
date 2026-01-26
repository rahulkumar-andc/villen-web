from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to access it.
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to Super Admins (Level 1).
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                    hasattr(request.user, 'profile') and request.user.profile.role.level == 1)

class IsAdmin(permissions.BasePermission):
    """
    Allows access to Admin (Level 2) and above.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                    hasattr(request.user, 'profile') and request.user.profile.role.level <= 2)

class IsMonitor(permissions.BasePermission):
    """
    Allows access to Monitor (Level 3) and above.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                    hasattr(request.user, 'profile') and request.user.profile.role.level <= 3)

class IsPremium(permissions.BasePermission):
    """
    Allows access to Premium Users (Level 5) and above.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                    hasattr(request.user, 'profile') and request.user.profile.role.level <= 5)
