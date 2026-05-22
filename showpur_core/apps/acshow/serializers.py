# apps/acshow/serializers.py

from rest_framework import serializers
from django.utils import timezone
from django.db.models import Sum
from .models import (
    AcShowTransaction, 
    AcShowCashPosition, 
    QuickRecord,
    AcShowAlert,
    BusinessHealth
)
from apps.accounts.models import BusinessProfile


# ============================================
# TRANSACTION SERIALIZERS
# ============================================

class AcShowTransactionListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for transaction lists.
    
    Used for:
    - Dashboard recent transactions
    - Transaction history page
    - Search results
    """
    
    transaction_type_display = serializers.CharField(
        source='get_transaction_type_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    category_display = serializers.CharField(
        source='get_category_display',
        read_only=True
    )
    is_overdue = serializers.BooleanField(read_only=True)
    days_overdue = serializers.IntegerField(read_only=True)
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    
    class Meta:
        model = AcShowTransaction
        fields = [
            'id',
            'transaction_type',
            'transaction_type_display',
            'amount',
            'description',
            'category',
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
            'created_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at']


class AcShowTransactionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new transactions.
    
    Business Logic:
    - Auto-sets business and creator from request
    - Validates amounts and dates
    - Handles both simple and detailed entries
    """
    
    class Meta:
        model = AcShowTransaction
        fields = [
            'transaction_type',
            'amount',
            'description',
            'category',
            'party_name',
            'party_phone',
            'party_type',
            'transaction_date',
            'due_date',
            'paid_amount',
            'notes',
            'is_recurring',
            'recurrence_pattern',
        ]
    
    def validate_amount(self, value):
        """Ensure amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value
    
    def validate_paid_amount(self, value):
        """Ensure paid amount is not negative"""
        if value < 0:
            raise serializers.ValidationError("Paid amount cannot be negative")
        return value
    
    def validate_due_date(self, value):
        """Ensure due date is not in the past for new transactions"""
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Due date cannot be in the past")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # For receivable/payable, due date is required
        if data['transaction_type'] in ['receivable', 'payable']:
            if not data.get('due_date'):
                raise serializers.ValidationError({
                    'due_date': 'Due date is required for money to collect or pay'
                })
            if not data.get('party_name'):
                raise serializers.ValidationError({
                    'party_name': 'Party name is required for receivables and payables'
                })
        
        # Paid amount can't exceed total amount
        if data.get('paid_amount', 0) > data['amount']:
            raise serializers.ValidationError({
                'paid_amount': 'Paid amount cannot exceed total amount'
            })
        
        return data
    
    def create(self, validated_data):
        """Create transaction with business and creator context"""
        request = self.context.get('request')
        user = request.user
        
        # Get business profile
        try:
            business = user.profile
        except BusinessProfile.DoesNotExist:
            raise serializers.ValidationError("Business profile not found")
        
        # Create transaction
        transaction = AcShowTransaction.objects.create(
            business=business,
            created_by=user,
            **validated_data
        )
        
        # Update business metrics
        business.update_acshow_metrics()
        
        return transaction


class AcShowTransactionDetailSerializer(serializers.ModelSerializer):
    """
    Full detail serializer for single transaction view.
    Includes related alerts and linked orders.
    """
    
    transaction_type_display = serializers.CharField(
        source='get_transaction_type_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    category_display = serializers.CharField(
        source='get_category_display',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    business_name = serializers.CharField(
        source='business.business_name',
        read_only=True
    )
    
    # Related alerts
    alerts = serializers.SerializerMethodField()
    
    # Linked order info
    linked_order_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = AcShowTransaction
        fields = '__all__'
        read_only_fields = ['id', 'business', 'created_by', 'created_at', 'updated_at']
    
    def get_alerts(self, obj):
        """Get related alerts for this transaction"""
        alerts = obj.alerts.filter(is_archived=False)[:5]
        return AcShowAlertSerializer(alerts, many=True).data
    
    def get_linked_order_summary(self, obj):
        """Get linked Showpur order summary if exists"""
        if obj.linked_order:
            return {
                'order_id': str(obj.linked_order.id),
                'order_number': obj.linked_order.order_number,
                'total_amount': obj.linked_order.total_amount,
            }
        return None


class TransactionStatusUpdateSerializer(serializers.Serializer):
    """
    Simple serializer for updating transaction status.
    
    Common SME actions:
    - Mark as completed when payment done
    - Cancel a transaction
    - Update paid amount
    """
    
    action = serializers.ChoiceField(
        choices=['complete', 'cancel', 'update_payment']
    )
    paid_amount = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        required=False
    )
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
    """
    Serializer for daily cash position.
    
    Business Logic:
    - Shows cash health at a glance
    - Includes breakdowns and alerts
    - Used for dashboard and reports
    """
    
    net_cash_flow = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        read_only=True
    )
    cash_position_status = serializers.CharField(read_only=True)
    
    # Formatted amounts for display
    opening_balance_formatted = serializers.SerializerMethodField()
    closing_balance_formatted = serializers.SerializerMethodField()
    net_cash_flow_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = AcShowCashPosition
        fields = [
            'id',
            'date',
            'opening_balance',
            'opening_balance_formatted',
            'total_cash_in',
            'total_cash_out',
            'closing_balance',
            'closing_balance_formatted',
            'net_cash_flow',
            'net_cash_flow_formatted',
            'cash_in_breakdown',
            'cash_out_breakdown',
            'has_shortfall',
            'shortfall_amount',
            'upcoming_payables',
            'upcoming_receivables',
            'cash_position_status',
            'notes',
            'created_at',
        ]
        read_only_fields = [
            'id', 'closing_balance', 'created_at'
        ]
    
    def get_opening_balance_formatted(self, obj):
        """Format for display"""
        return f"৳{obj.opening_balance:,.2f}"
    
    def get_closing_balance_formatted(self, obj):
        """Format for display"""
        return f"৳{obj.closing_balance:,.2f}"
    
    def get_net_cash_flow_formatted(self, obj):
        """Format with sign"""
        flow = obj.net_cash_flow
        if flow >= 0:
            return f"+৳{flow:,.2f}"
        return f"-৳{abs(flow):,.2f}"


class CashPositionCreateSerializer(serializers.ModelSerializer):
    """
    For creating or updating daily cash position.
    
    Usually done at end of day by SME owner
    """
    
    class Meta:
        model = AcShowCashPosition
        fields = [
            'date',
            'opening_balance',
            'total_cash_in',
            'total_cash_out',
            'cash_in_breakdown',
            'cash_out_breakdown',
            'notes',
        ]
    
    def validate_date(self, value):
        """Ensure no duplicate entries for same day"""
        request = self.context.get('request')
        business = request.user.profile
        
        if self.instance is None:  # Creation only
            existing = AcShowCashPosition.objects.filter(
                business=business,
                date=value
            ).exists()
            if existing:
                raise serializers.ValidationError(
                    "Cash position already exists for this date. Please update instead."
                )
        return value
    
    def create(self, validated_data):
        request = self.context.get('request')
        business = request.user.profile
        
        cash_position = AcShowCashPosition.objects.create(
            business=business,
            **validated_data
        )
        cash_position.calculate_closing()
        cash_position.save()
        
        return cash_position


# ============================================
# QUICK RECORD SERIALIZERS
# ============================================

class QuickRecordSerializer(serializers.ModelSerializer):
    """
    Ultra-simple serializer for daily entries.
    
    Design Philosophy:
    - Minimal fields
    - Clear labels
    - One-click creation
    """
    
    entry_type_display = serializers.CharField(
        source='get_entry_type_display',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = QuickRecord
        fields = [
            'id',
            'entry_type',
            'entry_type_display',
            'amount',
            'description',
            'tag',
            'party_name',
            'is_paid',
            'due_date',
            'created_by_name',
            'time_ago',
            'created_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at']
    
    def get_time_ago(self, obj):
        """Human-readable time"""
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
        
        # Create quick record
        quick_record = QuickRecord.objects.create(
            business=business,
            created_by=user,
            **validated_data
        )
        
        # Optionally create full transaction
        if not validated_data.get('is_paid', True):
            quick_record.create_transaction()
        
        return quick_record


# ============================================
# ALERT SERIALIZERS
# ============================================

class AcShowAlertSerializer(serializers.ModelSerializer):
    """
    Serializer for business alerts.
    
    Shown in:
    - Dashboard notification bell
    - Alert center
    - Mobile push notifications
    """
    
    alert_type_display = serializers.CharField(
        source='get_alert_type_display',
        read_only=True
    )
    priority_display = serializers.CharField(
        source='get_priority_display',
        read_only=True
    )
    time_ago = serializers.SerializerMethodField()
    is_actionable = serializers.SerializerMethodField()
    
    class Meta:
        model = AcShowAlert
        fields = [
            'id',
            'alert_type',
            'alert_type_display',
            'priority',
            'priority_display',
            'title',
            'message',
            'action_url',
            'action_label',
            'is_read',
            'is_actionable',
            'related_transaction',
            'time_ago',
            'created_at',
        ]
        read_only_fields = ['id', 'business', 'created_at']
    
    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at) + " ago"
    
    def get_is_actionable(self, obj):
        """Can user take action on this alert?"""
        return bool(obj.action_url and obj.action_label)


class AlertMarkReadSerializer(serializers.Serializer):
    """Bulk mark alerts as read"""
    alert_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=True
    )
    
    def validate_alert_ids(self, value):
        if not value:
            raise serializers.ValidationError("At least one alert ID is required")
        return value


# ============================================
# BUSINESS HEALTH SERIALIZERS
# ============================================

class BusinessHealthSerializer(serializers.ModelSerializer):
    """
    Serializer for overall business health.
    
    Shows:
    - Health score (0-100)
    - Key metrics
    - Pressure indicators
    - Trends
    """
    
    health_status_display = serializers.CharField(
        source='get_health_status_display',
        read_only=True
    )
    
    # Computed fields
    profit_margin = serializers.SerializerMethodField()
    cash_buffer_status = serializers.SerializerMethodField()
    collection_rate_status = serializers.SerializerMethodField()
    
    # Recommendations
    recommendations = serializers.SerializerMethodField()
    
    class Meta:
        model = BusinessHealth
        fields = [
            'health_status',
            'health_status_display',
            'health_score',
            'monthly_revenue',
            'monthly_expenses',
            'profit_margin',
            'collection_rate',
            'collection_rate_status',
            'cash_buffer_days',
            'cash_buffer_status',
            'due_pressure',
            'payment_pressure',
            'stock_pressure',
            'recommendations',
            'last_calculated',
        ]
    
    def get_profit_margin(self, obj):
        """Calculate profit margin"""
        if obj.monthly_revenue > 0:
            profit = obj.monthly_revenue - obj.monthly_expenses
            margin = (profit / obj.monthly_revenue) * 100
            return round(margin, 2)
        return 0
    
    def get_cash_buffer_status(self, obj):
        """Status based on cash buffer days"""
        if obj.cash_buffer_days >= 30:
            return {'status': 'good', 'label': '✅ Strong', 'message': 'You have over 30 days of cash buffer'}
        elif obj.cash_buffer_days >= 14:
            return {'status': 'okay', 'label': '👍 Adequate', 'message': '2 weeks of cash available'}
        elif obj.cash_buffer_days >= 7:
            return {'status': 'warning', 'label': '⚠️ Low', 'message': 'Less than 1 week of cash'}
        else:
            return {'status': 'critical', 'label': '🚨 Critical', 'message': 'Immediate action needed'}
    
    def get_collection_rate_status(self, obj):
        """Status based on collection rate"""
        if obj.collection_rate >= 90:
            return {'status': 'good', 'label': '✅ Excellent', 'message': 'Most payments collected on time'}
        elif obj.collection_rate >= 70:
            return {'status': 'okay', 'label': '👍 Good', 'message': 'Room for improvement'}
        elif obj.collection_rate >= 50:
            return {'status': 'warning', 'label': '⚠️ Poor', 'message': 'Many overdue payments'}
        else:
            return {'status': 'critical', 'label': '🚨 Critical', 'message': 'Most payments are overdue'}
    
    def get_recommendations(self, obj):
        """Generate actionable recommendations"""
        recommendations = []
        
        if obj.collection_rate < 70:
            recommendations.append({
                'type': 'collection',
                'priority': 'high',
                'message': 'Follow up on overdue payments. Send reminders to customers.',
                'action': 'View pending collections',
                'action_url': '/acshow/collections'
            })
        
        if obj.cash_buffer_days < 14:
            recommendations.append({
                'type': 'cashflow',
                'priority': 'high',
                'message': 'Build cash reserves. Delay non-essential expenses.',
                'action': 'Review cashflow',
                'action_url': '/acshow/cashflow'
            })
        
        if obj.stock_pressure > 5:
            recommendations.append({
                'type': 'inventory',
                'priority': 'medium',
                'message': f'{obj.stock_pressure} items are low in stock. Reorder soon.',
                'action': 'Check inventory',
                'action_url': '/acshow/inventory'
            })
        
        if obj.payment_pressure > 3:
            recommendations.append({
                'type': 'payments',
                'priority': 'high',
                'message': 'Multiple payments due. Prioritize critical ones.',
                'action': 'View upcoming payments',
                'action_url': '/acshow/payables'
            })
        
        return recommendations


# ============================================
# DASHBOARD SUMMARY SERIALIZER
# ============================================

class AcShowDashboardSerializer(serializers.Serializer):
    """
    Main dashboard serializer combining all data.
    
    What SME owners see when they open AcShow:
    1. Today's cash position
    2. Urgent actions needed
    3. Quick overview cards
    4. Recent transactions
    """
    
    # Today's summary
    today_cash = serializers.DecimalField(max_digits=12, decimal_places=2)
    today_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    today_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    
    # Pending items
    pending_collections = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_payments = serializers.DecimalField(max_digits=12, decimal_places=2)
    
    # Counts
    overdue_count = serializers.IntegerField()
    low_stock_count = serializers.IntegerField()
    
    # Business health
    health_score = serializers.IntegerField()
    health_status = serializers.CharField()
    
    # Recent activity
    recent_transactions = AcShowTransactionListSerializer(many=True)
    
    # Urgent alerts
    urgent_alerts = AcShowAlertSerializer(many=True)
    
    # Quick actions available
    quick_actions = serializers.ListField()
    
    # 7-day forecast
    cash_forecast = serializers.DictField()
    
    @classmethod
    def build_dashboard(cls, business):
        """
        Build complete dashboard data for a business.
        
        This is the main method called by the dashboard view.
        """
        today = timezone.now().date()
        
        # Get or create today's cash position
        cash_position, created = AcShowCashPosition.objects.get_or_create(
            business=business,
            date=today,
            defaults={
                'opening_balance': cls._get_previous_closing(business, today)
            }
        )
        
        # Get today's transactions
        today_transactions = AcShowTransaction.objects.filter(
            business=business,
            transaction_date=today
        )
        
        today_income = today_transactions.filter(
            transaction_type='income'
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        today_expenses = today_transactions.filter(
            transaction_type='expense'
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Get pending items
        pending_collections = AcShowTransaction.objects.filter(
            business=business,
            transaction_type='receivable',
            status__in=['pending', 'overdue']
        ).aggregate(
            total=Sum('remaining_amount')
        )['total'] or 0
        
        pending_payments = AcShowTransaction.objects.filter(
            business=business,
            transaction_type='payable',
            status__in=['pending', 'overdue']
        ).aggregate(
            total=Sum('remaining_amount')
        )['total'] or 0
        
        # Get overdue count
        overdue_count = AcShowTransaction.objects.filter(
            business=business,
            status='overdue'
        ).count()
        
        # Get or create health record
        health, created = BusinessHealth.objects.get_or_create(
            business=business
        )
        
        # Get recent transactions
        recent = AcShowTransaction.objects.filter(
            business=business
        ).order_by('-created_at')[:5]
        
        # Get urgent alerts
        alerts = AcShowAlert.objects.filter(
            business=business,
            is_read=False,
            priority__in=['high', 'medium']
        ).order_by('-created_at')[:5]
        
        return cls({
            'today_cash': cash_position.closing_balance,
            'today_income': today_income,
            'today_expenses': today_expenses,
            'pending_collections': pending_collections,
            'pending_payments': pending_payments,
            'overdue_count': overdue_count,
            'low_stock_count': cls._get_low_stock_count(business),
            'health_score': health.health_score,
            'health_status': health.get_health_status_display(),
            'recent_transactions': recent,
            'urgent_alerts': alerts,
            'quick_actions': cls._get_quick_actions(),
            'cash_forecast': cls._get_7day_forecast(business),
        })
    
    @staticmethod
    def _get_previous_closing(business, date):
        """Get closing balance from previous day"""
        yesterday = date - timezone.timedelta(days=1)
        try:
            prev = AcShowCashPosition.objects.get(business=business, date=yesterday)
            return prev.closing_balance
        except AcShowCashPosition.DoesNotExist:
            return 0
    
    @staticmethod
    def _get_low_stock_count(business):
        """Get count of low stock items"""
        # Will be implemented with inventory module
        return 0
    
    @staticmethod
    def _get_quick_actions():
        """Available quick actions"""
        return [
            {'type': 'collection', 'label': '💰 Record Collection', 'icon': 'money'},
            {'type': 'payment', 'label': '💸 Record Payment', 'icon': 'payment'},
            {'type': 'sale', 'label': '🛒 Record Sale', 'icon': 'cart'},
            {'type': 'expense', 'label': '🧾 Record Expense', 'icon': 'receipt'},
        ]
    
    @staticmethod
    def _get_7day_forecast(business):
        """Simple 7-day cash forecast"""
        today = timezone.now().date()
        forecast = {}
        
        for i in range(7):
            date = today + timezone.timedelta(days=i)
            
            # Expected collections
            expected_in = AcShowTransaction.objects.filter(
                business=business,
                transaction_type='receivable',
                due_date=date,
                status__in=['pending', 'overdue']
            ).aggregate(
                total=Sum('remaining_amount')
            )['total'] or 0
            
            # Expected payments
            expected_out = AcShowTransaction.objects.filter(
                business=business,
                transaction_type='payable',
                due_date=date,
                status__in=['pending', 'overdue']
            ).aggregate(
                total=Sum('remaining_amount')
            )['total'] or 0
            
            forecast[str(date)] = {
                'expected_in': expected_in,
                'expected_out': expected_out,
                'net': expected_in - expected_out,
            }
        
        return forecast