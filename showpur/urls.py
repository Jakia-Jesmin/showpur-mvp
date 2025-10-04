# C:\showpur-mvp\showpur\urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse # Keep if you want the API root view

def api_root(request):
    return JsonResponse({
        'message': 'Showpur API',
        'endpoints': {
            'admin': '/admin/',
            'api': '/api/',
            # Note: /api/auth/ is provided by djoser
        }
    })

urlpatterns = [
    # Optional: Root API view
    path('', api_root, name='api-root'),
    
    # Django Admin
    path('admin/', admin.site.urls),
    
    # 🎯 FIX: INCLUDE DJOSER URLS HERE 🎯
    # This inclusion provides the /api/auth/user/ endpoint needed by the frontend
    path('api/auth/', include('djoser.urls')), 
    path('api/auth/', include('djoser.urls.jwt')),

    # All application-specific logic (profiles, products, etc.)
    path('api/', include('core.urls')),
] 

# Static files for media/uploads (keep this at the end)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)