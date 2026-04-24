from django.contrib import admin
from django.utils import timezone
from .models import Category, Product, ProductImage, ProductReview

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

class ProductReviewInline(admin.TabularInline):
    model = ProductReview
    extra = 0
    readonly_fields = ['user', 'rating', 'comment']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent', 'is_active', 'created_at']
    list_filter = ['is_active', 'parent']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'price', 'stock_quantity', 'is_active', 'is_approved', 'created_at']
    list_filter = ['is_active', 'is_approved', 'condition', 'category', 'created_at']
    search_fields = ['name', 'description', 'owner__email']
    readonly_fields = ['slug', 'created_at', 'updated_at']
    inlines = [ProductImageInline, ProductReviewInline]
    
    actions = ['approve_products', 'feature_products']
    
    def approve_products(self, request, queryset):
        queryset.update(is_approved=True, approved_at=timezone.now())
    approve_products.short_description = "Approve selected products"
    
    def feature_products(self, request, queryset):
        queryset.update(is_featured=True)
    feature_products.short_description = "Feature selected products"

@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'is_approved', 'created_at']
    list_filter = ['rating', 'is_approved', 'created_at']
    search_fields = ['product__name', 'user__email', 'comment']
    actions = ['approve_reviews']
    
    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)
    approve_reviews.short_description = "Approve selected reviews"