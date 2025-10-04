# core/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    UserCreateView, 
    UserDetailView, 
    MyTokenObtainPairView,
    BusinessProfileViewSet,
    ProductViewSet, 
    ShowroomInventoryViewSet,
    RecordSaleView,
    InventoryAllocationViewSet,
    UserProfileView,
)

# Initialize the Router
router = DefaultRouter()
router.register(r'profiles', BusinessProfileViewSet, basename='business-profile')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'allocations', InventoryAllocationViewSet, basename='allocation')
router.register(r'inventory', ShowroomInventoryViewSet, basename='inventory')

urlpatterns = [
    # Router URLs (must come first to avoid conflicts)
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('auth/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/user/', UserProfileView.as_view(), name='user-profile'),  # Fixed path
    
    # User registration and management
    path('register/', UserCreateView.as_view(), name='user_register'),
    path('user/', UserDetailView.as_view(), name='user_detail'),
    
    # Sales endpoint
    path('inventory/record_sale/', RecordSaleView.as_view(), name='record_sale'),
]
