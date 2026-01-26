from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to access it.
    """
    def has_object_permission(self, request, view, obj):
        # Check for 'user' or 'author' field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'author'):
            return obj.author == request.user
        return False

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


# =============================================================================
# API Key Permissions
# =============================================================================

class HasAPIKeyScope(permissions.BasePermission):
    """
    Check if API key has required scope.
    Usage: HasAPIKeyScope('read') or HasAPIKeyScope(['read', 'write'])
    """
    def __init__(self, required_scopes):
        if isinstance(required_scopes, str):
            self.required_scopes = [required_scopes]
        else:
            self.required_scopes = required_scopes

    def has_permission(self, request, view):
        # Check if request was authenticated with API key
        if not hasattr(request, 'auth') or not request.auth:
            return False

        # Check if auth object is an APIKey instance
        from .models import APIKey
        if not isinstance(request.auth, APIKey):
            return False

        # Check if API key has required scope
        api_key = request.auth
        return any(scope in api_key.scopes for scope in self.required_scopes)


class APIKeyOrUserAuth(permissions.BasePermission):
    """
    Allow access if authenticated via API key OR regular user authentication.
    Useful for endpoints that support both authentication methods.
    """
    def has_permission(self, request, view):
        # Allow if user is authenticated (regular auth)
        if request.user and request.user.is_authenticated:
            return True

        # Allow if API key authentication was used
        if hasattr(request, 'auth') and request.auth:
            from .models import APIKey
            return isinstance(request.auth, APIKey)

        return False


class APIKeyOnly(permissions.BasePermission):
    """
    Only allow access via API key authentication.
    Useful for third-party integrations that should not use user credentials.
    """
    def has_permission(self, request, view):
        if not hasattr(request, 'auth') or not request.auth:
            return False

        from .models import APIKey
        return isinstance(request.auth, APIKey)
