from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DisplayAgreementViewSet, InventoryTransactionViewSet

router = DefaultRouter()
router.register(r'agreements', DisplayAgreementViewSet, basename='display-agreement')
router.register(r'transactions', InventoryTransactionViewSet, basename='inventory-transaction')

urlpatterns = [
    path('', include(router.urls)),
]