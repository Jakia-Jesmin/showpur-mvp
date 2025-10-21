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

        # Write permissions are only allowed to the user of the profile.
        return obj.user == request.user

# 🛑 Showroom Manager permission class 🛑
class IsShowroomManager(permissions.BasePermission):
    """
    Custom permission to only allow users who have an associated BusinessProfile 
    (required for manager roles like accessing the showroom dashboard).
    """
    message = 'You must be associated with a business profile to perform this action.'

    def has_permission(self, request, view):
        # Check if the user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Check if the user has an associated BusinessProfile
        # This implicitly checks for a profile since BusinessProfile is linked to User.
        try:
            return request.user.businessprofile is not None
        except:
            # If the related object does not exist, an exception is raised
            return False
        