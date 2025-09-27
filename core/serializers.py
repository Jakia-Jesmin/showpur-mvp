# core/serializers.py

from rest_framework import serializers
from .models import BusinessProfile
from django.contrib.auth.models import User

# Updated Business Profile Serializer
class BusinessProfileSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True) # <-- This is key

    # Add this line to expose the user's ID for ownership checks
    user = serializers.ReadOnlyField(source='user.id') 
    
    # Override fields to make them optional on submission
    description = serializers.CharField(required=False, allow_blank=True)
    
    # Remove max_length here; let the model's CharField define it
    phone_number = serializers.CharField(required=False, allow_blank=True)
    
    address = serializers.CharField(required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)
    facebook_page = serializers.URLField(required=False, allow_blank=True)
    
    # File fields require only required=False
    logo = serializers.ImageField(required=False)
    cover_photo = serializers.ImageField(required=False)

    class Meta:
        model = BusinessProfile
        fields = '__all__'

# New serializer for user registration
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
    