from decimal import Decimal
from django.db import transaction as db_transaction
from django.utils import timezone

from ..models import AcShowTransaction, AcShowCashPosition, OwnerWithdrawal


def _get_or_create_today_position(business):
    today = timezone.now().date()
    pos, _ = AcShowCashPosition.objects.get_or_create(
        business=business,
        date=today,
        defaults={
            'opening_balance': Decimal('0'),
            'total_cash_in':   Decimal('0'),
            'total_cash_out':  Decimal('0'),
            'closing_balance': Decimal('0'),
        },
    )
    return pos


def record_sale_financials(display_request, sales_revenue, cost_amount, recorded_by):
    """
    Write the financial side of a showroom sale.

    Revenue is recognised immediately (cash basis assumed for showroom channel).
    cost_amount (COGS) is stored on the transaction for gross profit queries.
    The sale is auto-approved because it originates from a trusted service call.
    """
    business = display_request.product.owner.businessprofile

    with db_transaction.atomic():
        txn = AcShowTransaction.objects.create(
            business=business,
            created_by=recorded_by,
            transaction_type='sale',
            amount=sales_revenue,
            cost_amount=cost_amount,
            description=f"Sale: {display_request.product.name} (display #{display_request.pk})",
            cash_hand_amount=Decimal('0'),
            cash_bank_amount=Decimal('0'),
            product=display_request.product,
            sale_source='showroom',
            source='showpur',
            transaction_date=timezone.now().date(),
            status='approved',
        )
        # credit_amount = sales_revenue (cash to be collected from showroom later)
        # The .save() in AcShowTransaction recalculates this automatically.

        return txn


def record_collection_payment(receivable, amount, payment_method, recorded_by):
    """
    Record a cash collection against an outstanding receivable transaction.

    payment_method: 'CASH' | 'BANK'

    Updates the original receivable's paid amounts (reducing remaining_amount),
    logs a separate collection transaction so today's collection figure is
    queryable by date, and updates the daily CashPosition.
    """
    paid = Decimal(str(amount))
    if paid <= 0:
        raise ValueError("Collection amount must be positive.")

    outstanding = receivable.remaining_amount or Decimal('0')
    if paid > outstanding:
        raise ValueError(
            f"Collecting {paid} exceeds outstanding balance of {outstanding}."
        )

    business = receivable.business

    with db_transaction.atomic():
        # Reduce the outstanding balance on the original receivable
        if payment_method == 'BANK':
            receivable.cash_bank_amount = (receivable.cash_bank_amount or Decimal('0')) + paid
        else:
            receivable.cash_hand_amount = (receivable.cash_hand_amount or Decimal('0')) + paid
        receivable.save()  # save() recalculates remaining_amount and credit_amount

        # Log the inflow as a dated collection transaction for pulse queries
        cash_hand = paid if payment_method == 'CASH' else Decimal('0')
        cash_bank = paid if payment_method == 'BANK' else Decimal('0')

        AcShowTransaction.objects.create(
            business=business,
            created_by=recorded_by,
            transaction_type='income',
            amount=paid,
            cost_amount=Decimal('0'),
            description=f"Collection from {receivable.party_name or 'customer'}",
            cash_hand_amount=cash_hand,
            cash_bank_amount=cash_bank,
            contact=receivable.contact,
            party_name=receivable.party_name,
            party_type=receivable.party_type,
            source='collection',
            transaction_date=timezone.now().date(),
            status='approved',
        )

        # Update daily cash position
        pos = _get_or_create_today_position(business)
        pos.total_cash_in += paid
        pos.calculate_closing()
        pos.save(update_fields=[
            'total_cash_in', 'closing_balance',
            'has_shortfall', 'shortfall_amount', 'updated_at',
        ])


def record_owner_withdrawal(business_profile, amount, source, withdrawn_by, reason=''):
    """
    Log cash taken out by the business owner and deduct from today's CashPosition.

    source: 'CASH' | 'BANK'
    """
    amount = Decimal(str(amount))
    if amount <= 0:
        raise ValueError("Withdrawal amount must be positive.")

    with db_transaction.atomic():
        OwnerWithdrawal.objects.create(
            business=business_profile,
            amount=amount,
            source=source,
            withdrawn_by=withdrawn_by,
            reason=reason,
        )

        pos = _get_or_create_today_position(business_profile)
        pos.total_cash_out += amount
        pos.calculate_closing()
        pos.save(update_fields=[
            'total_cash_out', 'closing_balance',
            'has_shortfall', 'shortfall_amount', 'updated_at',
        ])
