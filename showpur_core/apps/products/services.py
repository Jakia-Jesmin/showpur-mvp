from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError

from .models import DisplayRequest, ShowroomStock, StockLedgerEntry


def record_showroom_sale(display_request, quantity, recorded_by):
    """
    Record a sale from a showroom display unit.

    Deducts from reserved stock, updates quantity_sold on the request,
    updates ShowroomStock, writes an immutable StockLedgerEntry, and
    calls the financial layer to record revenue and COGS.
    """
    with transaction.atomic():
        dispatched = display_request.quantity_dispatched or display_request.accepted_quantity or 0
        remaining = dispatched - display_request.quantity_sold
        if quantity <= 0 or quantity > remaining:
            raise ValidationError(
                f"Cannot sell {quantity} unit(s); {remaining} unit(s) available on this request."
            )

        if not display_request.retail_price or not display_request.wholesale_price:
            raise ValidationError(
                "DisplayRequest must have retail_price and wholesale_price set before recording a sale."
            )

        product = display_request.product

        # Units leave reserved_showroom — they are now sold (no longer held anywhere)
        product.reserved_showroom = max(0, product.reserved_showroom - quantity)
        product.save(update_fields=['reserved_showroom', 'updated_at'])

        # Track how many units have been sold on this request
        display_request.quantity_sold += quantity
        if display_request.quantity_sold >= dispatched:
            display_request.status = DisplayRequest.STATUS_SOLD
        display_request.save(update_fields=['quantity_sold', 'status'])

        # Keep ShowroomStock in sync
        showroom_stock, _ = ShowroomStock.objects.get_or_create(
            display_request=display_request,
            defaults={
                'product': product,
                'showroom': display_request.showroom,
                'quantity_received': dispatched,
            },
        )
        showroom_stock.quantity_sold += quantity
        showroom_stock.save(update_fields=['quantity_sold', 'updated_at'])

        # Immutable audit entry
        StockLedgerEntry.objects.create(
            product=product,
            entry_type=StockLedgerEntry.TYPE_SALE,
            qty=-quantity,
            display_request=display_request,
            actor=recorded_by,
            note=f"Showroom sale: {quantity} unit(s) via display request #{display_request.pk}",
        )

        # Financial write
        sales_revenue = Decimal(str(quantity)) * display_request.retail_price
        cost_amount   = Decimal(str(quantity)) * display_request.wholesale_price

        from showpur_core.apps.acshow.services.ledger_core import record_sale_financials
        record_sale_financials(display_request, sales_revenue, cost_amount, recorded_by)
