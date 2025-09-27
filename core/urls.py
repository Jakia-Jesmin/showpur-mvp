# core/urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# 🛑 UPDATE IMPORTS: Include UserDetailView 🛑
# We need to import the entire 'views' module to access UserDetailView and UserCreateView
from . import views 
from .views import BusinessProfileListCreateView, BusinessProfileDetailView 
# Note: Since we are using 'views.UserCreateView', we can remove the direct import
# of UserCreateView from the line above, but we'll import 'views' fully below.

# Let's clean up the imports to be consistent and include the new view
from .views import (
    BusinessProfileListCreateView, 
    BusinessProfileDetailView, 
    UserCreateView, # You had this before
    UserDetailView # <--- NEW VIEW IMPORTED HERE
)

urlpatterns = [
    # Core business profile URLs
    path('profiles/', BusinessProfileListCreateView.as_view(), name='profile-list-create'),
    path('profiles/<int:pk>/', BusinessProfileDetailView.as_view(), name='profile-detail'),

    # Registration URL
    path('register/', UserCreateView.as_view(), name='register'), # Consolidated this line

    # Simple JWT Authentication URLs
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # 🛑 NEW URL: Get current user details after login 🛑
    path('auth/user/', UserDetailView.as_view(), name='user-detail'),
]