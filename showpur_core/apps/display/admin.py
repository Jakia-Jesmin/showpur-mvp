from django.contrib import admin
from .models import DisplayAgreement, InventoryTransaction, InventoryAuditLog

class InventoryTransactionInline(admin.TabularInline):
    model = InventoryTransaction
    extra = 0
    readonly_fields = ['created_at']

@admin.register(DisplayAgreement)
class DisplayAgreementAdmin(admin.ModelAdmin):
    list_display = ['agreement_number', 'product', 'showroom', 'status', 'start_date', 'end_date', 'units_sold']
    list_filter = ['status', 'fee_type', 'start_date', 'end_date']
    search_fields = ['agreement_number', 'product__name', 'showroom__email']
    readonly_fields = ['agreement_number', 'created_at', 'updated_at']
    inlines = [InventoryTransactionInline]

@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ['display_agreement', 'transaction_type', 'quantity', 'amount', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['display_agreement__agreement_number', 'notes']

@admin.register(InventoryAuditLog)
class InventoryAuditLogAdmin(admin.ModelAdmin):
    list_display = ['display_agreement', 'previous_status', 'new_status', 'changed_by', 'changed_at']
    list_filter = ['changed_at']