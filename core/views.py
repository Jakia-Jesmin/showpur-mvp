# core/views.py
from rest_framework import generics
from .models import BusinessProfile
from .serializers import BusinessProfileSerializer

# For listing all profiles and creating a new one
class BusinessProfileListCreateView(generics.ListCreateAPIView):
    queryset = BusinessProfile.objects.all()
    serializer_class = BusinessProfileSerializer

# New view for retrieving a single profile by its ID
class BusinessProfileDetailView(generics.RetrieveAPIView):
    queryset = BusinessProfile.objects.all()
    serializer_class = BusinessProfileSerializer
    