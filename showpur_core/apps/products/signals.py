"""
signals.py — Auto stock management

Every stock movement goes through these signals so Product.stock_quantity,
reserved_showroom, and reserved_dropship are always up to date.
The StockLedgerEntry is the source of truth; the Product fields are
fast-read denormalised caches recomputed here on every relevant save.

Wire up in apps.py:
    def ready(self):
        import products.signals  # noqa
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from django.db.models import F

from .models import (
    DisplayRequest,
    SaleRecord,
    ShowroomStock,
    StockLedgerEntry,
)


# ─────────────────────────────────────────
# DISPLAY REQUEST TRANSITIONS
# ─────────────────────────────────────────

@receiver(post_save, sender=DisplayRequest)
def handle_display_request_status(sender, instance, created, **kwargs):
    """
    Reacts to every DisplayRequest save and manages stock accordingly.

    accepted  (dropship) → soft-reserve qty on Product
    accepted  (physical) → no stock move yet; wait for dispatch
    dispatched           → create ledger DISPATCH entry, update reserved_showroom
    active    (physical) → create ShowroomStock row
    active    (dropship) → create ShowroomStock row, log RESERVED entry
    closed               → return any unsold showroom stock, release dropship reserve
    """
    if created:
        return  # no stock action on first creation

    product = instance.product

    with transaction.atomic():

        # ── Dropship accepted → soft-reserve ──────────────────────────────
        if (instance.status == DisplayRequest.STATUS_ACTIVE
                and instance.request_type == DisplayRequest.TYPE_DROPSHIP):

            # Create ShowroomStock if not already there
            ShowroomStock.objects.get_or_create(
                display_request=instance,
                defaults={
                    'product':           product,
                    'showroom':          instance.showroom,
                    'quantity_received': instance.accepted_quantity or 0,
                }
            )

            # Log a soft-reservation in the ledger
            _ledger(
                product        = product,
                entry_type     = StockLedgerEntry.TYPE_RESERVED,
                qty            = 0,  # dropship: no physical qty moved yet
                display_request = instance,
                note           = f"Dropship activated for {instance.showroom}",
                actor          = None,
            )

        # ── Physical dispatched → move stock to in-transit ────────────────
        elif instance.status == DisplayRequest.STATUS_DISPATCHED:
            qty = instance.accepted_quantity or 0

            _ledger(
                product        = product,
                entry_type     = StockLedgerEntry.TYPE_DISPATCH,
                qty            = -qty,
                display_request = instance,
                note           = f"Dispatched to {instance.showroom}",
                actor          = None,
            )

            # Deduct from warehouse stock, add to reserved_showroom
            product.__class__.objects.filter(pk=product.pk).update(
                stock_quantity    = F('stock_quantity') - qty,
                reserved_showroom = F('reserved_showroom') + qty,
            )

        # ── Physical received → create ShowroomStock ──────────────────────
        elif instance.status == DisplayRequest.STATUS_ACTIVE:
            qty = instance.accepted_quantity or 0

            ShowroomStock.objects.get_or_create(
                display_request=instance,
                defaults={
                    'product':           product,
                    'showroom':          instance.showroom,
                    'quantity_received': qty,
                }
            )
            # reserved_showroom stays; units are now "at showroom" not warehouse

        # ── Closed → return unsold stock ──────────────────────────────────
        elif instance.status == DisplayRequest.STATUS_CLOSED:
            try:
                ss = instance.showroom_stock
            except ShowroomStock.DoesNotExist:
                return

            unsold = ss.quantity_remaining
            if unsold > 0:
                ss.quantity_returned = F('quantity_returned') + unsold
                ss.save(update_fields=['quantity_returned'])

                _ledger(
                    product        = product,
                    entry_type     = StockLedgerEntry.TYPE_RETURN,
                    qty            = unsold,
                    display_request = instance,
                    note           = f"Display closed — {unsold} units returned from {instance.showroom}",
                    actor          = None,
                )

                if instance.request_type == DisplayRequest.TYPE_PHYSICAL:
                    product.__class__.objects.filter(pk=product.pk).update(
                        stock_quantity    = F('stock_quantity') + unsold,
                        reserved_showroom = F('reserved_showroom') - unsold,
                    )


# ─────────────────────────────────────────
# SALE RECORD
# ─────────────────────────────────────────

@receiver(post_save, sender=SaleRecord)
def handle_sale(sender, instance, created, **kwargs):
    """
    On every new SaleRecord:
    - Deduct from Product.stock_quantity
    - For showroom sales: decrement ShowroomStock.quantity_sold
    - Create a StockLedgerEntry
    """
    if not created:
        return

    product = instance.product
    qty     = instance.quantity

    with transaction.atomic():

        # ── Showroom sale ──────────────────────────────────────────────────
        if instance.channel == SaleRecord.CHANNEL_SHOWROOM and instance.showroom_stock:
            ss = instance.showroom_stock
            ShowroomStock.objects.filter(pk=ss.pk).update(
                quantity_sold=F('quantity_sold') + qty
            )
            # reserved_showroom decreases as goods sell through
            product.__class__.objects.filter(pk=product.pk).update(
                reserved_showroom=F('reserved_showroom') - qty,
            )

        # ── Own shop / POS sale ────────────────────────────────────────────
        elif instance.channel in (SaleRecord.CHANNEL_OWN_SHOP, SaleRecord.CHANNEL_POS):
            product.__class__.objects.filter(pk=product.pk).update(
                stock_quantity=F('stock_quantity') - qty,
            )

        # ── Online / dropship sale ─────────────────────────────────────────
        elif instance.channel == SaleRecord.CHANNEL_ONLINE:
            product.__class__.objects.filter(pk=product.pk).update(
                stock_quantity=F('stock_quantity') - qty,
            )

        # ── Ledger entry for all channels ─────────────────────────────────
        _ledger(
            product     = product,
            entry_type  = StockLedgerEntry.TYPE_SALE,
            qty         = -qty,
            sale_record = instance,
            note        = f"Sale via {instance.get_channel_display()}",
            actor       = instance.seller,
        )


# ─────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────

def _ledger(product, entry_type, qty, actor=None,
            sale_record=None, display_request=None, note=''):
    """Create a StockLedgerEntry without triggering further signals."""
    StockLedgerEntry.objects.create(
        product         = product,
        entry_type      = entry_type,
        qty             = qty,
        actor           = actor,
        sale_record     = sale_record,
        display_request = display_request,
        note            = note,
    )

