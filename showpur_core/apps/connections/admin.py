from django.contrib import admin
from .models import ConnectionRequest, Connection, Contact

class ConnectionRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'from_business', 'to_business', 'request_type', 'status', 'created_at')
    list_filter = ('status', 'request_type', 'created_at')
    search_fields = ('from_business__business_name', 'to_business__business_name', 'message')
    readonly_fields = ('created_at', 'updated_at', 'responded_at')
    
    fieldsets = (
        ('Businesses', {
            'fields': ('from_business', 'to_business')
        }),
        ('Request Details', {
            'fields': ('request_type', 'status', 'message', 'terms_conditions')
        }),
        ('Proposal', {
            'fields': ('suggested_product_ids', 'proposed_duration_days', 'proposed_fee')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'responded_at', 'expires_at')
        }),
    )

class ConnectionAdmin(admin.ModelAdmin):
    list_display = ('id', 'producer', 'showroom', 'is_active', 'started_at', 'ended_at')
    list_filter = ('is_active', 'started_at')
    search_fields = ('producer__business_name', 'showroom__business_name')
    readonly_fields = ('started_at',)

class ContactAdmin(admin.ModelAdmin):
    list_display = ('id', 'company_name', 'contact_type', 'phone', 'total_due', 'total_payable', 'is_active')
    list_filter = ('contact_type', 'is_active')
    search_fields = ('company_name', 'phone', 'email', 'proprietor_name')

admin.site.register(ConnectionRequest, ConnectionRequestAdmin)
admin.site.register(Connection, ConnectionAdmin)
admin.site.register(Contact, ContactAdmin)