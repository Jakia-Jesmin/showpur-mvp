from rest_framework import serializers
from django.db.models import Avg, Count
from django.utils import timezone

from .models import (
    Category,
    Product,
    ProductImage,
    ProductReview,
    DisplayRequest,
    ShowroomStock,
    SaleRecord,
    StockLedgerEntry,
)


# ─────────────────────────────────────────
# CATEGORY
# ─────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    subcategory_count = serializers.IntegerField(source='subcategories.count', read_only=True)
    product_count     = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model  = Category
        fields = [
            'id', 'name', 'slug', 'description', 'icon', 'parent',
            'subcategory_count', 'product_count', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at']


# ─────────────────────────────────────────
# PRODUCT MEDIA & REVIEWS
# ─────────────────────────────────────────

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductImage
        fields = ['id', 'image', 'alt_text', 'order', 'is_primary']


class ProductReviewSerializer(serializers.ModelSerializer):
    user_name   = serializers.CharField(source='user.profile.business_name', read_only=True)
    user_avatar = serializers.ImageField(source='user.profile.logo', read_only=True)

    class Meta:
        model  = ProductReview
        fields = [
            'id', 'user', 'user_name', 'user_avatar',
            'rating', 'title', 'comment',
            'is_verified_purchase', 'helpful_count', 'created_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'helpful_count']


# ─────────────────────────────────────────
# PRODUCT — LIST (public / showroom browse)
# Lightweight: no stock details, no reserved counts.
# ─────────────────────────────────────────

class ProductListSerializer(serializers.ModelSerializer):
    category_name  = serializers.CharField(source='category.name', read_only=True)
    owner_name     = serializers.CharField(source='owner.profile.business_name', read_only=True)
    owner_logo     = serializers.ImageField(source='owner.profile.logo', read_only=True)
    main_image_url = serializers.ImageField(source='main_image', read_only=True)
    fulfillment_type = serializers.CharField(read_only=True)

    # Use DB aggregation — never loop in Python
    average_rating = serializers.SerializerMethodField()
    review_count   = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'slug', 'short_description', 'price',
            'main_image_url', 'category_name', 'owner_name', 'owner_logo',
            'fulfillment_type', 'condition', 'is_featured',
            'average_rating', 'review_count', 'created_at',
        ]

    def get_average_rating(self, obj):
        # Annotated in the view queryset for efficiency; fall back if not present
        if hasattr(obj, 'avg_rating'):
            return round(obj.avg_rating or 0, 1)
        result = obj.reviews.filter(is_approved=True).aggregate(avg=Avg('rating'))
        return round(result['avg'] or 0, 1)

    def get_review_count(self, obj):
        if hasattr(obj, 'num_reviews'):
            return obj.num_reviews
        return obj.reviews.filter(is_approved=True).count()


# ─────────────────────────────────────────
# PRODUCT — OWNER INVENTORY VIEW
# Full stock breakdown. Only shown to the product owner.
# ─────────────────────────────────────────

class ProductInventorySerializer(serializers.ModelSerializer):
    """
    Used in the owner's inventory dashboard.
    Exposes all stock fields and per-location breakdown.
    """
    category_name    = serializers.CharField(source='category.name', read_only=True)
    available_quantity = serializers.IntegerField(read_only=True)
    is_low_stock     = serializers.BooleanField(read_only=True)
    allows_physical  = serializers.BooleanField(read_only=True)
    allows_dropship  = serializers.BooleanField(read_only=True)

    # Live showroom breakdown
    showroom_breakdown = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'slug', 'category_name', 'price', 'main_image',
            'fulfillment_type', 'allows_physical', 'allows_dropship',
            # Stock numbers
            'stock_quantity', 'reserved_showroom', 'reserved_dropship',
            'available_quantity', 'low_stock_threshold', 'is_low_stock',
            'condition', 'is_active', 'is_approved',
            'preferred_display_fee', 'min_commission_rate',
            'showroom_breakdown',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'slug', 'stock_quantity', 'reserved_showroom',
            'reserved_dropship', 'created_at', 'updated_at',
        ]

    def get_showroom_breakdown(self, obj):
        """Returns per-showroom stock summary for the owner dashboard."""
        stocks = ShowroomStock.objects.filter(
            product=obj,
            display_request__status=DisplayRequest.STATUS_ACTIVE,
        ).select_related('showroom__profile')

        return [
            {
                'showroom_id':   ss.showroom_id,
                'showroom_name': getattr(getattr(ss.showroom, 'profile', None), 'business_name', str(ss.showroom)),
                'request_type':  ss.display_request.request_type,
                'received':      ss.quantity_received,
                'sold':          ss.quantity_sold,
                'returned':      ss.quantity_returned,
                'remaining':     ss.quantity_remaining,
            }
            for ss in stocks
        ]


# ─────────────────────────────────────────
# PRODUCT — DETAIL (public)
# ─────────────────────────────────────────

class ProductDetailSerializer(serializers.ModelSerializer):
    category       = CategorySerializer(read_only=True)
    category_id    = serializers.IntegerField(write_only=True)
    owner_name     = serializers.CharField(source='owner.profile.business_name', read_only=True)
    owner_logo     = serializers.ImageField(source='owner.profile.logo', read_only=True)
    owner_location = serializers.CharField(source='owner.profile.location', read_only=True)
    images         = ProductImageSerializer(source='product_images', many=True, read_only=True)
    reviews        = ProductReviewSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    # Public-safe stock fields — no reserved breakdown exposed
    available_quantity = serializers.IntegerField(read_only=True)
    is_low_stock       = serializers.BooleanField(read_only=True)
    fulfillment_type   = serializers.CharField(read_only=True)
    allows_physical    = serializers.BooleanField(read_only=True)
    allows_dropship    = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'price', 'wholesale_price', 'minimum_order_quantity',
            'main_image', 'images', 'video_url',
            'dimensions', 'weight', 'color', 'material',
            'category', 'category_id',
            'owner_name', 'owner_logo', 'owner_location',
            'fulfillment_type', 'allows_physical', 'allows_dropship',
            'available_quantity', 'is_low_stock',
            'condition', 'is_active', 'is_featured',
            'preferred_display_fee', 'min_commission_rate',
            'reviews', 'average_rating',
            'meta_title', 'meta_description', 'meta_keywords',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'approved_at']

    def get_average_rating(self, obj):
        result = obj.reviews.filter(is_approved=True).aggregate(avg=Avg('rating'))
        return round(result['avg'] or 0, 1)

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


# ─────────────────────────────────────────
# PRODUCT — CREATE / UPDATE (owner only)
# stock_quantity is intentionally excluded — managed by signals.
# To add stock, create a StockLedgerEntry (purchase/production).
# ─────────────────────────────────────────

class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Product
        fields = [
            'name', 'description', 'short_description',
            'price', 'wholesale_price', 'minimum_order_quantity',
            'category', 'main_image', 'video_url',
            'dimensions', 'weight', 'color', 'material',
            'condition', 'fulfillment_type',
            'low_stock_threshold',
            'preferred_display_fee', 'min_commission_rate',
            'meta_title', 'meta_description', 'meta_keywords',
            'is_active',
        ]
        # stock_quantity / reserved_* deliberately absent — signals own them

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


# ─────────────────────────────────────────
# STOCK LEDGER — add stock (purchase / production)
# ─────────────────────────────────────────

class StockLedgerEntrySerializer(serializers.ModelSerializer):
    entry_type_display = serializers.CharField(source='get_entry_type_display', read_only=True)
    actor_name         = serializers.CharField(source='actor.profile.business_name', read_only=True)

    class Meta:
        model  = StockLedgerEntry
        fields = [
            'id', 'product', 'entry_type', 'entry_type_display',
            'qty', 'note', 'actor', 'actor_name',
            'sale_record', 'display_request', 'timestamp',
        ]
        read_only_fields = ['id', 'actor', 'timestamp']


class StockAddSerializer(serializers.Serializer):
    """
    Used by the owner to add stock via purchase or production.
    POSTing this creates a StockLedgerEntry and updates Product.stock_quantity.
    """
    ENTRY_TYPE_CHOICES = [
        (StockLedgerEntry.TYPE_PURCHASE,   'Purchase / restock'),
        (StockLedgerEntry.TYPE_PRODUCTION, 'Production'),
        (StockLedgerEntry.TYPE_ADJUSTMENT, 'Manual adjustment'),
    ]

    product    = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    entry_type = serializers.ChoiceField(choices=ENTRY_TYPE_CHOICES)
    qty        = serializers.IntegerField(min_value=1)
    note       = serializers.CharField(max_length=300, required=False, allow_blank=True)

    def validate(self, data):
        request = self.context['request']
        if data['product'].owner != request.user:
            raise serializers.ValidationError("You can only add stock to your own products.")
        return data

    def save(self, **kwargs):
        from django.db.models import F
        data    = self.validated_data
        product = data['product']
        qty     = data['qty']
        actor   = self.context['request'].user

        entry = StockLedgerEntry.objects.create(
            product    = product,
            entry_type = data['entry_type'],
            qty        = qty,
            actor      = actor,
            note       = data.get('note', ''),
        )

        # Update the denormalised counter
        product.__class__.objects.filter(pk=product.pk).update(
            stock_quantity=F('stock_quantity') + qty
        )
        return entry


# ─────────────────────────────────────────
# DISPLAY REQUEST
# ─────────────────────────────────────────

class DisplayRequestSerializer(serializers.ModelSerializer):
    product_name   = serializers.CharField(source='product.name', read_only=True)
    product_image  = serializers.ImageField(source='product.main_image', read_only=True)
    showroom_name  = serializers.CharField(source='showroom.profile.business_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display   = serializers.CharField(source='get_request_type_display', read_only=True)

    class Meta:
        model  = DisplayRequest
        fields = [
            'id', 'product', 'product_name', 'product_image',
            'showroom', 'showroom_name',
            'request_type', 'type_display',
            'status', 'status_display',
            'requested_quantity', 'accepted_quantity',
            'agreed_commission_rate', 'agreed_display_fee',
            'notes',
            'requested_at', 'accepted_at', 'dispatched_at',
            'received_at', 'activated_at', 'closed_at',
        ]
        read_only_fields = [
            'id', 'showroom', 'status',
            'accepted_quantity', 'agreed_commission_rate', 'agreed_display_fee',
            'requested_at', 'accepted_at', 'dispatched_at',
            'received_at', 'activated_at', 'closed_at',
        ]

    def validate(self, data):
        product      = data.get('product') or self.instance and self.instance.product
        request_type = data.get('request_type')

        if request_type == DisplayRequest.TYPE_PHYSICAL and not product.allows_physical:
            raise serializers.ValidationError(
                "This product does not support physical display."
            )
        if request_type == DisplayRequest.TYPE_DROPSHIP and not product.allows_dropship:
            raise serializers.ValidationError(
                "This product does not support dropship / online display."
            )
        if data.get('requested_quantity', 0) > product.available_quantity:
            raise serializers.ValidationError(
                f"Only {product.available_quantity} units available."
            )
        return data

    def create(self, validated_data):
        validated_data['showroom'] = self.context['request'].user
        return super().create(validated_data)


class DisplayRequestAcceptSerializer(serializers.Serializer):
    """Used by the product owner to accept a display request."""
    accepted_quantity  = serializers.IntegerField(min_value=1)
    commission_rate    = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    display_fee        = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    def validate_accepted_quantity(self, value):
        request_obj = self.context['display_request']
        if value > request_obj.requested_quantity:
            raise serializers.ValidationError(
                f"Cannot accept more than the requested quantity ({request_obj.requested_quantity})."
            )
        if value > request_obj.product.available_quantity:
            raise serializers.ValidationError(
                f"Only {request_obj.product.available_quantity} units available."
            )
        return value

    def save(self):
        dr = self.context['display_request']
        dr.accept(
            quantity       = self.validated_data['accepted_quantity'],
            commission_rate = self.validated_data.get('commission_rate'),
            display_fee    = self.validated_data.get('display_fee'),
        )
        return dr


# ─────────────────────────────────────────
# SHOWROOM STOCK (read-only views)
# ─────────────────────────────────────────

class ShowroomStockSerializer(serializers.ModelSerializer):
    product_name      = serializers.CharField(source='product.name', read_only=True)
    product_image     = serializers.ImageField(source='product.main_image', read_only=True)
    showroom_name     = serializers.CharField(source='showroom.profile.business_name', read_only=True)
    quantity_remaining = serializers.IntegerField(read_only=True)
    request_type      = serializers.CharField(source='display_request.request_type', read_only=True)
    commission_rate   = serializers.DecimalField(
        source='display_request.agreed_commission_rate',
        max_digits=5, decimal_places=2, read_only=True
    )

    class Meta:
        model  = ShowroomStock
        fields = [
            'id', 'product', 'product_name', 'product_image',
            'showroom', 'showroom_name', 'request_type',
            'quantity_received', 'quantity_sold', 'quantity_returned',
            'quantity_remaining', 'commission_rate', 'updated_at',
        ]
        read_only_fields = fields


# ─────────────────────────────────────────
# SALE RECORD
# ─────────────────────────────────────────

class SaleRecordSerializer(serializers.ModelSerializer):
    product_name    = serializers.CharField(source='product.name', read_only=True)
    seller_name     = serializers.CharField(source='seller.profile.business_name', read_only=True)
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    showroom_name   = serializers.CharField(
        source='showroom_stock.showroom.profile.business_name',
        read_only=True, default=None
    )

    class Meta:
        model  = SaleRecord
        fields = [
            'id', 'product', 'product_name',
            'seller', 'seller_name',
            'channel', 'channel_display',
            'showroom_stock', 'showroom_name',
            'quantity', 'unit_price', 'total_price',
            'commission_rate', 'commission_amount',
            'requires_fulfillment', 'fulfilled_at',
            'notes', 'sold_at',
        ]
        read_only_fields = [
            'id', 'seller', 'total_price',
            'commission_amount', 'fulfilled_at',
        ]

    def validate(self, data):
        product = data['product']
        channel = data['channel']
        qty     = data['quantity']

        # Showroom sale must reference a ShowroomStock
        if channel == SaleRecord.CHANNEL_SHOWROOM:
            ss = data.get('showroom_stock')
            if not ss:
                raise serializers.ValidationError(
                    "showroom_stock is required for showroom channel sales."
                )
            if ss.product != product:
                raise serializers.ValidationError(
                    "showroom_stock does not belong to this product."
                )
            if qty > ss.quantity_remaining:
                raise serializers.ValidationError(
                    f"Only {ss.quantity_remaining} units remaining at this showroom."
                )
        else:
            # Own shop / POS / online — check against available stock
            if qty > product.available_quantity:
                raise serializers.ValidationError(
                    f"Only {product.available_quantity} units available."
                )

        # Mark dropship sales as needing fulfillment
        if channel == SaleRecord.CHANNEL_ONLINE:
            data['requires_fulfillment'] = True

        # Auto-fill commission from ShowroomStock's display request if not provided
        if not data.get('commission_rate') and data.get('showroom_stock'):
            rate = data['showroom_stock'].display_request.agreed_commission_rate
            if rate:
                data['commission_rate'] = rate

        return data

    def create(self, validated_data):
        validated_data['seller'] = self.context['request'].user
        return super().create(validated_data)


class SaleRecordCreateSerializer(SaleRecordSerializer):
    """
    Slimmer write serializer — only fields a seller actually fills in.
    total_price, commission_amount computed on model save().
    """
    class Meta(SaleRecordSerializer.Meta):
        fields = [
            'product', 'channel', 'showroom_stock',
            'quantity', 'unit_price',
            'commission_rate', 'notes', 'sold_at',
        ]
        read_only_fields = []