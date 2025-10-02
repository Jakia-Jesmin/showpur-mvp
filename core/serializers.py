# core/serializers.py

from rest_framework import serializers
from .models import InventoryAllocation, Product, BusinessProfile
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model

# Updated Business Profile Serializer
class BusinessProfileSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.id') 
    
    description = serializers.CharField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)
    facebook_page = serializers.URLField(required=False, allow_blank=True)
    
    logo = serializers.ImageField(required=False)
    cover_photo = serializers.ImageField(required=False)

    class Meta:
        model = BusinessProfile
        fields = '__all__'
        read_only_fields = ('user', 'created_at',)

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
    
# 🛑 CORRECT PLACEMENT: ShowroomInventorySerializer at the top level 🛑
class ShowroomInventorySerializer(serializers.ModelSerializer):
    # 👇 All fields must be indented once (4 spaces)
    product_name = serializers.CharField(source='product.name', read_only=True)
    producer_name = serializers.CharField(source='product.business.business_name', read_only=True)
    sales_value = serializers.SerializerMethodField()
    
    class Meta:
        # 👇 Meta class contents must be indented twice (8 spaces)
        model = InventoryAllocation
        fields = [
            'id', 
            'product_name', 
            'producer_name', 
            'quantity_allocated', 
            'quantity_remaining', 
            'sales_count', 
            'sales_value',
            'product',
        ]
    
    def get_sales_value(self, obj):
        # 👇 Method contents must be indented twice (8 spaces)
        return obj.sales_count * obj.product.retail_price
    
    # --- Product Serializer (Focus) ---

class ProductSerializer(serializers.ModelSerializer):
    # Use read_only=True and required=False since the business ID 
    # will be injected automatically by the ViewSet based on the logged-in user.
    business = serializers.PrimaryKeyRelatedField(read_only=True) 

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('business',)