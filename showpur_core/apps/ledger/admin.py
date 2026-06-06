from django.contrib import admin
from django.utils.html import format_html
from .models import Account


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'icon', 'name', 'name_bn', 'account_type_badge',
        'account_code', 'parent', 'business', 'is_default', 'is_active', 'order',
    ]
    list_filter = ['account_type', 'is_default', 'is_active', 'business']
    search_fields = ['name', 'name_bn', 'account_code', 'business__business_name']
    ordering = ['business', 'account_type', 'order', 'name']
    list_editable = ['order', 'is_active']
    actions = ['activate', 'deactivate']

    fieldsets = (
        ('Account Info', {
            'fields': ('business', 'name', 'name_bn', 'icon', 'account_code')
        }),
        ('Classification', {
            'fields': ('account_type', 'parent', 'order')
        }),
        ('Flags', {
            'fields': ('is_default', 'is_active')
        }),
    )

    def account_type_badge(self, obj):
        colors = {
            'income':     'green',
            'expense':    'red',
            'cash_bank':  'blue',
            'receivable': 'orange',
            'payable':    'purple',
        }
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;font-size:12px">{}</span>',
            colors.get(obj.account_type, 'gray'),
            obj.get_account_type_display()
        )
    account_type_badge.short_description = 'Type'

    @admin.action(description='Activate selected accounts')
    def activate(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description='Deactivate selected accounts')
    def deactivate(self, request, queryset):
        queryset.filter(is_default=False).update(is_active=False)
        self.message_user(request, 'System default accounts cannot be deactivated.')
