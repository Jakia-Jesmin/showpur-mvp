# core/urls.py
from django.urls import path
from .views import BusinessProfileListCreateView, BusinessProfileDetailView

urlpatterns = [
    path('profiles/', BusinessProfileListCreateView.as_view(), name='profile-list-create'),
    path('profiles/<int:pk>/', BusinessProfileDetailView.as_view(), name='profile-detail'),
]
