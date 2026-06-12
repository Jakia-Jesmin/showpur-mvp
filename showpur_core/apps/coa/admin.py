from django.contrib import admin
from .models import Account


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'account_type', 'business', 'is_default', 'icon', 'order')
    list_filter = ('account_type', 'is_default', 'is_active')
    search_fields = ('name', 'name_bn', 'business__business_name')
    ordering = ('business', 'order', 'name')
    fieldsets = (
        ('Basic Info', {'fields': ('business', 'name', 'name_bn', 'icon', 'account_code')}),
        ('Classification', {'fields': ('account_type', 'parent')}),
        ('Settings', {'fields': ('order', 'is_default', 'is_active')}),
    )
    readonly_fields = ('is_default',)

    def has_delete_permission(self, request, obj=None):
        if obj and obj.is_default:
            return False
        return True
