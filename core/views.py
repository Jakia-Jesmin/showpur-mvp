# core/views.py

from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from django.contrib.auth.models import User
from .models import BusinessProfile
from .serializers import BusinessProfileSerializer, UserSerializer

# Existing views
class BusinessProfileListCreateView(generics.ListCreateAPIView):
    queryset = BusinessProfile.objects.all()
    serializer_class = BusinessProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] # Restricts creation to authenticated users

    def perform_create(self, serializer):
        # Automatically set the user for the new profile to the currently logged-in user
        serializer.save(user=self.request.user)

class BusinessProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BusinessProfile.objects.all()
    serializer_class = BusinessProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] # Restricts changes to authenticated users

# New view for user registration
class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]