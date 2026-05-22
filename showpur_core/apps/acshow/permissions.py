# showpur_core/apps/acshow/permissions.py

from rest_framework.permissions import BasePermission
from django.utils import timezone

class HasAcShowAccess(BasePermission):
    """
    Check if user has AcShow access (paid or trial).
    Superusers and staff always have access.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Superusers and staff always have access
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Check if AcShow is enabled
        if hasattr(request.user, 'acshow_enabled') and request.user.acshow_enabled:
            return True
        
        # Check if trial is active
        if hasattr(request.user, 'acshow_trial_end') and request.user.acshow_trial_end:
            if request.user.acshow_trial_end > timezone.now():
                return True
        
        return False
    