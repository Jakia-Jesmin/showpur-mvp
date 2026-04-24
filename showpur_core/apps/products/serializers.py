from rest_framework import serializers
from django.utils.text import slugify
from .models import Category, Product, ProductImage, ProductReview

class CategorySerializer(serializers.ModelSerializer):
    subcategory_count = serializers.IntegerField(source='subcategories.count', read_only=True)
    product_count = serializers.IntegerField(source='products.count', read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'parent', 'subcategory_count', 'product_count', 'is_active', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'order', 'is_primary']

class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.profile.business_name', read_only=True)
    user_avatar = serializers.ImageField(source='user.profile.logo', read_only=True)
    
    class Meta:
        model = ProductReview
        fields = ['id', 'user', 'user_name', 'user_avatar', 'rating', 'title', 'comment', 'is_verified_purchase', 'helpful_count', 'created_at']
        read_only_fields = ['id', 'user', 'created_at', 'helpful_count']

class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    owner_name = serializers.CharField(source='owner.profile.business_name', read_only=True)
    owner_logo = serializers.ImageField(source='owner.profile.logo', read_only=True)
    main_image_url = serializers.ImageField(source='main_image', read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.IntegerField(source='reviews.count', read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'description', 'price', 'main_image_url', 'category_name', 'owner_name', 'owner_logo', 'average_rating', 'review_count', 'created_at']
    
    def get_average_rating(self, obj):
        reviews = obj.reviews.filter(is_approved=True)
        if reviews.exists():
            return sum(r.rating for r in reviews) / reviews.count()
        return 0

class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
    owner_name = serializers.CharField(source='owner.profile.business_name', read_only=True)
    owner_logo = serializers.ImageField(source='owner.profile.logo', read_only=True)
    owner_location = serializers.CharField(source='owner.profile.location', read_only=True)
    images = ProductImageSerializer(source='product_images', many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    available_quantity = serializers.IntegerField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['id', 'slug', 'owner', 'created_at', 'updated_at', 'approved_at']
    
    def get_average_rating(self, obj):
        reviews = obj.reviews.filter(is_approved=True)
        if reviews.exists():
            return sum(r.rating for r in reviews) / reviews.count()
        return 0
    
    def create(self, validated_data):
        category_id = validated_data.pop('category_id')
        validated_data['category_id'] = category_id
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)

class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['name', 'description', 'short_description', 'price', 'wholesale_price', 
                  'category', 'main_image', 'dimensions', 'weight', 'color', 'material',
                  'stock_quantity', 'condition', 'preferred_display_fee', 'min_commission_rate',
                  'meta_title', 'meta_description', 'meta_keywords']
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
    