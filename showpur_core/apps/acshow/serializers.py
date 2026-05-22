# apps/acshow/serializers.py

from rest_framework import serializers
from django.utils import timezone
from django.db.models import Sum
from .models import (
    AcShowTransaction, 
    AcShowCashPosition, 
    QuickRecord,
    AcShowAlert,
    BusinessHealth,
    TransactionCategory
)
from apps.accounts.models import BusinessProfile


# ============================================
# TRANSACTION CATEGORY SERIALIZER
# ============================================

class TransactionCategorySerializer(serializers.ModelSerializer):
    """Simple serializer for category dropdown."""
    
    category_type_display = serializers.CharField(source='get_category_type_display', read_only=True)
    
    class Meta:
        model = TransactionCategory
        fields = ['id', 'name', 'name_bn', 'icon', 'category_type', 'category_type_display']
        read_only_fields = ['id']


# ============================================
# TRANSACTION SERIALIZERS
# ============================================

class AcShowTransactionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for transaction lists."""
    
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    days_overdue = serializers.IntegerField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = AcShowTransaction
        fields = [
            'id',
            'transaction_type',
            'transaction_type_display',
            'amount',
            'description',
            'transaction_category',
            'category_display',
            'party_name',
            'party_type',
            'status',
            'status_display',
            'transaction_date',
            'due_date',
            'is_overdue',
            'days_overdue',
            'paid_amount',
            'remaining_amount',
            'created_by_name',
            'source',
            'created_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at']
    
    def get_category_display(self, obj):
        if obj.transaction_category:
            return f"{obj.transaction_category.icon} {obj.transaction_category.name}"
        return ''


class AcShowTransactionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new transactions."""
    
    class Meta:
        model = AcShowTransaction
        fields = [
            'transaction_type',
            'amount',
            'description',
            'transaction_category',
            'party_name',
            'party_phone',
            'party_type',
            'transaction_date',
            'due_date',
            'paid_amount',
            'notes',
            'source',
            'is_recurring',
            'recurrence_pattern',
        ]
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value
    
    def validate_paid_amount(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Paid amount cannot be negative")
        return value
    
    def validate_due_date(self, value):
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Due date cannot be in the past")
        return value
    
    def validate(self, data):
        if data['transaction_type'] in ['receivable', 'payable']:
            if not data.get('due_date'):
                raise serializers.ValidationError({
                    'due_date': 'Due date is required for money to collect or pay'
                })
            if not data.get('party_name'):
                raise serializers.ValidationError({
                    'party_name': 'Party name is required for receivables and payables'
                })
        
        if data.get('paid_amount', 0) > data['amount']:
            raise serializers.ValidationError({
                'paid_amount': 'Paid amount cannot exceed total amount'
            })
        
        return data
    
    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        
        try:
            business = user.profile
        except BusinessProfile.DoesNotExist:
            raise serializers.ValidationError("Business profile not found")
        
        transaction = AcShowTransaction.objects.create(
            business=business,
            created_by=user,
            **validated_data
        )
        
        business.update_acshow_metrics()
        return transaction


class AcShowTransactionDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer for single transaction view."""
    
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    business_name = serializers.CharField(source='business.business_name', read_only=True)
    alerts = serializers.SerializerMethodField()
    linked_order_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = AcShowTransaction
        fields = '__all__'
        read_only_fields = ['id', 'business', 'created_by', 'created_at', 'updated_at']
    
    def get_category_display(self, obj):
        if obj.transaction_category:
            return f"{obj.transaction_category.icon} {obj.transaction_category.name}"
        return ''
    
    def get_alerts(self, obj):
        alerts = obj.alerts.filter(is_archived=False)[:5]
        return AcShowAlertSerializer(alerts, many=True).data
    
    def get_linked_order_summary(self, obj):
        if obj.linked_order:
            return {
                'order_id': str(obj.linked_order.id),
                'order_number': getattr(obj.linked_order, 'order_number', 'N/A'),
                'total_amount': getattr(obj.linked_order, 'total_amount', 0),
            }
        return None


class TransactionStatusUpdateSerializer(serializers.Serializer):
    """Simple serializer for updating transaction status."""
    
    action = serializers.ChoiceField(choices=['complete', 'cancel', 'update_payment'])
    paid_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    notes = serializers.CharField(required=False)
    
    def validate(self, data):
        if data['action'] == 'update_payment' and 'paid_amount' not in data:
            raise serializers.ValidationError({
                'paid_amount': 'Paid amount is required for payment update'
            })
        return data


# ============================================
# CASH POSITION SERIALIZERS
# ============================================

class AcShowCashPositionSerializer(serializers.ModelSerializer):
    """Serializer for daily cash position."""
    
    net_cash_flow = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    cash_position_status = serializers.CharField(read_only=True)
    opening_balance_formatted = serializers.SerializerMethodField()
    closing_balance_formatted = serializers.SerializerMethodField()
    net_cash_flow_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = AcShowCashPosition
        fields = [
            'id', 'date',
            'opening_balance', 'opening_balance_formatted',
            'total_cash_in', 'total_cash_out',
            'closing_balance', 'closing_balance_formatted',
            'net_cash_flow', 'net_cash_flow_formatted',
            'cash_in_breakdown', 'cash_out_breakdown',
            'has_shortfall', 'shortfall_amount',
            'upcoming_payables', 'upcoming_receivables',
            'cash_position_status', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'closing_balance', 'created_at']
    
    def get_opening_balance_formatted(self, obj):
        return f"৳{obj.opening_balance:,.2f}"
    
    def get_closing_balance_formatted(self, obj):
        return f"৳{obj.closing_balance:,.2f}"
    
    def get_net_cash_flow_formatted(self, obj):
        flow = obj.net_cash_flow
        if flow >= 0:
            return f"+৳{flow:,.2f}"
        return f"-৳{abs(flow):,.2f}"


class CashPositionCreateSerializer(serializers.ModelSerializer):
    """For creating or updating daily cash position."""
    
    class Meta:
        model = AcShowCashPosition
        fields = [
            'date', 'opening_balance', 'total_cash_in', 'total_cash_out',
            'cash_in_breakdown', 'cash_out_breakdown', 'notes',
        ]
    
    def validate_date(self, value):
        request = self.context.get('request')
        business = request.user.profile
        if self.instance is None:
            existing = AcShowCashPosition.objects.filter(business=business, date=value).exists()
            if existing:
                raise serializers.ValidationError("Cash position already exists for this date. Please update instead.")
        return value
    
    def create(self, validated_data):
        request = self.context.get('request')
        business = request.user.profile
        cash_position = AcShowCashPosition.objects.create(business=business, **validated_data)
        cash_position.calculate_closing()
        cash_position.save()
        return cash_position


# ============================================
# QUICK RECORD SERIALIZERS
# ============================================

class QuickRecordSerializer(serializers.ModelSerializer):
    """Ultra-simple serializer for daily entries."""
    
    entry_type_display = serializers.CharField(source='get_entry_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = QuickRecord
        fields = [
            'id', 'entry_type', 'entry_type_display', 'amount', 'description',
            'transaction_category', 'tag', 'party_name', 'is_paid', 'due_date',
            'created_by_name', 'time_ago', 'created_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at']
    
    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at) + " ago"
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value
    
    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        business = user.profile
        quick_record = QuickRecord.objects.create(business=business, created_by=user, **validated_data)
        if not validated_data.get('is_paid', True):
            quick_record.create_transaction()
        return quick_record


# ============================================
# ALERT SERIALIZERS
# ============================================

class AcShowAlertSerializer(serializers.ModelSerializer):
    """Serializer for business alerts."""
    
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    is_actionable = serializers.SerializerMethodField()
    
    class Meta:
        model = AcShowAlert
        fields = [
            'id', 'alert_type', 'alert_type_display', 'priority', 'priority_display',
            'title', 'message', 'action_url', 'action_label', 'is_read', 'is_actionable',
            'related_transaction', 'time_ago', 'created_at',
        ]
        read_only_fields = ['id', 'business', 'created_at']
    
    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at) + " ago"
    
    def get_is_actionable(self, obj):
        return bool(obj.action_url and obj.action_label)


class AlertMarkReadSerializer(serializers.Serializer):
    """Bulk mark alerts as read"""
    alert_ids = serializers.ListField(child=serializers.UUIDField(), required=True)
    
    def validate_alert_ids(self, value):
        if not value:
            raise serializers.ValidationError("At least one alert ID is required")
        return value


# ============================================
# BUSINESS HEALTH SERIALIZERS
# ============================================

class BusinessHealthSerializer(serializers.ModelSerializer):
    """Serializer for overall business health."""
    
    health_status_display = serializers.CharField(source='get_health_status_display', read_only=True)
    profit_margin = serializers.SerializerMethodField()
    cash_buffer_status = serializers.SerializerMethodField()
    collection_rate_status = serializers.SerializerMethodField()
    recommendations = serializers.SerializerMethodField()
    
    class Meta:
        model = BusinessHealth
        fields = [
            'health_status', 'health_status_display', 'health_score',
            'monthly_revenue', 'monthly_expenses', 'profit_margin',
            'collection_rate', 'collection_rate_status',
            'cash_buffer_days', 'cash_buffer_status',
            'due_pressure', 'payment_pressure', 'stock_pressure',
            'recommendations', 'last_calculated',
        ]
    
    def get_profit_margin(self, obj):
        if obj.monthly_revenue > 0:
            profit = obj.monthly_revenue - obj.monthly_expenses
            return round((profit / obj.monthly_revenue) * 100, 2)
        return 0
    
    def get_cash_buffer_status(self, obj):
        if obj.cash_buffer_days >= 30:
            return {'status': 'good', 'label': '✅ Strong', 'message': 'Over 30 days of cash buffer'}
        elif obj.cash_buffer_days >= 14:
            return {'status': 'okay', 'label': '👍 Adequate', 'message': '2 weeks of cash available'}
        elif obj.cash_buffer_days >= 7:
            return {'status': 'warning', 'label': '⚠️ Low', 'message': 'Less than 1 week of cash'}
        else:
            return {'status': 'critical', 'label': '🚨 Critical', 'message': 'Immediate action needed'}
    
    def get_collection_rate_status(self, obj):
        if obj.collection_rate >= 90:
            return {'status': 'good', 'label': '✅ Excellent', 'message': 'Most payments collected on time'}
        elif obj.collection_rate >= 70:
            return {'status': 'okay', 'label': '👍 Good', 'message': 'Room for improvement'}
        elif obj.collection_rate >= 50:
            return {'status': 'warning', 'label': '⚠️ Poor', 'message': 'Many overdue payments'}
        else:
            return {'status': 'critical', 'label': '🚨 Critical', 'message': 'Most payments are overdue'}
    
    def get_recommendations(self, obj):
        recommendations = []
        if obj.collection_rate < 70:
            recommendations.append({
                'type': 'collection', 'priority': 'high',
                'message': 'Follow up on overdue payments.',
                'action': 'View pending collections', 'action_url': '/acshow/receivables'
            })
        if obj.cash_buffer_days < 14:
            recommendations.append({
                'type': 'cashflow', 'priority': 'high',
                'message': 'Build cash reserves. Delay non-essential expenses.',
                'action': 'Review cashflow', 'action_url': '/acshow/cashflow'
            })
        if obj.payment_pressure > 3:
            recommendations.append({
                'type': 'payments', 'priority': 'high',
                'message': 'Multiple payments due. Prioritize critical ones.',
                'action': 'View upcoming payments', 'action_url': '/acshow/payables'
            })
        return recommendations


# ============================================
# DASHBOARD SUMMARY SERIALIZER
# ============================================

class AcShowDashboardSerializer(serializers.Serializer):
    """Main dashboard serializer combining all data."""
    
    today_cash = serializers.DecimalField(max_digits=12, decimal_places=2)
    today_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    today_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_collections = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_payments = serializers.DecimalField(max_digits=12, decimal_places=2)
    overdue_count = serializers.IntegerField()
    low_stock_count = serializers.IntegerField()
    health_score = serializers.IntegerField()
    health_status = serializers.CharField()
    recent_transactions = AcShowTransactionListSerializer(many=True)
    urgent_alerts = AcShowAlertSerializer(many=True)
    quick_actions = serializers.ListField()
    cash_forecast = serializers.DictField()
    
    @classmethod
    def build_dashboard(cls, business):
        today = timezone.now().date()
        
        cash_position, _ = AcShowCashPosition.objects.get_or_create(
            business=business, date=today,
            defaults={'opening_balance': cls._get_previous_closing(business, today)}
        )
        
        today_transactions = AcShowTransaction.objects.filter(business=business, transaction_date=today)
        today_income = today_transactions.filter(transaction_type='income').aggregate(total=Sum('amount'))['total'] or 0
        today_expenses = today_transactions.filter(transaction_type='expense').aggregate(total=Sum('amount'))['total'] or 0
        
        pending_collections = AcShowTransaction.objects.filter(
            business=business, transaction_type='receivable', status__in=['pending', 'overdue']
        ).aggregate(total=Sum('remaining_amount'))['total'] or 0
        
        pending_payments = AcShowTransaction.objects.filter(
            business=business, transaction_type='payable', status__in=['pending', 'overdue']
        ).aggregate(total=Sum('remaining_amount'))['total'] or 0
        
        overdue_count = AcShowTransaction.objects.filter(business=business, status='overdue').count()
        health, _ = BusinessHealth.objects.get_or_create(business=business)
        recent = AcShowTransaction.objects.filter(business=business).order_by('-created_at')[:5]
        alerts = AcShowAlert.objects.filter(business=business, is_read=False, priority__in=['high', 'medium']).order_by('-created_at')[:5]
        
        return cls({
            'today_cash': cash_position.closing_balance,
            'today_income': today_income,
            'today_expenses': today_expenses,
            'pending_collections': pending_collections,
            'pending_payments': pending_payments,
            'overdue_count': overdue_count,
            'low_stock_count': 0,
            'health_score': health.health_score,
            'health_status': health.get_health_status_display(),
            'recent_transactions': recent,
            'urgent_alerts': alerts,
            'quick_actions': cls._get_quick_actions(),
            'cash_forecast': cls._get_7day_forecast(business),
        })
    
    @staticmethod
    def _get_previous_closing(business, date):
        yesterday = date - timezone.timedelta(days=1)
        try:
            return AcShowCashPosition.objects.get(business=business, date=yesterday).closing_balance
        except AcShowCashPosition.DoesNotExist:
            return 0
    
    @staticmethod
    def _get_quick_actions():
        return [
            {'type': 'collection', 'label': '💵 Receive Money', 'icon': 'money'},
            {'type': 'payment', 'label': '💸 Pay Supplier', 'icon': 'payment'},
            {'type': 'sale', 'label': '🛒 Record Sale', 'icon': 'cart'},
            {'type': 'purchase', 'label': '📦 Record Purchase', 'icon': 'package'},
            {'type': 'expense', 'label': '🧾 Add Expense', 'icon': 'receipt'},
        ]
    
    @staticmethod
    def _get_7day_forecast(business):
        today = timezone.now().date()
        forecast = {}
        for i in range(7):
            date = today + timezone.timedelta(days=i)
            expected_in = AcShowTransaction.objects.filter(
                business=business, transaction_type='receivable',
                due_date=date, status__in=['pending', 'overdue']
            ).aggregate(total=Sum('remaining_amount'))['total'] or 0
            expected_out = AcShowTransaction.objects.filter(
                business=business, transaction_type='payable',
                due_date=date, status__in=['pending', 'overdue']
            ).aggregate(total=Sum('remaining_amount'))['total'] or 0
            forecast[str(date)] = {'expected_in': expected_in, 'expected_out': expected_out, 'net': expected_in - expected_out}
        return forecast
    