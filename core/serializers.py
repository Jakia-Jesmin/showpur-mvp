from rest_framework import serializers
from .models import BusinessProfile, Product, InventoryAllocation
from django.contrib.auth import get_user_model

User = get_user_model() # Get the currently active user model

# ------------------------------------
# Updated Business Profile Serializer
# --------------------------------------
class BusinessProfileSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.id') 
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    role = serializers.ChoiceField(
        choices=BusinessProfile.ROLE_CHOICES, # Assuming you defined ROLE_OPTIONS in your model
        required=True,
        help_text="The role of the business: PRODUCER or STORE."
    )
    logo_url = serializers.SerializerMethodField()
    cover_photo_url = serializers.SerializerMethodField()
    description = serializers.CharField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)
    facebook_page = serializers.URLField(required=False, allow_blank=True)
    logo = serializers.ImageField(max_length=None, use_url=True)
    cover_photo = serializers.ImageField(max_length=None, use_url=True)

    class Meta:
        model = BusinessProfile
        fields = '__all__'
        read_only_fields = ('user', 'user_id', 'created_at', 'updated_at', 'logo_url', 'cover_photo_url')

    def create(self, validated_data):
        # We assume the 'user' field is passed via context/perform_create in the viewset
        # Check if a profile already exists for the user (to prevent multiple profiles, if that is the business rule)
        user = validated_data.get('user', None)
        if user and BusinessProfile.objects.filter(user=user).exists():
             raise serializers.ValidationError("This user already has a business profile.")
             
        return BusinessProfile.objects.create(**validated_data)
        
    def get_logo_url(self, obj):
        request = self.context.get('request')
        if request and obj.logo and hasattr(obj.logo, 'url'):
            return request.build_absolute_uri(obj.logo.url)
        return None

    def get_cover_photo_url(self, obj):
        request = self.context.get('request')
        if request and obj.cover_photo and hasattr(obj.cover_photo, 'url'):
            return request.build_absolute_uri(obj.cover_photo.url)
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

# --------------------------------------
# Product Serializer (Focus)
# --------------------------------------
class ProductSerializer(serializers.ModelSerializer):
    # Field to display the name of the owning business
    business_name = serializers.CharField(source='business.business_name', read_only=True)

    # New Read-Only URL Field
    product_image_url = serializers.SerializerMethodField() 

    class Meta:
        model = Product
        # Include business_name for display
        fields = '__all__' 
        read_only_fields = ('business', 'product_image_url')
        extra_kwargs = {
             # Assuming 'business' is the field name on the Product model
             'business': {'required': False} 
        }
        
    def get_product_image_url(self, obj):
        if obj.product_image:
            # Returns the absolute URL for the image
            return self.context['request'].build_absolute_uri(obj.product_image.url)
        return None

# =========================================================================
# New: Inventory Allocation Serializer
# =========================================================================
class InventoryAllocationSerializer(serializers.ModelSerializer):
    """
    Serializer for creating (Push/Request) and viewing Inventory Allocation records.
    Uses 'sender' and 'receiver' fields.
    """
    # Read-only fields for displaying the names
    sender_name = serializers.CharField(source='sender.business_name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.business_name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    # Writeable fields required from the client for creation
    receiver = serializers.PrimaryKeyRelatedField(
        queryset=BusinessProfile.objects.all(),
        required=True
    )
    product = serializers.PrimaryKeyRelatedField( # 🛑 Incorporate product definition from the conflicting section 🛑
        queryset=Product.objects.all(),
        required=True
    )

    class Meta:
        model = InventoryAllocation
        fields = [
            'id', 
            'sender',               # Read-only, set by view
            'receiver',             # Writable, required from client
            'product',              # Writable, required from client
            'quantity_allocated',   # Writable, required from client
            'status',               # Read-only, set by view
            'created_at',         # Read-only
            'quantity_remaining',   # Read-only (if on model)
            'sales_count',          # Read-only (if on model)
            'sender_name', 
            'receiver_name', 
            'product_name'
        ]
        # 🛑 Ensure all read-only fields are listed once 🛑
        read_only_fields = [
            'id', 
            'sender',
            'status', 
            'created_at',
            'quantity_remaining', 
            'sales_count',
            'sender_name', 
            'receiver_name',
            'product_name' 
        ]

    # Validation for quantity must be placed here
    def validate_quantity_allocated(self, value):
        if value <= 0:
            raise serializers.ValidationError("Allocation quantity must be greater than zero.")
        return value

    def validate(self, data):
        """
        Custom validation to ensure the roles of the sender (current user) and receiver are appropriate.
        """
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError("Request context is missing.")
            
        try:
            sender_profile = request.user.business_profile
        except AttributeError:
            raise serializers.ValidationError({"detail": "Sender user has no associated business profile."})

        receiver_profile = data.get('receiver')
        product = data.get('product')

        if sender_profile == receiver_profile:
            raise serializers.ValidationError("A business cannot allocate inventory to itself.")

        # Role-Based Validation
        if sender_profile.role == 'PRODUCER':
            if receiver_profile.role != 'STORE':
                raise serializers.ValidationError({"receiver": "A Producer can only send inventory to a Store."})
            if product.business != sender_profile:
                raise serializers.ValidationError({"product": "This product does not belong to your Producer profile."})
                
        elif sender_profile.role == 'STORE':
            if receiver_profile.role != 'PRODUCER':
                raise serializers.ValidationError({"receiver": "A Store can only request inventory from a Producer."})
            if product.business != receiver_profile:
                raise serializers.ValidationError({"product": "The requested product does not belong to the designated Producer."})

        return data  

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