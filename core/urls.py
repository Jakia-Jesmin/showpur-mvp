# showpur-mvp/core/urls.py

from django.urls import path
from .views import BusinessProfileListCreate

urlpatterns = [
    path('profiles/', BusinessProfileListCreate.as_view(), name='profile-list-create'),
]
