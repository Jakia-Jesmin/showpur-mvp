# apps/acshow/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'transactions', views.TransactionViewSet, basename='transaction')
router.register(r'quick-records', views.QuickRecordViewSet, basename='quick-record')
router.register(r'cash-positions', views.CashPositionViewSet, basename='cash-position')
router.register(r'contacts', views.ContactViewSet, basename='contact')
router.register(r'alerts', views.AlertViewSet, basename='alert')

urlpatterns = [
    # Dashboard
    path('dashboard/', views.AcShowDashboardView.as_view(), name='acshow-dashboard'),
    path('dashboard/summary-cards/', views.DashboardSummaryCardsView.as_view(), name='dashboard-summary'),
    
    # Business Health
    path('health/', views.BusinessHealthView.as_view(), name='business-health'),
    
    # Reports
    path('reports/cashflow/', views.CashflowReportView.as_view(), name='cashflow-report'),
    
    # Router URLs
    path('', include(router.urls)),
]