from django.utils import timezone
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, BusinessProfile

class CustomUserAdmin(UserAdmin):
    list_display = ('id', 'email', 'username', 'role', 'phone', 'acshow_enabled', 'email_verified', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff', 'email_verified', 'created_at')
    search_fields = ('email', 'username', 'phone')
    ordering = ('-created_at',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'email_verified')}),
        ('AcShow Access', {
            'fields': ('acshow_enabled', 'acshow_trial_start', 'acshow_trial_end', 'acshow_onboarding_completed'),
            'classes': ('collapse',),
            'description': 'Control access to AcShow financial tools'
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'email')}),
    )

class BusinessProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'business_name', 'user', 'location', 'followers_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('business_name', 'user__email', 'location')
    readonly_fields = ('followers_count', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'business_name', 'bio', 'logo', 'cover_image')
        }),
        ('Contact Information', {
            'fields': ('website', 'location', 'address')
        }),
        ('Social', {
            'fields': ('followers',)
        }),
        ('Showroom Specific', {
            'fields': ('shelf_price_per_month', 'commission_rate', 'available_shelf_space'),
            'classes': ('collapse',)
        }),
        ('Producer Specific', {
            'fields': ('product_categories', 'minimum_order_quantity'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def followers_count(self, obj):
        return obj.followers.count()
    followers_count.short_description = 'Followers Count'

# Register models
admin.site.register(User, CustomUserAdmin)
admin.site.register(BusinessProfile, BusinessProfileAdmin)