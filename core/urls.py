# C:\showpur-mvp\core\urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView # Only need TokenRefreshView here

# 🛑 Import ALL ViewSets and Views 🛑
from .views import (
    UserCreateView, 
    UserDetailView, 
    MyTokenObtainPairView,
    BusinessProfileViewSet,
    ProductViewSet, 
    ShowroomInventoryListView,
    RecordSaleView
)

# 1. Initialize the Router
router = DefaultRouter()
# Register the BusinessProfileViewSet with the base path 'profiles' 
# This handles: /profiles/ (GET, POST) and /profiles/<pk>/ (GET, PUT, DELETE)
router.register(r'profiles', BusinessProfileViewSet, basename='business-profile')
# 🛑 Register the new ProductViewSet 🛑
router.register(r'products', ProductViewSet, basename='product') 


urlpatterns = [
    # ----------------------------------------------------
    # 1. JWT AUTH ENDPOINTS
    # ----------------------------------------------------
        path('auth/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),


    # ----------------------------------------------------
    # 2. CORE USER MGMT
    # ----------------------------------------------------
        path('register/', UserCreateView.as_view(), name='user_register'),
        path('user/', UserDetailView.as_view(), name='user_detail'),

    # -----------------------------------------------------------------------
    # 3. BUSINESS PROFILE URLs (Handles CRUD via Router)
    # All /profiles/ and /profiles/<pk>/ paths are now handled by the router
    # -----------------------------------------------------------------------
        path('', include(router.urls)),

    
    # ----------------------------------------------------
    # 4. SHOWROOM INVENTORY & SALES URLs
    # ----------------------------------------------------
        path('inventory/', ShowroomInventoryListView.as_view(), name='showroom_inventory'),
        path('inventory/record_sale/', RecordSaleView.as_view(), name='record_sale'),
        
 
    # ----------------------------------------------------
    # 4. SHOWROOM SALES TRACKING
    # ----------------------------------------------------
        path('sales/record/', RecordSaleView.as_view(), name='record-sale'),


    # ----------------------------------------------------
    # 5. SHOWROOM INVENTORY DASHBOARD
    # ----------------------------------------------------
        path('dashboard/showroom/inventory/', ShowroomInventoryListView.as_view(), name='showroom-inventory-list'),

    # ------------------------
    # 6. API ROUTES (ViewSets)
    # ------------------------
        path('', include(router.urls)),

]
