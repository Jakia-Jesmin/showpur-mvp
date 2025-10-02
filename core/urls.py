# C:\showpur-mvp\core\urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView # Only need TokenRefreshView here

from .views import (
    UserCreateView, 
    UserDetailView, 
    MyTokenObtainPairView,
    ShowroomInventoryListView,
    RecordSaleView,
    BusinessProfileViewSet 
)

# 1. Initialize the Router
router = DefaultRouter()
# Register the BusinessProfileViewSet with the base path 'profiles' 
# This handles: /profiles/ (GET, POST) and /profiles/<pk>/ (GET, PUT, DELETE)
router.register(r'profiles', BusinessProfileViewSet, basename='business-profile')


urlpatterns = [
    # ----------------------------------------------------
    # 1. BUSINESS PROFILE URLs (Handles CRUD via Router)
    # ----------------------------------------------------
    # All /profiles/ and /profiles/<pk>/ paths are now handled by the router
    path('', include(router.urls)),

    # ----------------------------------------------------
    # 2. AUTHENTICATION & USER URLs
    # ----------------------------------------------------
    
    # Registration
    path('register/', UserCreateView.as_view(), name='register'),
    
    # Custom JWT Token Endpoints (using your custom serializer view)
    path('auth/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Get/Update current user details after login
    path('auth/user/', UserDetailView.as_view(), name='user-detail'),

    # ----------------------------------------------------
    # 3. SHOWROOM & SALES URLs
    # ----------------------------------------------------
    
    # Sales Tracking
    path('sales/record/', RecordSaleView.as_view(), name='record-sale'),
    
    # Showroom Inventory Dashboard
    path('dashboard/showroom/inventory/', ShowroomInventoryListView.as_view(), name='showroom-inventory-list'),
]
