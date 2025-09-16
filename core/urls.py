# core/urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import BusinessProfileListCreateView, BusinessProfileDetailView, UserCreateView

urlpatterns = [
    # Core business profile URLs
    path('profiles/', BusinessProfileListCreateView.as_view(), name='profile-list-create'),
    path('profiles/<int:pk>/', BusinessProfileDetailView.as_view(), name='profile-detail'),

    # Authentication URLs
    path('register/', UserCreateView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
