# core/views.py

from rest_framework import generics
from rest_framework import filters
# Import necessary permissions
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
# We will NOT use APIView or Response for UserDetailView
# from rest_framework.views import APIView 
# from rest_framework.response import Response 

# Assuming this file exists and contains the IsOwnerOrReadOnly class
from .permissions import IsOwnerOrReadOnly 
from django.contrib.auth.models import User
from .models import BusinessProfile
from .serializers import BusinessProfileSerializer, UserSerializer

# 1. View for listing all profiles and creating a new profile
class BusinessProfileListCreateView(generics.ListCreateAPIView):
    queryset = BusinessProfile.objects.all()
    serializer_class = BusinessProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] 
    
    # Enable search filtering
    filter_backends = [filters.SearchFilter]
    search_fields = ['business_name', 'description', 'address'] 

    def perform_create(self, serializer):
        # Automatically set the user field to the currently logged-in user
        serializer.save(user=self.request.user)

# 2. View for retrieving, updating, and deleting a single profile
class BusinessProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BusinessProfile.objects.all()
    serializer_class = BusinessProfileSerializer
    
    # Allows GET (Read) by anyone, but PUT/PATCH/DELETE only by the profile owner.
    permission_classes = [IsOwnerOrReadOnly] 

# 3. View for user registration (accessible by anyone)
class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

# 🛑 4. CRITICAL FIX: User Detail View (Retrieve and Update) 🛑
# This view allows the authenticated user to GET their data and PATCH/PUT to update it.
# This fixes the 403 Forbidden error and enables the full User Profile feature.
class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    Allows the authenticated user to retrieve (GET) and update (PATCH/PUT) their own details.
    """
    serializer_class = UserSerializer
    
    # Only authenticated users can access this view
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Ensures the view only operates on the currently logged-in user's object
        return self.request.user