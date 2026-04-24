from django.shortcuts import redirect
from django.urls import reverse
from .models import BusinessProfile

class SubdomainMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host()
        
        # Skip for localhost and development
        if host in ['localhost:8000', '127.0.0.1:8000', 'localhost:3000']:
            return self.get_response(request)
        
        # Extract subdomain
        parts = host.split('.')
        if len(parts) >= 2:
            subdomain = parts[0]
            
            # Skip for www and root domain
            if subdomain in ['www', 'showpur', 'showpur-com']:
                return self.get_response(request)
            
            # Check if subdomain matches a business profile
            try:
                profile = BusinessProfile.objects.get(slug=subdomain)
                request.subdomain_profile = profile
                request.is_subdomain = True
            except BusinessProfile.DoesNotExist:
                pass
        
        return self.get_response(request)
    