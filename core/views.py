from django.shortcuts import render

# core/views.py
from rest_framework import generics
from .models import BusinessProfile
from .serializers import BusinessProfileSerializer

class BusinessProfileListCreate(generics.ListCreateAPIView):
    queryset = BusinessProfile.objects.all()
    serializer_class = BusinessProfileSerializer

