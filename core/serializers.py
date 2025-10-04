from rest_framework import serializers
from .models import BusinessProfile, Product, InventoryAllocation
from django.contrib.auth import get_user_model

User = get_user_model() # Get the currently active user model

# ------------------------------------
# Updated Business Profile Serializer
# --------------------------------------
class BusinessProfileSerializer(serializers.ModelSerializer):
    # Use 'owner' if BusinessProfile links to User via 'owner' field, 
    # or 'user' if it links via 'user' field. Assuming 'user' from the fields list.
    user = serializers.ReadOnlyField(source='user.id') 
    
    logo_url = serializers.SerializerMethodField()
    cover_photo_url = serializers.SerializerMethodField()

    # NOTE: It's generally better to define required=False in Meta.extra_kwargs
    # but defining it here works for CharField and URLField.
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

    def get_logo_url(self, obj):
        if obj.logo:
            # Assumes Django's default storage URL system is configured
            return self.context['request'].build_absolute_uri(obj.logo.url)
        return None

    def get_cover_photo_url(self, obj):
        if obj.cover_photo:
            return self.context['request'].build_absolute_uri(obj.cover_photo.url)
        return None
    
# --------------------------------------
# New serializer for user registration (DRF/Djoser Compatible)
# --------------------------------------
class CustomUserSerializer(serializers.ModelSerializer):
    # Djoser handles password hashing during creation, so we just set write_only
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    # 🛑 CRITICAL FIX 🛑: The create/update methods provided in the original code 
    # are only necessary if you are *replacing* Djoser's User Create logic.
    # If you are using Djoser, these methods are best left out or customized carefully.
    # Removing them here to avoid conflicts with Djoser's core functionality.

# --------------------------------------
# Product Serializer (Focus)
# --------------------------------------
class ProductSerializer(serializers.ModelSerializer):
    # Field to display the name of the owning business
    business_name = serializers.CharField(source='business.business_name', read_only=True)

    # 🛑 FIX: The business field definition was duplicated and incorrect. 
    # We define it once and ensure it's read-only and not required.
    business = serializers.PrimaryKeyRelatedField(read_only=True) 

    class Meta:
        model = Product
        # Include business_name for display
        fields = '__all__' 
        # 🛑 FIX: Remove duplicate Meta class and correct extra_kwargs
        extra_kwargs = {
            # This is primarily for the create endpoint where the view assigns the business
            'business': {'required': False} 
        }
        # read_only_fields is fine here, but 'business' is implicitly read-only 
        # due to PrimaryKeyRelatedField(read_only=True).
        read_only_fields = ('business',)


# =========================================================================
# New: Inventory Allocation Serializer
# =========================================================================
class InventoryAllocationSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and viewing Inventory Allocation records.
    Used for tracking stock levels *for a specific showroom*.
    """
    # Use PrimaryKeyRelatedField for relationships
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        required=True
    )
    
    # Assuming receiving_business is the field name on the model
    receiving_business = serializers.PrimaryKeyRelatedField(
        queryset=BusinessProfile.objects.all(),
        required=True
    )

    class Meta:
        model = InventoryAllocation
        fields = [
            'id',
            'product', 
            'receiving_business', 
            'quantity_allocated',
            'quantity_remaining', # Read-only
            'sales_count', # Read-only
            'created_at', # Read-only
        ]
        read_only_fields = ('quantity_remaining', 'sales_count', 'created_at',)

    # Validation to ensure quantity is positive 
    def validate_quantity_allocated(self, value):
        if value <= 0:
            raise serializers.ValidationError("Allocation quantity must be greater than zero.")
        return value

# =========================================================================
# New: Showroom Inventory Serializer
# =========================================================================
class ShowroomInventorySerializer(serializers.ModelSerializer):
    """
    Used specifically for the dashboard list view (Read-only representation 
    of InventoryAllocation tailored for display).
    """
    product_name = serializers.CharField(source='product.name', read_only=True)
    # Assumes Product -> business -> business_name
    producer_name = serializers.CharField(source='product.business.business_name', read_only=True)
    sales_value = serializers.SerializerMethodField()
    
    class Meta:
        model = InventoryAllocation
        # Ensure correct Python indentation here
        fields = [
            'id', 
            'product_name', 
            'producer_name', 
            'quantity_allocated', 
            'quantity_remaining', 
            'sales_count', 
            'sales_value',
            'product', # Include the product ID for linking/navigation
        ]
    
    def get_sales_value(self, obj):
        # Assumes the Product model has a 'retail_price' field
        return obj.sales_count * obj.product.retail_price
    
