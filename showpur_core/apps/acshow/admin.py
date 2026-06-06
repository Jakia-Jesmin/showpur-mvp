# showpur_core/apps/acshow/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import (
    AcShowTransaction,
    AcShowCashPosition,
    QuickRecord,
    AcShowAlert,
    BusinessHealth,
)


@admin.register(AcShowTransaction)
class AcShowTransactionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'business', 'transaction_type_badge', 'amount_display',
        'party_name', 'approval_status_badge', 'transaction_date', 'due_date',
        'created_by', 'approved_by'
    ]
    list_filter = [
        'transaction_type', 'status', 'transaction_category', 'party_type',
        'transaction_date', 'due_date'
    ]
    actions = ['approve_transactions', 'reject_transactions']

    @admin.action(description='Approve selected transactions')
    def approve_transactions(self, request, queryset):
        updated = queryset.filter(status='pending').update(
            status='approved', approved_by=request.user
        )
        self.message_user(request, f'{updated} transaction(s) approved.')

    @admin.action(description='Reject selected transactions')
    def reject_transactions(self, request, queryset):
        updated = queryset.filter(status='pending').update(
            status='rejected', rejected_by=request.user
        )
        self.message_user(request, f'{updated} transaction(s) rejected.')
    search_fields = [
        'party_name', 'description', 'business__business_name',
        'business__user__email'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-transaction_date', '-created_at']
    
    fieldsets = (
        ('Transaction Info', {
            'fields': ('id', 'business', 'created_by')
        }),
        ('Details', {
            'fields': (
                'transaction_type', 'amount', 'paid_amount',
                'remaining_amount', 'description', 'transaction_category'
            )
        }),
        ('Party', {
            'fields': ('party_name', 'party_phone', 'party_type', 'linked_producer')
        }),
        ('Dates & Status', {
            'fields': ('transaction_date', 'due_date', 'status')
        }),
        ('Maker-Checker', {
            'fields': ('approved_by', 'rejected_by', 'rejection_reason', 'edited_by'),
        }),
        ('Additional', {
            'fields': ('notes', 'receipt_image', 'is_recurring', 'recurrence_pattern'),
            'classes': ('collapse',)
        }),
    )
    
    def transaction_type_badge(self, obj):
        colors = {
            'income': 'green',
            'expense': 'red',
            'receivable': 'orange',
            'payable': 'blue',
        }
        color = colors.get(obj.transaction_type, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_transaction_type_display()
        )
    transaction_type_badge.short_description = 'Type'
    
    def amount_display(self, obj):
         return format_html('<b>৳{}</b>', f"{obj.amount:,.2f}")
    amount_display.short_description = 'Amount'
    amount_display.admin_order_field = 'amount'
    
    def approval_status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'approved': 'green',
            'rejected': 'red',
            'pending_edit': 'purple',
        }
        return format_html(
            '<span style="background-color:{};color:white;padding:2px 8px;'
            'border-radius:10px;font-size:12px">{}</span>',
            colors.get(obj.status, 'gray'), obj.get_status_display()
        )
    approval_status_badge.short_description = 'Approval'
@admin.register(AcShowCashPosition)
class AcShowCashPositionAdmin(admin.ModelAdmin):
    list_display = [
        'business', 'date', 'opening_balance_display',
        'total_cash_in_display', 'total_cash_out_display',
        'closing_balance_display', 'net_flow_display'
    ]
    list_filter = ['date', 'has_shortfall']
    search_fields = ['business__business_name', 'notes']
    ordering = ['-date']
    
    def opening_balance_display(self, obj):
        return format_html('৳{:,}', obj.opening_balance)
    
    def total_cash_in_display(self, obj):
        return format_html(
            '<span style="color: green;">+৳{:,}</span>', obj.total_cash_in
        )
    
    def total_cash_out_display(self, obj):
        return format_html(
            '<span style="color: red;">-৳{:,}</span>', obj.total_cash_out
        )
    
    def closing_balance_display(self, obj):
        return format_html('<b>৳{:,}</b>', obj.closing_balance)
    
    def net_flow_display(self, obj):
        net = obj.total_cash_in - obj.total_cash_out
        color = 'green' if net >= 0 else 'red'
        return format_html(
            '<span style="color: {};">{}{:,}</span>',
            color, '+' if net >= 0 else '', net
        )
    
    # Short descriptions
    opening_balance_display.short_description = 'Opening'
    total_cash_in_display.short_description = 'Cash In'
    total_cash_out_display.short_description = 'Cash Out'
    closing_balance_display.short_description = 'Closing'
    net_flow_display.short_description = 'Net Flow'


@admin.register(QuickRecord)
class QuickRecordAdmin(admin.ModelAdmin):
    list_display = [
        'business', 'entry_type_badge', 'amount_display',
        'description_preview', 'party_name', 'created_at'
    ]
    list_filter = ['entry_type', 'created_at']
    search_fields = ['party_name', 'description', 'business__business_name']
    ordering = ['-created_at']
    
    def entry_type_badge(self, obj):
        return format_html('<b>{}</b>', obj.get_entry_type_display())
    entry_type_badge.short_description = 'Type'
    
    def amount_display(self, obj):
        return format_html('৳{:,}', obj.amount)
    amount_display.short_description = 'Amount'
    
    def description_preview(self, obj):
        return obj.description[:50] + '...' if len(obj.description) > 50 else obj.description
    description_preview.short_description = 'Description'


@admin.register(AcShowAlert)
class AcShowAlertAdmin(admin.ModelAdmin):
    list_display = [
        'business', 'alert_type', 'priority_badge', 'title',
        'is_read', 'created_at'
    ]
    list_filter = ['alert_type', 'priority', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'business__business_name']
    ordering = ['-created_at']
    actions = ['mark_as_read']
    
    def priority_badge(self, obj):
        colors = {'high': 'red', 'medium': 'orange', 'low': 'green'}
        color = colors.get(obj.priority, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 10px; font-size: 12px;">{}</span>',
            color,
            obj.get_priority_display()
        )
    priority_badge.short_description = 'Priority'
    
    @admin.action(description='Mark selected alerts as read')
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} alerts marked as read.')


@admin.register(BusinessHealth)
class BusinessHealthAdmin(admin.ModelAdmin):
    list_display = [
        'business', 'health_status_badge', 'health_score_color',
        'monthly_revenue_display', 'collection_rate_display',
        'cash_buffer_days', 'last_calculated'
    ]
    search_fields = ['business__business_name']
    readonly_fields = ['last_calculated', 'created_at']
    
    def health_status_badge(self, obj):
        colors = {
            'healthy': 'green',
            'caution': 'orange',
            'critical': 'red',
        }
        color = colors.get(obj.health_status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 12px; '
            'border-radius: 12px; font-weight: bold;">{}</span>',
            color,
            obj.get_health_status_display()
        )
    health_status_badge.short_description = 'Status'
    
    def health_score_color(self, obj):
        color = (
            'green' if obj.health_score >= 80
            else 'orange' if obj.health_score >= 50
            else 'red'
        )
        return format_html(
            '<span style="color: {}; font-weight: bold; font-size: 16px;">{}</span>',
            color, obj.health_score
        )
    health_score_color.short_description = 'Score'
    
    def monthly_revenue_display(self, obj):
        return format_html('৳{:,}', obj.monthly_revenue)
    monthly_revenue_display.short_description = 'Monthly Revenue'
    
    def collection_rate_display(self, obj):
        color = 'green' if obj.collection_rate >= 80 else 'orange' if obj.collection_rate >= 50 else 'red'
        return format_html(
            '<span style="color: {};">{}%</span>', color, obj.collection_rate
        )
    collection_rate_display.short_description = 'Collection Rate'
    