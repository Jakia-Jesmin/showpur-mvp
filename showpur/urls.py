# C:\showpur-mvp\showpur\urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse 
# REMOVED: Unnecessary direct import of Simple JWT views
# from rest_framework_simplejwt.views import (TokenObtainPairView, TokenRefreshView) 

def api_root(request):
    return JsonResponse({
        'message': 'Showpur API',
        'endpoints': {
            'admin': '/admin/',
            'api': '/api/',
        }
    })

urlpatterns = [
    # Optional: Root API view
    path('', api_root, name='api-root'),
    
    # Django Admin
    path('admin/', admin.site.urls),
    
    # 🎯 CORRECT DJOSER INTEGRATION 🎯
    # Djoser handles user registration, activation, etc.
    path('api/auth/', include('djoser.urls')), 
    
    # Djoser's JWT URLS PROVIDE: /api/auth/jwt/create/ (for login) and /api/auth/jwt/refresh/
    # This replaces the need for the TokenObtainPairView and TokenRefreshView.
    path('api/auth/', include('djoser.urls.jwt')), 
    
    # REMOVED: djoser.urls.authtoken (Since you use JWT)
    # REMOVED: Redundant path('api/auth/token/', ...) and path('api/auth/token/refresh/', ...)

    # All application-specific logic (profiles, products, etc.)
    path('api/', include('core.urls')),
] 

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    