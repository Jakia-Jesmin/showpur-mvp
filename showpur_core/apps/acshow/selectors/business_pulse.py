from decimal import Decimal
from django.db.models import Sum
from django.utils import timezone

from ..models import AcShowTransaction
from showpur_core.apps.products.models import DisplayRequest


INCOME_TYPES  = ('income', 'sale', 'receivable')
EXPENSE_TYPES = ('expense', 'purchase', 'payable')

# DisplayRequest statuses that mean "inventory is still sitting at a showroom"
OUTSTANDING_STATUSES = ('dispatched', 'received', 'active')


def _d(value):
    """Coerce None from aggregate to Decimal zero."""
    return value if value is not None else Decimal('0')


def _sum(qs, field='amount'):
    return _d(qs.aggregate(total=Sum(field))['total'])


def get_daily_business_pulse(business_profile):
    """
    Return the 5 critical numbers for today.

    All figures are Decimal; the view serialises them to strings for JSON.
    """
    today = timezone.now().date()
    approved = AcShowTransaction.objects.filter(
        business=business_profile, status='approved'
    )

    # ── Cash available (all-time net liquid cash) ─────────────────────────
    # Capital-account transactions are already captured in EXPENSE_TYPES cash flows,
    # so no separate withdrawal deduction is needed here.
    income_hand   = _sum(approved.filter(transaction_type__in=INCOME_TYPES),  'cash_hand_amount')
    expense_hand  = _sum(approved.filter(transaction_type__in=EXPENSE_TYPES), 'cash_hand_amount')
    income_bank   = _sum(approved.filter(transaction_type__in=INCOME_TYPES),  'cash_bank_amount')
    expense_bank  = _sum(approved.filter(transaction_type__in=EXPENSE_TYPES), 'cash_bank_amount')

    cash_hand      = income_hand - expense_hand
    bank_balance   = income_bank - expense_bank
    cash_available = cash_hand + bank_balance

    # ── Today's sales (revenue recognised today) ──────────────────────────
    todays_txns = approved.filter(transaction_date=today)
    sales_today = todays_txns.filter(transaction_type='sale')

    todays_sales        = _sum(sales_today, 'amount')
    todays_cogs         = _sum(sales_today, 'cost_amount')
    todays_gross_profit = todays_sales - todays_cogs

    # ── Today's collections (cash received against outstanding receivables) ─
    todays_collection = _sum(
        todays_txns.filter(transaction_type='income', source='collection'),
        'amount',
    )

    # ── Today's owner withdrawals ─────────────────────────────────────────
    # A withdrawal is any approved payment to an account of type 'capital'.
    todays_withdrawal = _sum(
        todays_txns.filter(account__account_type='capital'),
        'amount',
    )

    return {
        'date':                 today,
        'cash_available':       cash_available,
        'cash_hand':            cash_hand,
        'bank_balance':         bank_balance,
        'todays_sales':         todays_sales,
        'todays_gross_profit':  todays_gross_profit,
        'todays_collection':    todays_collection,
        'todays_withdrawal':    todays_withdrawal,
        'net_cash_change':      todays_collection - todays_withdrawal,
    }


def get_inventory_quality_report(business_profile):
    """
    Classify all outstanding showroom inventory by how long it has been sitting.

    Age is calculated from received_at (preferred) or dispatched_at.
    Inventory value = (quantity_dispatched - quantity_sold) × wholesale_price.

    Buckets:
        HEALTHY   0–30 days
        WATCH    31–60 days
        RISK     61–90 days
        DEAD     90+  days
    """
    today = timezone.now().date()

    # Only products owned by this business
    outstanding = DisplayRequest.objects.filter(
        product__owner=business_profile.user,
        status__in=OUTSTANDING_STATUSES,
    ).select_related('product')

    buckets = {
        'HEALTHY':    Decimal('0'),
        'WATCH':      Decimal('0'),
        'RISK':       Decimal('0'),
        'DEAD_STOCK': Decimal('0'),
    }
    items = []

    for dr in outstanding:
        age_date = dr.received_at or dr.dispatched_at
        if age_date is None:
            continue

        age_days = (today - age_date.date()).days
        dispatched = dr.quantity_dispatched or dr.accepted_quantity or 0
        remaining_qty = max(0, dispatched - dr.quantity_sold)
        wp = dr.wholesale_price or Decimal('0')
        value = Decimal(str(remaining_qty)) * wp

        if age_days <= 30:
            bucket = 'HEALTHY'
        elif age_days <= 60:
            bucket = 'WATCH'
        elif age_days <= 90:
            bucket = 'RISK'
        else:
            bucket = 'DEAD_STOCK'

        buckets[bucket] += value
        items.append({
            'display_request_id': dr.pk,
            'product':            dr.product.name,
            'showroom':           str(dr.showroom),
            'age_days':           age_days,
            'remaining_qty':      remaining_qty,
            'wholesale_price':    wp,
            'value':              value,
            'bucket':             bucket,
            'status':             dr.status,
        })

    total = sum(buckets.values())
    return {
        'total_inventory_value': total,
        'healthy_value':         buckets['HEALTHY'],
        'watch_value':           buckets['WATCH'],
        'risk_value':            buckets['RISK'],
        'dead_stock_value':      buckets['DEAD_STOCK'],
        'items':                 items,
    }


def get_receivables_aging_report(business_profile):
    """
    Bucket outstanding receivables by how overdue they are (based on due_date).

    Buckets: current (not yet due), 1-30, 31-60, 61-90, 90+ days overdue.
    """
    today = timezone.now().date()

    outstanding = AcShowTransaction.objects.filter(
        business=business_profile,
        transaction_type__in=('receivable', 'sale', 'income'),
        remaining_amount__gt=0,
    )

    buckets = {
        'current':  Decimal('0'),
        '1_30':     Decimal('0'),
        '31_60':    Decimal('0'),
        '61_90':    Decimal('0'),
        '90_plus':  Decimal('0'),
    }

    for txn in outstanding:
        bal = txn.remaining_amount or Decimal('0')
        if not txn.due_date or txn.due_date >= today:
            buckets['current'] += bal
        else:
            overdue_days = (today - txn.due_date).days
            if overdue_days <= 30:
                buckets['1_30'] += bal
            elif overdue_days <= 60:
                buckets['31_60'] += bal
            elif overdue_days <= 90:
                buckets['61_90'] += bal
            else:
                buckets['90_plus'] += bal

    return {
        'total_outstanding': sum(buckets.values()),
        'current':           buckets['current'],
        'overdue_1_30':      buckets['1_30'],
        'overdue_31_60':     buckets['31_60'],
        'overdue_61_90':     buckets['61_90'],
        'overdue_90_plus':   buckets['90_plus'],
    }
