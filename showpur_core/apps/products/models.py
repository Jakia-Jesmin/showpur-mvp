from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils.text import slugify
from django.utils import timezone
from django.db.models import Sum

User = settings.AUTH_USER_MODEL


# ─────────────────────────────────────────
# CATEGORY
# ─────────────────────────────────────────

class Category(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    slug        = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon        = models.CharField(max_length=50, blank=True, help_text="FontAwesome icon class")
    parent      = models.ForeignKey(
        'self', on_delete=models.CASCADE,
        null=True, blank=True, related_name='subcategories'
    )
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table           = 'categories'
        verbose_name_plural = 'Categories'
        ordering           = ['name']

    def __str__(self):
        return self.name


# ─────────────────────────────────────────
# PRODUCT
# ─────────────────────────────────────────

class Product(models.Model):
    CONDITION_CHOICES = [
        ('new',      'New'),
        ('like_new', 'Like New'),
        ('good',     'Good'),
        ('fair',     'Fair'),
    ]

    # A product can be fulfilled via physical delivery, dropship, or both.
    # This controls which sale/display paths are available for this product.
    FULFILLMENT_PHYSICAL = 'physical'
    FULFILLMENT_DROPSHIP = 'dropship'
    FULFILLMENT_BOTH     = 'both'
    FULFILLMENT_CHOICES  = [
        (FULFILLMENT_PHYSICAL, 'Physical only'),
        (FULFILLMENT_DROPSHIP, 'Dropship only'),
        (FULFILLMENT_BOTH,     'Physical + Dropship'),
    ]

    owner    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL,
        null=True, related_name='products'
    )

    # Basic info
    name              = models.CharField(max_length=200)
    slug              = models.SlugField(max_length=200, unique=True, blank=True)
    description       = models.TextField()
    short_description = models.CharField(max_length=500, blank=True)

    # Pricing
    price                   = models.DecimalField(max_digits=10, decimal_places=2)
    wholesale_price         = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    minimum_order_quantity  = models.IntegerField(default=1, validators=[MinValueValidator(1)])

    # Media
    main_image = models.ImageField(upload_to='products/', blank=True, null=True)
    images     = models.JSONField(default=list, blank=True, help_text="Additional image URLs")
    video_url  = models.URLField(blank=True)

    # Physical details
    dimensions = models.CharField(max_length=100, blank=True, help_text="L x W x H in cm")
    weight     = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    color      = models.CharField(max_length=50, blank=True)
    material   = models.CharField(max_length=100, blank=True)

    # ── Inventory fields ──────────────────────────────────────────────────
    # stock_quantity is the master count in the owner's warehouse.
    # Never modify directly — always go through StockLedgerEntry.
    # reserved_showroom  : units physically dispatched to showrooms (held there)
    # reserved_dropship  : soft-allocated to active dropship sellers
    # All three are updated automatically by signals in signals.py.
    stock_quantity     = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    reserved_showroom  = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    reserved_dropship  = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    low_stock_threshold = models.IntegerField(default=5)

    # ── Fulfillment type ─────────────────────────────────────────────────
    fulfillment_type = models.CharField(
        max_length=20, choices=FULFILLMENT_CHOICES,
        default=FULFILLMENT_PHYSICAL,
        help_text="Controls which display/sale channels are open for this product"
    )

    # Condition & status
    condition   = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='new')
    is_active   = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)

    # Display & commission preferences
    preferred_display_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    min_commission_rate   = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # SEO
    meta_title       = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(blank=True, max_length=500)
    meta_keywords    = models.CharField(max_length=500, blank=True)

    # Timestamps
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['owner', 'is_active']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['slug']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.name

    # ── Computed stock properties ─────────────────────────────────────────

    @property
    def available_quantity(self):
        """Units the owner can still sell or dispatch — nothing committed yet."""
        return max(
            self.stock_quantity - self.reserved_showroom - self.reserved_dropship,
            0
        )

    @property
    def is_low_stock(self):
        return self.available_quantity <= self.low_stock_threshold

    @property
    def allows_physical(self):
        return self.fulfillment_type in (self.FULFILLMENT_PHYSICAL, self.FULFILLMENT_BOTH)

    @property
    def allows_dropship(self):
        return self.fulfillment_type in (self.FULFILLMENT_DROPSHIP, self.FULFILLMENT_BOTH)

    # ── Helpers ───────────────────────────────────────────────────────────

    def get_stock_at_showroom(self, showroom):
        """Returns how many units are currently active at a specific showroom."""
        return ShowroomStock.objects.filter(
            product=self, showroom=showroom
        ).aggregate(total=Sum('quantity_remaining'))['total'] or 0

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
            original = self.slug
            counter  = 1
            while Product.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original}-{counter}"
                counter  += 1
        super().save(*args, **kwargs)


# ─────────────────────────────────────────
# PRODUCT MEDIA
# ─────────────────────────────────────────

class ProductImage(models.Model):
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_images')
    image      = models.ImageField(upload_to='products/gallery/')
    alt_text   = models.CharField(max_length=200, blank=True)
    order      = models.IntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_images'
        ordering = ['order']

    def __str__(self):
        return f"{self.product.name} - Image {self.order}"


class ProductReview(models.Model):
    RATING_CHOICES = [(i, i) for i in range(1, 6)]

    product              = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user                 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='product_reviews')
    rating               = models.IntegerField(choices=RATING_CHOICES)
    title                = models.CharField(max_length=200)
    comment              = models.TextField()
    is_verified_purchase = models.BooleanField(default=False)
    is_approved          = models.BooleanField(default=False)
    helpful_count        = models.IntegerField(default=0)
    created_at           = models.DateTimeField(auto_now_add=True)
    updated_at           = models.DateTimeField(auto_now=True)

    class Meta:
        db_table       = 'product_reviews'
        ordering       = ['-created_at']
        unique_together = ['product', 'user']

    def __str__(self):
        return f"{self.product.name} - {self.rating} stars"


# ─────────────────────────────────────────
# DISPLAY REQUEST
# Physical:  pending → accepted → dispatched → received → active
# Dropship:  pending → accepted → active
# ─────────────────────────────────────────

class DisplayRequest(models.Model):
    STATUS_PENDING    = 'pending'
    STATUS_ACCEPTED   = 'accepted'
    STATUS_REJECTED   = 'rejected'
    STATUS_DISPATCHED = 'dispatched'   # physical only: owner has sent goods
    STATUS_RECEIVED   = 'received'     # physical only: showroom confirmed receipt
    STATUS_ACTIVE     = 'active'       # product is live & sellable at this location
    STATUS_CLOSED     = 'closed'       # ended (returned / agreement ended)

    STATUS_CHOICES = [
        (STATUS_PENDING,    'Pending'),
        (STATUS_ACCEPTED,   'Accepted'),
        (STATUS_REJECTED,   'Rejected'),
        (STATUS_DISPATCHED, 'Dispatched'),
        (STATUS_RECEIVED,   'Received'),
        (STATUS_ACTIVE,     'Active'),
        (STATUS_CLOSED,     'Closed'),
    ]

    TYPE_PHYSICAL = 'physical'
    TYPE_DROPSHIP = 'dropship'
    TYPE_CHOICES  = [
        (TYPE_PHYSICAL, 'Physical display'),
        (TYPE_DROPSHIP, 'Online / dropship'),
    ]

    product          = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='display_requests')
    # showroom is the User account of the showroom/shop requesting display
    showroom         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='display_requests')
    request_type     = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)

    # Quantities
    requested_quantity = models.IntegerField(validators=[MinValueValidator(1)])
    accepted_quantity  = models.IntegerField(null=True, blank=True)  # set by owner on accept

    # Terms agreed at acceptance
    agreed_commission_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    agreed_display_fee     = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes                  = models.TextField(blank=True)

    # Timeline — each timestamp is set when that stage is reached
    requested_at  = models.DateTimeField(auto_now_add=True)
    accepted_at   = models.DateTimeField(null=True, blank=True)
    rejected_at   = models.DateTimeField(null=True, blank=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)  # physical only
    received_at   = models.DateTimeField(null=True, blank=True)  # physical only
    activated_at  = models.DateTimeField(null=True, blank=True)
    closed_at     = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'display_requests'
        ordering = ['-requested_at']
        indexes  = [
            models.Index(fields=['product', 'status']),
            models.Index(fields=['showroom', 'status']),
        ]

    def __str__(self):
        return f"{self.product.name} → {self.showroom} [{self.status}]"

    # ── Status transition helpers ─────────────────────────────────────────

    def accept(self, quantity, commission_rate=None, display_fee=None):
        self.status           = self.STATUS_ACCEPTED
        self.accepted_quantity = quantity
        self.accepted_at      = timezone.now()
        if commission_rate:
            self.agreed_commission_rate = commission_rate
        if display_fee:
            self.agreed_display_fee = display_fee
        # Dropship goes straight to active; physical waits for dispatch
        if self.request_type == self.TYPE_DROPSHIP:
            self.status      = self.STATUS_ACTIVE
            self.activated_at = timezone.now()
        self.save()

    def mark_dispatched(self):
        """Physical only — owner has shipped goods to showroom."""
        if self.request_type != self.TYPE_PHYSICAL:
            raise ValueError("Only physical display requests can be dispatched.")
        self.status       = self.STATUS_DISPATCHED
        self.dispatched_at = timezone.now()
        self.save()

    def confirm_received(self):
        """Physical only — showroom confirms goods arrived."""
        if self.request_type != self.TYPE_PHYSICAL:
            raise ValueError("Only physical display requests require receipt confirmation.")
        self.status      = self.STATUS_RECEIVED
        self.received_at = timezone.now()
        # Now it goes live
        self.status      = self.STATUS_ACTIVE
        self.activated_at = timezone.now()
        self.save()

    def close(self):
        self.status   = self.STATUS_CLOSED
        self.closed_at = timezone.now()
        self.save()


# ─────────────────────────────────────────
# SHOWROOM STOCK
# Tracks how many units are physically at each showroom right now.
# Created/updated when a DisplayRequest reaches STATUS_ACTIVE.
# Decremented on each showroom sale.
# ─────────────────────────────────────────

class ShowroomStock(models.Model):
    display_request    = models.OneToOneField(DisplayRequest, on_delete=models.CASCADE, related_name='showroom_stock')
    product            = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='showroom_stocks')
    showroom           = models.ForeignKey(User, on_delete=models.CASCADE, related_name='showroom_stocks')
    quantity_received  = models.IntegerField(default=0)   # total units ever received
    quantity_sold      = models.IntegerField(default=0)   # total units sold from here
    quantity_returned  = models.IntegerField(default=0)   # units returned to owner
    updated_at         = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'showroom_stock'

    @property
    def quantity_remaining(self):
        return self.quantity_received - self.quantity_sold - self.quantity_returned

    def __str__(self):
        return f"{self.product.name} @ {self.showroom} — {self.quantity_remaining} remaining"


# ─────────────────────────────────────────
# SALE RECORD
# One row per sale transaction, regardless of channel.
# ─────────────────────────────────────────

class SaleRecord(models.Model):
    CHANNEL_OWN_SHOP   = 'own_shop'
    CHANNEL_SHOWROOM   = 'showroom'
    CHANNEL_ONLINE     = 'online'
    CHANNEL_POS        = 'pos'
    CHANNEL_CHOICES    = [
        (CHANNEL_OWN_SHOP, 'Own shop / showroom'),
        (CHANNEL_SHOWROOM, 'Displaying showroom'),
        (CHANNEL_ONLINE,   'Online / dropship'),
        (CHANNEL_POS,      'POS terminal'),
    ]

    product        = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sales')
    seller         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sales_made')
    channel        = models.CharField(max_length=20, choices=CHANNEL_CHOICES)

    # For showroom channel — which showroom made this sale
    showroom_stock = models.ForeignKey(
        ShowroomStock, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='sales'
    )

    quantity    = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price  = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    # Commission auto-calculated from DisplayRequest.agreed_commission_rate
    commission_rate   = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Dropship fulfillment
    requires_fulfillment = models.BooleanField(default=False)  # True for dropship sales
    fulfilled_at         = models.DateTimeField(null=True, blank=True)

    notes      = models.TextField(blank=True)
    sold_at    = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sale_records'
        ordering = ['-sold_at']
        indexes  = [
            models.Index(fields=['product', 'channel']),
            models.Index(fields=['seller', 'sold_at']),
            models.Index(fields=['sold_at']),
        ]

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        if self.commission_rate and self.commission_rate > 0:
            self.commission_amount = (self.total_price * self.commission_rate) / 100
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} x{self.quantity} via {self.channel} by {self.seller}"


# ─────────────────────────────────────────
# STOCK LEDGER ENTRY
# Immutable audit log. Every stock movement — purchase, production,
# dispatch, sale, return — creates one row. Current stock is always
# the sum of all qty values for a product. Never delete rows.
# ─────────────────────────────────────────

class StockLedgerEntry(models.Model):
    TYPE_PURCHASE    = 'purchase'     # goods received from supplier
    TYPE_PRODUCTION  = 'production'   # owner produced/manufactured units
    TYPE_SALE        = 'sale'         # sold (any channel) — negative qty
    TYPE_DISPATCH    = 'dispatch'     # sent to showroom — moves to reserved
    TYPE_RETURN      = 'return'       # returned from showroom or customer
    TYPE_ADJUSTMENT  = 'adjustment'   # manual correction by admin
    TYPE_RESERVED    = 'reserved'     # dropship soft-allocation
    TYPE_UNRESERVED  = 'unreserved'   # dropship allocation released

    ENTRY_TYPES = [
        (TYPE_PURCHASE,   'Purchase / restock'),
        (TYPE_PRODUCTION, 'Production'),
        (TYPE_SALE,       'Sale'),
        (TYPE_DISPATCH,   'Dispatched to showroom'),
        (TYPE_RETURN,     'Return'),
        (TYPE_ADJUSTMENT, 'Manual adjustment'),
        (TYPE_RESERVED,   'Dropship reserved'),
        (TYPE_UNRESERVED, 'Dropship unreserved'),
    ]

    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='ledger_entries')
    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPES)

    # Positive = stock in, Negative = stock out
    qty        = models.IntegerField(help_text="Positive = in, negative = out")

    # Traceability — only one of these will be set per entry
    sale_record      = models.ForeignKey(SaleRecord, on_delete=models.SET_NULL, null=True, blank=True)
    display_request  = models.ForeignKey(DisplayRequest, on_delete=models.SET_NULL, null=True, blank=True)

    actor     = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='ledger_entries')
    note      = models.CharField(max_length=300, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'stock_ledger'
        ordering = ['-timestamp']
        indexes  = [
            models.Index(fields=['product', 'timestamp']),
            models.Index(fields=['entry_type']),
        ]

    def __str__(self):
        direction = "+" if self.qty >= 0 else ""
        return f"{self.product.name} | {self.entry_type} | {direction}{self.qty} | {self.timestamp:%Y-%m-%d %H:%M}"
