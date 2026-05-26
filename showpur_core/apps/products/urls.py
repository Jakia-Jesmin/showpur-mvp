from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    ProductViewSet,
    ProductReviewViewSet,
    DisplayRequestViewSet,
    ShowroomStockViewSet,
    SaleRecordViewSet,
    StockLedgerViewSet,
)

router = DefaultRouter()
router.register(r'categories',       CategoryViewSet,       basename='category')
router.register(r'products',         ProductViewSet,        basename='product')
router.register(r'reviews',          ProductReviewViewSet,  basename='review')
router.register(r'display-requests', DisplayRequestViewSet, basename='display-request')
router.register(r'showroom-stock',   ShowroomStockViewSet,  basename='showroom-stock')
router.register(r'sales',            SaleRecordViewSet,     basename='sale')
router.register(r'stock-ledger',     StockLedgerViewSet,    basename='stock-ledger')

urlpatterns = [
    path('', include(router.urls)),
]