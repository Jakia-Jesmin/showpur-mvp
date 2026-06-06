from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

# Simple home page response
def home(request):
    return JsonResponse({
        'message': 'Welcome to ShowPur API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/',
            'connections': '/api/connections/',
            'products': '/api/products/',
            'display': '/api/display/',
            'social': '/api/social/',
            'dashboard': '/api/dashboard/',
            'notifications': '/api/notifications/',
            'search': '/api/search/',
            'admin': '/admin/',
        }
    })

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/connections/', include('apps.connections.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/display/', include('apps.display.urls')),
    path('api/social/', include('apps.social.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/search/', include('apps.search.urls')),
    path('api/ledger/', include('apps.ledger.urls')),
    path('api/acshow/', include('apps.acshow.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    