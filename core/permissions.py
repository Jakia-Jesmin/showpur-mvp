# core/permissions.py

from rest_framework import permissions

class IsUserOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request, so we'll always allow GET, HEAD, or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object (assuming 'user' field links to the User).
        # Note: For BusinessProfile, you might need to check obj.user == request.user
        return obj.user == request.user

# --- ROLE-BASED PERMISSIONS ---

class IsProducer(permissions.BasePermission):
    """
    Custom permission to only allow access to users whose profile role is 'PRODUCER'.
    This is used for product creation and owner-initiated allocation.
    """
    message = 'Access denied. Only Producer accounts can perform this action.'

    def has_permission(self, request, view):
        # Must be authenticated
        if not request.user.is_authenticated:
            return False
            
        # Check if the user has a profile and the role is 'PRODUCER'
        try:
            return request.user.profile.role == 'PRODUCER'
        except AttributeError:
            # Handle case where user has no profile object (shouldn't happen if profile creation is mandatory)
            return False

class IsStore(permissions.BasePermission):
    """
    Custom permission to only allow access to users whose profile role is 'STORE'.
    This is used for requesting allocation and receiving inventory.
    """
    message = 'Access denied. Only Showroom/Store accounts can perform this action.'

    def has_permission(self, request, view):
        # Must be authenticated
        if not request.user.is_authenticated:
            return False
            
        # Check if the user has a profile and the role is 'STORE'
        try:
            return request.user.profile.role == 'STORE'
        except AttributeError:
            return False

# --- GENERIC PROFILE CHECK (Replaced/Simplified) ---

class IsShowroomManager(permissions.BasePermission):
    """
    Custom permission to ensure the user has an associated BusinessProfile.
    (Simplified check since all role-based checks already handle this).
    """
    message = 'You must be associated with a business profile to perform this action.'

    def has_permission(self, request, view):
        # This can be simplified since the Producer/Store checks handle the existence check.
        # If this is ONLY for the dashboard, you might prefer this generic check.
        if not request.user.is_authenticated:
            return False
            
        # Using hasattr is cleaner than try/except for checking related objects
        return hasattr(request.user, 'profile')