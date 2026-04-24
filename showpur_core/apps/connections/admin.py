from django.contrib import admin
from .models import ConnectionRequest, Connection

class ConnectionRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'from_user', 'to_user', 'request_type', 'status', 'created_at')
    list_filter = ('status', 'request_type', 'created_at')
    search_fields = ('from_user__email', 'to_user__email', 'message')
    readonly_fields = ('created_at', 'updated_at', 'responded_at')
    
    fieldsets = (
        ('Users', {
            'fields': ('from_user', 'to_user')
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
    search_fields = ('producer__email', 'showroom__email')
    readonly_fields = ('started_at',)

admin.site.register(ConnectionRequest, ConnectionRequestAdmin)
admin.site.register(Connection, ConnectionAdmin)
