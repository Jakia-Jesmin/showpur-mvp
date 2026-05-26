from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q, Avg, Count, F
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Category, Product, ProductReview,
    DisplayRequest, ShowroomStock, SaleRecord, StockLedgerEntry,
)
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateUpdateSerializer,
    ProductInventorySerializer,
    ProductReviewSerializer,
    DisplayRequestSerializer,
    DisplayRequestAcceptSerializer,
    ShowroomStockSerializer,
    SaleRecordSerializer,
    SaleRecordCreateSerializer,
    StockLedgerEntrySerializer,
    StockAddSerializer,
)


# ─────────────────────────────────────────
# PERMISSION HELPERS
# ─────────────────────────────────────────

class IsOwnerOrReadOnly(permissions.BasePermission):
    """Object-level: only the product owner can write."""
    
    def has_permission(self, request, view):
        # Allow all authenticated users to list/create
        if request.method in permissions.SAFE_METHODS:
            return True
        # Allow create for authenticated users with valid roles
        if request.method == 'POST':
            return request.user.is_authenticated
        return True
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        owner = getattr(obj, 'owner', getattr(obj, 'seller', None))
        return owner == request.user
class IsProductOwner(permissions.BasePermission):
    """Only allows access if request.user owns the product in context."""
    
    def has_permission(self, request, view):
        # 🌟 GLOBAL LAYER: Ensure the user is authenticated before checking object lookups
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # 🌟 DETAIL LAYER: Safely check database record field properties
        product = getattr(obj, 'product', obj)
        
        # Check if the product model connects via an '.owner' or '.business' reference link
        owner = getattr(product, 'owner', getattr(product, 'business', None))
        
        # If it's a BusinessProfile model instance, look up its underlying owner account field user 
        if hasattr(owner, 'user'):
            return owner.user == request.user
            
        return owner == request.user

class IsRequestShowroom(permissions.BasePermission):
    """Only allows access if request.user is the showroom on the DisplayRequest."""
    def has_object_permission(self, request, view, obj):
        return obj.showroom == request.user


# ─────────────────────────────────────────
# SHARED QUERYSET ANNOTATION
# ─────────────────────────────────────────

def annotate_products(queryset):
    """Attach avg_rating and num_reviews so serializers don't hit DB per row."""
    return queryset.annotate(
        avg_rating  = Avg('reviews__rating', filter=Q(reviews__is_approved=True)),
        num_reviews = Count('reviews', filter=Q(reviews__is_approved=True)),
    )


# ─────────────────────────────────────────
# CATEGORY
# ─────────────────────────────────────────

class CategoryViewSet(viewsets.ModelViewSet):
    queryset           = Category.objects.filter(is_active=True)
    serializer_class   = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field       = 'slug'
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['name', 'description']

    @action(detail=True, methods=['get'])
    def products(self, request, slug=None):
        category = self.get_object()
        qs = annotate_products(
            Product.objects.filter(category=category, is_active=True, is_approved=True)
        )
        serializer = ProductListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


# ─────────────────────────────────────────
# PRODUCT
# ─────────────────────────────────────────

class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    lookup_field       = 'pk'
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['category', 'condition', 'is_featured', 'fulfillment_type']
    search_fields      = ['name', 'description', 'short_description']
    ordering_fields    = ['price', 'created_at']

    def get_queryset(self):
        user = self.request.user

        # 🌟 FIX: If we are creating or updating, return the base model manager 
        # so DRF's validation engine has an open field structure to check against.
        if self.action in ('create', 'update', 'partial_update'):
            return Product.objects.all()
        
        # Owner viewing their own products — show everything including drafts
        if self.action in ('my_products', 'inventory'):
            return annotate_products(
                Product.objects.filter(owner=user)
                .select_related('category', 'owner__profile')
            )

        # Public queryset — only active & approved
        qs = Product.objects.filter(is_active=True, is_approved=True)

        # Optional filters from query params
        owner_id  = self.request.query_params.get('owner')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if owner_id:
            qs = qs.filter(owner_id=owner_id)
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)

        return annotate_products(
            qs.select_related('category', 'owner__profile')
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action == 'retrieve':
            return ProductDetailSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ProductCreateUpdateSerializer
        if self.action in ('my_products', 'inventory'):
            return ProductInventorySerializer
        return ProductDetailSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    # ── Owner-only actions ────────────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='my-products',
            permission_classes=[permissions.IsAuthenticated])
    def my_products(self, request):
        """Full product list for the authenticated owner, including drafts."""
        qs         = self.get_queryset()
        serializer = ProductInventorySerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'],
            permission_classes=[permissions.IsAuthenticated, IsProductOwner])
    def inventory(self, request, pk=None):
        """
        Deep inventory view for a single product.
        Shows stock breakdown, showroom balances, recent ledger entries.
        """
        product = self.get_object()
        if product.owner != request.user:
            raise PermissionDenied("You do not own this product.")

        serializer   = ProductInventorySerializer(product, context={'request': request})
        ledger       = StockLedgerEntry.objects.filter(product=product).order_by('-timestamp')[:20]
        ledger_data  = StockLedgerEntrySerializer(ledger, many=True).data

        return Response({
            'product': serializer.data,
            'recent_ledger': ledger_data,
        })

    @action(detail=True, methods=['post'], url_path='add-stock',
            permission_classes=[permissions.IsAuthenticated, IsProductOwner])
    def add_stock(self, request, pk=None):
        """
        Owner adds stock via purchase, production, or manual adjustment.
        Creates a StockLedgerEntry and updates stock_quantity atomically.
        """
        product = self.get_object()
        if product.owner != request.user:
            raise PermissionDenied("You do not own this product.")

        # Inject product into the request data
        data = request.data.copy()
        data['product'] = product.pk

        serializer = StockAddSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        entry = serializer.save()

        return Response(
            StockLedgerEntrySerializer(entry).data,
            status=status.HTTP_201_CREATED
        )

    # ── Reviews ───────────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='add-review',
            permission_classes=[permissions.IsAuthenticated])
    def add_review(self, request, pk=None):
        product = self.get_object()
        if ProductReview.objects.filter(product=product, user=request.user).exists():
            return Response(
                {'error': 'You have already reviewed this product.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = ProductReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(product=product, user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        product = self.get_object()
        reviews = product.reviews.filter(is_approved=True).select_related('user__profile')
        serializer = ProductReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    # ── Discovery ─────────────────────────────────────────────────────────

    @action(detail=False, methods=['get'])
    def featured(self, request):
        qs = annotate_products(
            Product.objects.filter(is_featured=True, is_active=True, is_approved=True)
            .select_related('category', 'owner__profile')[:10]
        )
        return Response(ProductListSerializer(qs, many=True, context={'request': request}).data)


# ─────────────────────────────────────────
# PRODUCT REVIEW
# ─────────────────────────────────────────

class ProductReviewViewSet(viewsets.ModelViewSet):
    serializer_class   = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProductReview.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='mark-helpful')
    def mark_helpful(self, request, pk=None):
        # Use update_fields to avoid touching updated_at
        ProductReview.objects.filter(pk=pk).update(helpful_count=F('helpful_count') + 1)
        review = self.get_object()
        return Response({'helpful_count': review.helpful_count})


# ─────────────────────────────────────────
# DISPLAY REQUEST
# Showrooms create requests; owners accept/reject/dispatch.
# ─────────────────────────────────────────

class DisplayRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = DisplayRequestSerializer
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields   = ['status', 'request_type', 'product']
    ordering_fields    = ['requested_at']

    def get_queryset(self):
        user = self.request.user
        # Owner sees requests on their products;
        # Showroom sees requests they submitted.
        return DisplayRequest.objects.filter(
            Q(product__owner=user) | Q(showroom=user)
        ).select_related('product', 'showroom__profile', 'product__owner__profile')

    def perform_create(self, serializer):
        serializer.save(showroom=self.request.user)

    # ── Owner actions ─────────────────────────────────────────────────────

    @action(detail=True, methods=['post'],
            permission_classes=[permissions.IsAuthenticated, IsProductOwner])
    def accept(self, request, pk=None):
        dr = self.get_object()
        if dr.product.owner != request.user:
            raise PermissionDenied("Only the product owner can accept this request.")
        if dr.status != DisplayRequest.STATUS_PENDING:
            return Response(
                {'error': f'Cannot accept a request with status "{dr.status}".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = DisplayRequestAcceptSerializer(
            data=request.data,
            context={'request': request, 'display_request': dr}
        )
        serializer.is_valid(raise_exception=True)
        dr = serializer.save()
        return Response(DisplayRequestSerializer(dr).data)

    @action(detail=True, methods=['post'],
            permission_classes=[permissions.IsAuthenticated, IsProductOwner])
    def reject(self, request, pk=None):
        dr = self.get_object()
        if dr.product.owner != request.user:
            raise PermissionDenied("Only the product owner can reject this request.")
        if dr.status != DisplayRequest.STATUS_PENDING:
            return Response(
                {'error': f'Cannot reject a request with status "{dr.status}".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        dr.status      = DisplayRequest.STATUS_REJECTED
        dr.rejected_at = __import__('django.utils.timezone', fromlist=['timezone']).timezone.now()
        dr.save(update_fields=['status', 'rejected_at'])
        return Response(DisplayRequestSerializer(dr).data)

    @action(detail=True, methods=['post'], url_path='mark-dispatched',
            permission_classes=[permissions.IsAuthenticated, IsProductOwner])
    def mark_dispatched(self, request, pk=None):
        """Physical only — owner has sent goods to showroom."""
        dr = self.get_object()
        if dr.product.owner != request.user:
            raise PermissionDenied("Only the product owner can mark dispatch.")
        if dr.status != DisplayRequest.STATUS_ACCEPTED:
            return Response(
                {'error': 'Only accepted requests can be marked as dispatched.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            dr.mark_dispatched()
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DisplayRequestSerializer(dr).data)

    # ── Showroom action ───────────────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='confirm-received',
            permission_classes=[permissions.IsAuthenticated, IsRequestShowroom])
    def confirm_received(self, request, pk=None):
        """Physical only — showroom confirms goods have arrived."""
        dr = self.get_object()
        if dr.showroom != request.user:
            raise PermissionDenied("Only the receiving showroom can confirm receipt.")
        if dr.status != DisplayRequest.STATUS_DISPATCHED:
            return Response(
                {'error': 'Can only confirm receipt on dispatched requests.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            dr.confirm_received()
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DisplayRequestSerializer(dr).data)

    @action(detail=True, methods=['post'],
            permission_classes=[permissions.IsAuthenticated])
    def close(self, request, pk=None):
        """Either party can close an active display agreement."""
        dr = self.get_object()
        if dr.product.owner != request.user and dr.showroom != request.user:
            raise PermissionDenied("Only the owner or showroom can close this request.")
        if dr.status != DisplayRequest.STATUS_ACTIVE:
            return Response(
                {'error': 'Only active display agreements can be closed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        dr.close()
        return Response(DisplayRequestSerializer(dr).data)


# ─────────────────────────────────────────
# SHOWROOM STOCK  (read-only)
# ─────────────────────────────────────────

class ShowroomStockViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class   = ShowroomStockSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['product', 'showroom']

    def get_queryset(self):
        user = self.request.user
        # Owner sees all showroom stocks for their products
        # Showroom sees only their own stocks
        return ShowroomStock.objects.filter(
            Q(product__owner=user) | Q(showroom=user)
        ).select_related(
            'product', 'showroom__profile',
            'display_request'
        )


# ─────────────────────────────────────────
# SALE RECORD
# ─────────────────────────────────────────

class SaleRecordViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields   = ['channel', 'product']
    ordering_fields    = ['sold_at']
    ordering           = ['-sold_at']

    def get_queryset(self):
        user = self.request.user
        # Sellers see their own sales
        # Owners see all sales of their products across every channel
        return SaleRecord.objects.filter(
            Q(seller=user) | Q(product__owner=user)
        ).select_related(
            'product', 'seller__profile',
            'showroom_stock__showroom__profile',
        )

    def get_serializer_class(self):
        if self.action in ('create',):
            return SaleRecordCreateSerializer
        return SaleRecordSerializer

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    # ── Owner analytics actions ───────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='by-channel',
            permission_classes=[permissions.IsAuthenticated])
    def by_channel(self, request):
        """
        Returns total qty and revenue grouped by channel for the owner's products.
        Used in the owner's sales analytics dashboard.
        """
        from django.db.models import Sum
        user = request.user
        data = (
            SaleRecord.objects
            .filter(product__owner=user)
            .values('channel')
            .annotate(
                total_qty     = Sum('quantity'),
                total_revenue = Sum('total_price'),
                sale_count    = Count('id'),
            )
            .order_by('channel')
        )
        return Response(list(data))

    @action(detail=False, methods=['get'], url_path='by-showroom',
            permission_classes=[permissions.IsAuthenticated])
    def by_showroom(self, request):
        """
        Returns sales grouped by showroom for the owner's products.
        Covers both physical showroom sales and dropship online sellers.
        """
        from django.db.models import Sum
        user = request.user
        data = (
            SaleRecord.objects
            .filter(
                product__owner=user,
                channel=SaleRecord.CHANNEL_SHOWROOM,
            )
            .values(
                'showroom_stock__showroom__id',
                'showroom_stock__showroom__profile__business_name',
            )
            .annotate(
                total_qty     = Sum('quantity'),
                total_revenue = Sum('total_price'),
                sale_count    = Count('id'),
            )
            .order_by('-total_revenue')
        )
        return Response(list(data))

    @action(detail=False, methods=['get'], url_path='pending-fulfillment',
            permission_classes=[permissions.IsAuthenticated])
    def pending_fulfillment(self, request):
        """
        Dropship sales that the owner still needs to ship to the end customer.
        """
        qs = SaleRecord.objects.filter(
            product__owner=request.user,
            requires_fulfillment=True,
            fulfilled_at__isnull=True,
        ).select_related('product', 'seller__profile')
        return Response(SaleRecordSerializer(qs, many=True).data)

    @action(detail=True, methods=['post'], url_path='mark-fulfilled',
            permission_classes=[permissions.IsAuthenticated])
    def mark_fulfilled(self, request, pk=None):
        """Owner marks a dropship sale as fulfilled (shipped to end customer)."""
        sale = self.get_object()
        if sale.product.owner != request.user:
            raise PermissionDenied("Only the product owner can mark fulfilment.")
        if not sale.requires_fulfillment:
            return Response(
                {'error': 'This sale does not require fulfilment.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        from django.utils import timezone
        SaleRecord.objects.filter(pk=sale.pk).update(fulfilled_at=timezone.now())
        sale.refresh_from_db()
        return Response(SaleRecordSerializer(sale).data)


# ─────────────────────────────────────────
# STOCK LEDGER  (read-only — owner only)
# ─────────────────────────────────────────

class StockLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class   = StockLedgerEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields   = ['entry_type', 'product']
    ordering_fields    = ['timestamp']
    ordering           = ['-timestamp']

    def get_queryset(self):
        # Only show ledger entries for products the user owns
        return StockLedgerEntry.objects.filter(
            product__owner=self.request.user
        ).select_related('product', 'actor__profile')