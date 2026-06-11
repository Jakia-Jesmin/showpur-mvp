from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'transactions',  views.TransactionViewSet,         basename='transaction')
router.register(r'quick-records', views.QuickRecordViewSet,         basename='quick-record')
router.register(r'cash-positions', views.CashPositionViewSet,       basename='cash-position')
router.register(r'contacts',       views.ContactViewSet,            basename='acshow-contact')
router.register(r'alerts',         views.AlertViewSet,              basename='alert')

urlpatterns = [
    # Dashboard
    path('dashboard/',          views.AcShowDashboardView.as_view(),       name='acshow-dashboard'),
    path('dashboard/cards/',    views.DashboardSummaryCardsView.as_view(), name='dashboard-cards'),

    # Floor 1: Cash Intelligence
    path('dashboard-pulse/',    views.DashboardPulseView.as_view(),        name='dashboard-pulse'),
    path('inventory-quality/',  views.InventoryQualityView.as_view(),      name='inventory-quality'),
    path('aging-report/',       views.AgingReportView.as_view(),           name='aging-report'),

    # Reports
    path('reports/cashflow/',   views.CashflowReportView.as_view(),        name='cashflow-report'),

    # Business Health
    path('health/',             views.BusinessHealthView.as_view(),        name='business-health'),

    # Trial
    path('trial/start/',        views.StartTrialView.as_view(),            name='start-trial'),

    # Router (transactions, quick-records, cash-positions, contacts, alerts)
    path('', include(router.urls)),
]
