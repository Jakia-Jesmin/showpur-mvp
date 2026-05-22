from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, ProfileView, ChangePasswordView,
    BusinessProfileView, FollowUnfollowView, AllBusinessProfilesView, 
    UserDetailView, BusinessProfileBySlugView, ForgotPasswordView, ResetPasswordView  # ← Added missing import
)

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # User profile
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    
    # Business profile
    path('business-profile/', BusinessProfileView.as_view(), name='my-business-profile'),
    path('business-profile/create/', BusinessProfileView.as_view(), name='create-business-profile'),
    path('business-profile/<int:user_id>/', BusinessProfileView.as_view(), name='business-profile-detail'),
    path('business-profiles/all/', AllBusinessProfilesView.as_view(), name='all-business-profiles'),
    
    # Social interaction
    path('follow/<int:profile_id>/', FollowUnfollowView.as_view(), name='follow-unfollow'),
    
    # User details
    path('user/<int:user_id>/', UserDetailView.as_view(), name='user-detail'),
    path('business/<slug:slug>/', BusinessProfileBySlugView.as_view(), name='business-profile-slug'),
    
    #Password Reset
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
]
