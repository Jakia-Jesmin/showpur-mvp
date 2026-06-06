from rest_framework import serializers
from django.utils import timezone
from django.db.models import Sum, Q
from apps.accounts.models import BusinessProfile
from apps.connections.models import Contact
from .models import (
    AcShowTransaction, AcShowCashPosition, QuickRecord,
    AcShowAlert, BusinessHealth,
)
from apps.ledger.serializers import AccountSerializer


# ============================================================
# TRANSACTION — LIST
# ============================================================

class AcShowTransactionListSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    account_display = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    days_overdue = serializers.IntegerField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True, default=None)

    class Meta:
        model = AcShowTransaction
        fields = [
            'id', 'transaction_type', 'transaction_type_display',
            'amount', 'description',
            'payment_method', 'payment_method_display',
            'cash_hand_amount', 'cash_bank_amount', 'credit_amount',
            'paid_amount', 'remaining_amount',
            'account', 'account_display',
            'party_name', 'party_type', 'contact',
            'product', 'product_name', 'quantity', 'sale_source',
            'status', 'status_display',
            'transaction_date', 'due_date',
            'is_overdue', 'days_overdue',
            'source', 'created_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'paid_amount', 'remaining_amount', 'credit_amount']

    def get_account_display(self, obj):
        if obj.account:
            return f"{obj.account.icon} {obj.account.name}"
        return ''


# ============================================================
# TRANSACTION — CREATE
# ============================================================

class AcShowTransactionCreateSerializer(serializers.ModelSerializer):
    save_as_draft = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = AcShowTransaction
        fields = [
            'transaction_type',
            'amount',
            'description',
            'account',
            'payment_method',
            'cash_hand_amount',
            'cash_bank_amount',
            'party_name',
            'party_phone',
            'party_type',
            'contact',
            'product',
            'quantity',
            'sale_source',
            'transaction_date',
            'due_date',
            'notes',
            'source',
            'is_recurring',
            'recurrence_pattern',
            'receipt_image',
            'save_as_draft',
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate(self, data):
        amount = data.get('amount', 0)
        cash_hand = data.get('cash_hand_amount', 0) or 0
        cash_bank = data.get('cash_bank_amount', 0) or 0

        if cash_hand + cash_bank > amount:
            raise serializers.ValidationError(
                "Cash amounts (hand + bank) cannot exceed total amount."
            )

        t_type = data.get('transaction_type', '')
        if t_type in ('receivable', 'payable', 'sale', 'purchase'):
            if not data.get('party_name') and not data.get('contact'):
                raise serializers.ValidationError({
                    'party_name': 'Party name or contact is required for this transaction type.'
                })

        # due_date required when there is a credit portion
        credit = amount - cash_hand - cash_bank
        if credit > 0 and not data.get('due_date'):
            raise serializers.ValidationError({
                'due_date': 'Due date is required when part of the amount is on credit.'
            })

        return data

    def create(self, validated_data):
        request = self.context['request']
        user = request.user
        try:
            business = user.profile
        except BusinessProfile.DoesNotExist:
            raise serializers.ValidationError("Business profile not found. Please complete your profile first.")

        save_as_draft = validated_data.pop('save_as_draft', False)
        initial_status = 'pending' if save_as_draft else ('approved' if user.can_self_approve else 'pending')

        return AcShowTransaction.objects.create(
            business=business,
            created_by=user,
            status=initial_status,
            **validated_data
        )


# ============================================================
# TRANSACTION — DETAIL
# ============================================================

class AcShowTransactionDetailSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    account_display = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    business_name = serializers.CharField(source='business.business_name', read_only=True)
    alerts = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    days_overdue = serializers.IntegerField(read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True, default=None)

    class Meta:
        model = AcShowTransaction
        exclude = []
        read_only_fields = ['id', 'business', 'created_by', 'created_at', 'updated_at',
                            'paid_amount', 'remaining_amount', 'credit_amount']

    def get_account_display(self, obj):
        if obj.account:
            return f"{obj.account.icon} {obj.account.name}"
        return ''

    def get_alerts(self, obj):
        alerts = obj.alerts.filter(is_archived=False)[:5]
        return AcShowAlertSerializer(alerts, many=True).data


# ============================================================
# STATUS UPDATE
# ============================================================

class TransactionStatusUpdateSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['complete', 'cancel', 'update_payment'])
    paid_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data['action'] == 'update_payment' and 'paid_amount' not in data:
            raise serializers.ValidationError({
                'paid_amount': 'paid_amount is required for update_payment action.'
            })
        return data


# ============================================================
# CASH POSITION
# ============================================================

class AcShowCashPositionSerializer(serializers.ModelSerializer):
    net_cash_flow = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    cash_position_status = serializers.CharField(read_only=True)

    class Meta:
        model = AcShowCashPosition
        fields = [
            'id', 'date',
            'opening_balance', 'total_cash_in', 'total_cash_out',
            'closing_balance', 'net_cash_flow',
            'cash_in_breakdown', 'cash_out_breakdown',
            'has_shortfall', 'shortfall_amount',
            'upcoming_payables', 'upcoming_receivables',
            'cash_position_status', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'closing_balance', 'created_at']


class CashPositionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcShowCashPosition
        fields = ['date', 'opening_balance', 'total_cash_in', 'total_cash_out',
                  'cash_in_breakdown', 'cash_out_breakdown', 'notes']

    def validate_date(self, value):
        business = self.context['request'].user.profile
        if self.instance is None:
            if AcShowCashPosition.objects.filter(business=business, date=value).exists():
                raise serializers.ValidationError("Cash position already exists for this date.")
        return value

    def create(self, validated_data):
        business = self.context['request'].user.profile
        pos = AcShowCashPosition.objects.create(business=business, **validated_data)
        pos.calculate_closing()
        pos.save()
        return pos


# ============================================================
# QUICK RECORD
# ============================================================

class QuickRecordSerializer(serializers.ModelSerializer):
    entry_type_display = serializers.CharField(source='get_entry_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = QuickRecord
        fields = [
            'id', 'entry_type', 'entry_type_display', 'amount', 'description',
            'cash_hand_amount', 'cash_bank_amount',
            'account', 'tag', 'party_name', 'is_paid', 'due_date',
            'contact', 'product', 'quantity', 'sale_source',
            'created_by_name', 'time_ago', 'created_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at) + " ago"

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def create(self, validated_data):
        request = self.context['request']
        user = request.user
        business = user.profile
        record = QuickRecord.objects.create(business=business, created_by=user, **validated_data)
        # Always create the backing transaction
        record.create_transaction()
        return record


# ============================================================
# ALERT
# ============================================================

class AcShowAlertSerializer(serializers.ModelSerializer):
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    is_actionable = serializers.SerializerMethodField()

    class Meta:
        model = AcShowAlert
        fields = [
            'id', 'alert_type', 'alert_type_display', 'priority', 'priority_display',
            'title', 'message', 'action_url', 'action_label',
            'is_read', 'is_actionable', 'related_transaction', 'time_ago', 'created_at',
        ]
        read_only_fields = ['id', 'business', 'created_at']

    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at) + " ago"

    def get_is_actionable(self, obj):
        return bool(obj.action_url and obj.action_label)


class AlertMarkReadSerializer(serializers.Serializer):
    alert_ids = serializers.ListField(child=serializers.UUIDField())

    def validate_alert_ids(self, value):
        if not value:
            raise serializers.ValidationError("At least one alert ID is required.")
        return value


# ============================================================
# BUSINESS HEALTH
# ============================================================

class BusinessHealthSerializer(serializers.ModelSerializer):
    health_status_display = serializers.CharField(source='get_health_status_display', read_only=True)
    profit_margin = serializers.SerializerMethodField()
    recommendations = serializers.SerializerMethodField()

    class Meta:
        model = BusinessHealth
        fields = [
            'health_status', 'health_status_display', 'health_score',
            'monthly_revenue', 'monthly_expenses', 'profit_margin',
            'collection_rate', 'cash_buffer_days',
            'due_pressure', 'payment_pressure', 'stock_pressure',
            'recommendations', 'last_calculated',
        ]

    def get_profit_margin(self, obj):
        if obj.monthly_revenue > 0:
            return round(((obj.monthly_revenue - obj.monthly_expenses) / obj.monthly_revenue) * 100, 2)
        return 0

    def get_recommendations(self, obj):
        recs = []
        if obj.collection_rate < 70:
            recs.append({'type': 'collection', 'priority': 'high',
                         'message': 'Follow up on overdue payments.',
                         'action_url': '/acshow/receivables'})
        if obj.cash_buffer_days < 14:
            recs.append({'type': 'cashflow', 'priority': 'high',
                         'message': 'Build cash reserves. Delay non-essential expenses.',
                         'action_url': '/acshow/cashflow'})
        if obj.payment_pressure > 3:
            recs.append({'type': 'payments', 'priority': 'high',
                         'message': 'Multiple payments due. Prioritize critical ones.',
                         'action_url': '/acshow/payables'})
        return recs


# ============================================================
# CONTACT
# ============================================================

class ContactSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    contact_type_display = serializers.CharField(source='get_contact_type_display', read_only=True)

    class Meta:
        model = Contact
        fields = [
            'id', 'contact_type', 'contact_type_display',
            'company_name', 'proprietor_name', 'business_address',
            'phone', 'email',
            'total_due', 'total_payable', 'is_active',
        ]
        read_only_fields = ['id', 'total_due', 'total_payable']

    def create(self, validated_data):
        business = self.context['request'].user.profile
        return Contact.objects.create(business=business, **validated_data)


# ============================================================
# DASHBOARD  (all 5 key metrics + 7-day forecast)
# ============================================================

def _sum(qs, field='amount'):
    return qs.aggregate(total=Sum(field))['total'] or 0


def compute_account_balances(business):
    """
    Returns running balances for Cash in Hand, Cash at Bank,
    Accounts Receivable, and Accounts Payable.
    Only 'approved' transactions affect cash balances.
    'pending' transactions with remaining_amount > 0 feed AR/AP.
    """
    approved = AcShowTransaction.objects.filter(business=business, status='approved')
    pending  = AcShowTransaction.objects.filter(business=business, status='pending')

    income_types  = ('income', 'sale', 'receivable')
    expense_types = ('expense', 'purchase', 'payable')

    cash_hand_in  = _sum(approved.filter(transaction_type__in=income_types),  'cash_hand_amount')
    cash_hand_out = _sum(approved.filter(transaction_type__in=expense_types), 'cash_hand_amount')
    cash_bank_in  = _sum(approved.filter(transaction_type__in=income_types),  'cash_bank_amount')
    cash_bank_out = _sum(approved.filter(transaction_type__in=expense_types), 'cash_bank_amount')

    # AR = all pending income-type amounts not yet collected (remaining_amount)
    ar_total = _sum(
        AcShowTransaction.objects.filter(
            business=business,
            transaction_type__in=income_types,
            remaining_amount__gt=0,
        ),
        'remaining_amount'
    )
    # AP = all pending expense-type amounts not yet paid (remaining_amount)
    ap_total = _sum(
        AcShowTransaction.objects.filter(
            business=business,
            transaction_type__in=expense_types,
            remaining_amount__gt=0,
        ),
        'remaining_amount'
    )

    return {
        'cash_in_hand': cash_hand_in - cash_hand_out,
        'cash_at_bank': cash_bank_in - cash_bank_out,
        'accounts_receivable': ar_total,
        'accounts_payable': ap_total,
    }


def compute_daily_pl(business, date=None):
    """Daily Profit & Loss for a given date (defaults to today)."""
    date = date or timezone.now().date()
    txns = AcShowTransaction.objects.filter(
        business=business, transaction_date=date, status='approved'
    )
    revenue = _sum(txns.filter(transaction_type__in=('income', 'sale')))
    cogs    = _sum(txns.filter(transaction_type='purchase'))
    opex    = _sum(txns.filter(transaction_type='expense'))
    gross_profit = revenue - cogs
    net_pl = gross_profit - opex
    return {
        'date': date,
        'revenue': revenue,
        'cogs': cogs,
        'gross_profit': gross_profit,
        'operating_expenses': opex,
        'net_pl': net_pl,
    }


def compute_daily_cash_position(business, date=None):
    """Today's cash position computed directly from approved transactions."""
    date = date or timezone.now().date()

    # Try stored snapshot first
    stored = AcShowCashPosition.objects.filter(business=business, date=date).first()
    if stored:
        return {
            'date': date,
            'opening_balance': stored.opening_balance,
            'cash_in': stored.total_cash_in,
            'cash_out': stored.total_cash_out,
            'closing_balance': stored.closing_balance,
            'status': stored.cash_position_status,
        }

    # Compute on the fly
    approved_today = AcShowTransaction.objects.filter(
        business=business, transaction_date=date, status='approved'
    )
    cash_in  = _sum(approved_today.filter(transaction_type__in=('income', 'sale', 'receivable')), 'cash_hand_amount') + \
               _sum(approved_today.filter(transaction_type__in=('income', 'sale', 'receivable')), 'cash_bank_amount')
    cash_out = _sum(approved_today.filter(transaction_type__in=('expense', 'purchase', 'payable')), 'cash_hand_amount') + \
               _sum(approved_today.filter(transaction_type__in=('expense', 'purchase', 'payable')), 'cash_bank_amount')

    # Previous day closing as opening
    yesterday = date - timezone.timedelta(days=1)
    prev = AcShowCashPosition.objects.filter(business=business, date=yesterday).first()
    opening = prev.closing_balance if prev else 0

    closing = opening + cash_in - cash_out
    return {
        'date': date,
        'opening_balance': opening,
        'cash_in': cash_in,
        'cash_out': cash_out,
        'closing_balance': closing,
        'status': 'danger' if closing < 0 else ('warning' if closing < 10000 else 'healthy'),
    }


def compute_7day_forecast(business):
    """Expected cash in/out for each of the next 7 days based on pending due dates."""
    today = timezone.now().date()
    forecast = []
    for i in range(7):
        date = today + timezone.timedelta(days=i)
        expected_in = _sum(
            AcShowTransaction.objects.filter(
                business=business,
                transaction_type__in=('receivable', 'sale', 'income'),
                due_date=date,
                status='pending',
                remaining_amount__gt=0,
            ),
            'remaining_amount'
        )
        expected_out = _sum(
            AcShowTransaction.objects.filter(
                business=business,
                transaction_type__in=('payable', 'purchase', 'expense'),
                due_date=date,
                status='pending',
                remaining_amount__gt=0,
            ),
            'remaining_amount'
        )
        forecast.append({
            'date': str(date),
            'expected_in': expected_in,
            'expected_out': expected_out,
            'net': expected_in - expected_out,
        })
    return forecast


class AcShowDashboardSerializer(serializers.Serializer):
    """
    Combines all 5 dashboard data blocks:
      1. Account balances  (Cash in Hand, Cash at Bank, AR, AP)
      2. Daily Cash Position
      3. Daily P&L
      4. Overdue summary
      5. 7-day Cashflow Forecast
    Plus recent transactions and unread alert count.
    """
    account_balances = serializers.DictField()
    daily_cash_position = serializers.DictField()
    daily_pl = serializers.DictField()
    overdue_receivables_count = serializers.IntegerField()
    overdue_receivables_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    overdue_payables_count = serializers.IntegerField()
    overdue_payables_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    cashflow_7day = serializers.ListField()
    recent_transactions = AcShowTransactionListSerializer(many=True)
    unread_alerts_count = serializers.IntegerField()
    quick_actions = serializers.ListField()

    @classmethod
    def build(cls, business):
        today = timezone.now().date()

        account_balances   = compute_account_balances(business)
        daily_cash         = compute_daily_cash_position(business, today)
        daily_pl           = compute_daily_pl(business, today)
        forecast           = compute_7day_forecast(business)

        # Overdue: pending transactions past due_date with outstanding balance
        overdue_recv = AcShowTransaction.objects.filter(
            business=business,
            transaction_type__in=('receivable', 'sale', 'income'),
            status='pending',
            remaining_amount__gt=0,
            due_date__lt=today,
        )
        overdue_pay = AcShowTransaction.objects.filter(
            business=business,
            transaction_type__in=('payable', 'purchase', 'expense'),
            status='pending',
            remaining_amount__gt=0,
            due_date__lt=today,
        )

        recent = AcShowTransaction.objects.filter(business=business).order_by('-created_at')[:10]
        unread = AcShowAlert.objects.filter(business=business, is_read=False, is_archived=False).count()

        return cls({
            'account_balances': account_balances,
            'daily_cash_position': daily_cash,
            'daily_pl': daily_pl,
            'overdue_receivables_count': overdue_recv.count(),
            'overdue_receivables_amount': _sum(overdue_recv, 'remaining_amount'),
            'overdue_payables_count': overdue_pay.count(),
            'overdue_payables_amount': _sum(overdue_pay, 'remaining_amount'),
            'cashflow_7day': forecast,
            'recent_transactions': recent,
            'unread_alerts_count': unread,
            'quick_actions': [
                {'type': 'sale',       'label': 'Record Sale',     'url': '/acshow/transactions?openType=sale'},
                {'type': 'purchase',   'label': 'Record Purchase', 'url': '/acshow/transactions?openType=purchase'},
                {'type': 'income',     'label': 'Receive Money',   'url': '/acshow/transactions?openType=income'},
                {'type': 'expense',    'label': 'Pay Expense',     'url': '/acshow/transactions?openType=expense'},
                {'type': 'receivable', 'label': 'Add Receivable',  'url': '/acshow/transactions?openType=receivable'},
                {'type': 'payable',    'label': 'Add Payable',     'url': '/acshow/transactions?openType=payable'},
            ],
        })
