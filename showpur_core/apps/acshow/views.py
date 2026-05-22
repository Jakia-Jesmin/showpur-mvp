# apps/acshow/views.py

from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Q, Count
from django.shortcuts import get_object_or_404
from datetime import timedelta, date
from apps.accounts.models import BusinessProfile

from .models import (
    AcShowTransaction,
    AcShowCashPosition,
    QuickRecord,
    AcShowAlert,
    BusinessHealth
)
from .serializers import (
    AcShowTransactionListSerializer,
    AcShowTransactionCreateSerializer,
    AcShowTransactionDetailSerializer,
    TransactionStatusUpdateSerializer,
    AcShowCashPositionSerializer,
    CashPositionCreateSerializer,
    QuickRecordSerializer,
    AcShowAlertSerializer,
    AlertMarkReadSerializer,
    BusinessHealthSerializer,
    AcShowDashboardSerializer,
)
from .permissions import HasAcShowAccess


# ============================================
# DASHBOARD VIEWS
# ============================================

class AcShowDashboardView(APIView):
    """
    Main AcShow dashboard.
    
    SME Owner opens this and sees:
    - Today's cash position
    - Money to collect/pay
    - Business health score
    - Recent transactions
    - Urgent alerts
    - Quick action buttons
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    
    def get(self, request):
        try:
            business = request.user.profile
        except:
            return Response(
                {'error': 'Business profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        dashboard_data = AcShowDashboardSerializer.build_dashboard(business)
        return Response({
            'success': True,
            'data': dashboard_data.data,
            'message': f'Welcome back, {request.user.get_full_name()}! 👋'
        })


class DashboardSummaryCardsView(APIView):
    """
    Quick summary cards for dashboard top section.
    
    Four cards SME owners care about:
    1. Cash Today
    2. To Collect
    3. To Pay
    4. Business Health
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    
    def get(self, request):
        business = request.user.profile
        today = timezone.now().date()
        
        # Get today's cash
        cash_position = AcShowCashPosition.objects.filter(
            business=business, 
            date=today
        ).first()
        
        # Pending collections
        pending_collections = AcShowTransaction.objects.filter(
            business=business,
            transaction_type='receivable',
            status__in=['pending', 'overdue']
        ).aggregate(
            total=Sum('remaining_amount')
        )['total'] or 0
        
        # Pending payments
        pending_payments = AcShowTransaction.objects.filter(
            business=business,
            transaction_type='payable',
            status__in=['pending', 'overdue']
        ).aggregate(
            total=Sum('remaining_amount')
        )['total'] or 0
        
        # Health
        health = BusinessHealth.objects.filter(business=business).first()
        
        return Response({
            'cards': [
                {
                    'title': '💰 Cash Today',
                    'amount': cash_position.closing_balance if cash_position else 0,
                    'trend': 'up' if cash_position and cash_position.closing_balance > 0 else 'neutral',
                    'action': '/acshow/cashflow',
                },
                {
                    'title': '📥 To Collect',
                    'amount': pending_collections,
                    'trend': 'warning' if pending_collections > 0 else 'good',
                    'action': '/acshow/receivables',
                    'alert': f'{pending_collections} pending collection' if pending_collections > 0 else 'All clear!'
                },
                {
                    'title': '📤 To Pay',
                    'amount': pending_payments,
                    'trend': 'warning' if pending_payments > 0 else 'good',
                    'action': '/acshow/payables',
                    'alert': f'{pending_payments} pending payment' if pending_payments > 0 else 'Nothing due!'
                },
                {
                    'title': '❤️ Business Health',
                    'score': health.health_score if health else 100,
                    'status': health.get_health_status_display() if health else '✅ Healthy',
                    'action': '/acshow/health',
                },
            ]
        })


# ============================================
# TRANSACTION VIEWS
# ============================================

class TransactionViewSet(viewsets.ModelViewSet):
    """
    Complete transaction management.
    
    Actions:
    - List: All transactions with filters
    - Create: New transaction
    - Retrieve: Single transaction detail
    - Update: Edit transaction
    - Delete: Remove transaction
    - Status update: Mark complete/cancel
    - Bulk create: Multiple transactions at once
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AcShowTransactionListSerializer
        elif self.action == 'create':
            return AcShowTransactionCreateSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return AcShowTransactionDetailSerializer
        elif self.action == 'update_status':
            return TransactionStatusUpdateSerializer
        return AcShowTransactionListSerializer
    
    def get_queryset(self):
        business, created = BusinessProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'business_name': self.request.user.get_full_name() or 'My Business'}
        )
        
        # Base queryset
        queryset = AcShowTransaction.objects.filter(
            business=business
        ).select_related('created_by', 'linked_order')
        
        # Filters
        transaction_type = self.request.query_params.get('type')
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(transaction_category_id=category)
        
        party_type = self.request.query_params.get('party_type')
        if party_type:
            queryset = queryset.filter(party_type=party_type)
        
        # Date range filter
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(
                transaction_date__range=[start_date, end_date]
            )
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(party_name__icontains=search) |
                Q(description__icontains=search) |
                Q(notes__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update transaction status.
        
        Common actions:
        - Mark as completed (payment received/made)
        - Cancel transaction
        - Update partial payment
        """
        transaction = self.get_object()
        serializer = TransactionStatusUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        
        if action == 'complete':
            transaction.status = 'completed'
            transaction.completed_date = timezone.now()
            transaction.paid_amount = transaction.amount
            transaction.remaining_amount = 0
            transaction.save()
            
            # Create alert
            AcShowAlert.objects.create(
                business=request.user.profile,
                alert_type='milestone',
                priority='low',
                title='Transaction Completed',
                message=f'Transaction of ৳{transaction.amount} completed',
                related_transaction=transaction
            )
            
            return Response({
                'success': True,
                'message': 'Transaction marked as completed ✅'
            })
        
        elif action == 'cancel':
            transaction.status = 'cancelled'
            transaction.save()
            
            return Response({
                'success': True,
                'message': 'Transaction cancelled'
            })
        
        elif action == 'update_payment':
            paid_amount = serializer.validated_data['paid_amount']
            transaction.paid_amount = paid_amount
            transaction.save()
            
            return Response({
                'success': True,
                'message': f'Payment updated: ৳{paid_amount} paid',
                'remaining': transaction.remaining_amount
            })
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Create multiple transactions at once.
        
        Use case: SME owner records day's transactions in batch
        """
        if not isinstance(request.data, list):
            return Response(
                {'error': 'Expected a list of transactions'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created = []
        errors = []
        
        for idx, item in enumerate(request.data):
            serializer = AcShowTransactionCreateSerializer(
                data=item,
                context={'request': request}
            )
            if serializer.is_valid():
                transaction = serializer.save()
                created.append(AcShowTransactionListSerializer(transaction).data)
            else:
                errors.append({
                    'index': idx,
                    'errors': serializer.errors
                })
        
        return Response({
            'success': len(errors) == 0,
            'created_count': len(created),
            'created': created,
            'errors': errors if errors else None
        }, status=status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Transaction summary by type.
        
        Returns:
        - Total income this month
        - Total expenses this month
        - Collection efficiency
        - Category breakdown
        """
        business = request.user.profile
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        # Monthly totals
        monthly = AcShowTransaction.objects.filter(
            business=business,
            transaction_date__gte=month_start,
            transaction_date__lte=today
        )
        
        income = monthly.filter(transaction_type='income').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        expenses = monthly.filter(transaction_type='expense').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Category breakdown
        categories = monthly.values('transaction_category').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        # Collection efficiency
        total_receivables = AcShowTransaction.objects.filter(
            business=business,
            transaction_type='receivable'
        )
        collected = total_receivables.filter(status='completed').aggregate(
            total=Sum('amount')
        )['total'] or 0
        total = total_receivables.aggregate(
            total=Sum('amount')
        )['total'] or 1  # Avoid division by zero
        
        collection_rate = (collected / total * 100) if total > 0 else 100
        
        return Response({
            'monthly': {
                'income': income,
                'expenses': expenses,
                'profit': income - expenses,
                'collection_rate': round(collection_rate, 1)
            },
            'categories': [
                {
                    'category': cat['category'],
                    'total': cat['total'],
                    'count': cat['count']
                }
                for cat in categories
            ]
        })


# ============================================
# QUICK RECORD VIEWS
# ============================================

class QuickRecordViewSet(viewsets.ModelViewSet):
    """
    Ultra-simple transaction entry.
    
    Designed for mobile use:
    - Big buttons
    - Simple form
    - One-click save
    - Works offline (future)
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    serializer_class = QuickRecordSerializer
    
    def get_queryset(self):
        business, created = BusinessProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'business_name': self.request.user.get_full_name() or 'My Business'}
        )
        return QuickRecord.objects.filter(
            business=business
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save()
        
        return Response({
            'success': True,
            'message': 'Record saved successfully! ✅',
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Get today's quick records only.
        """
        today = timezone.now().date()
        records = self.get_queryset().filter(
            created_at__date=today
        )
        serializer = self.get_serializer(records, many=True)
        
        total_in = records.filter(
            entry_type__in=['collection', 'sale']
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_out = records.filter(
            entry_type__in=['payment', 'expense', 'purchase']
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'records': serializer.data,
            'summary': {
                'total_in': total_in,
                'total_out': total_out,
                'net': total_in - total_out,
                'count': records.count()
            }
        })


# ============================================
# CASH POSITION VIEWS
# ============================================

class CashPositionViewSet(viewsets.ModelViewSet):
    """
    Daily cash position management.
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update']:
            return CashPositionCreateSerializer
        return AcShowCashPositionSerializer
    
    def get_queryset(self):
        business, created = BusinessProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'business_name': self.request.user.get_full_name() or 'My Business'}
        )
        return AcShowCashPosition.objects.filter(
            business=business
        ).order_by('-date')
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Get or create today's cash position.
        """
        business = request.user.profile
        today = timezone.now().date()
        
        cash_position, created = AcShowCashPosition.objects.get_or_create(
            business=business,
            date=today,
            defaults={'opening_balance': self._get_previous_closing(business, today)}
        )
        
        # Auto-calculate if needed
        if created or not cash_position.closing_balance:
            self._auto_calculate_position(cash_position)
        
        serializer = AcShowCashPositionSerializer(cash_position)
        return Response({
            'data': serializer.data,
            'is_new': created
        })
    
    @action(detail=False, methods=['get'])
    def week_summary(self, request):
        """
        Last 7 days cash summary.
        """
        business = request.user.profile
        today = timezone.now().date()
        week_ago = today - timedelta(days=6)
        
        positions = AcShowCashPosition.objects.filter(
            business=business,
            date__gte=week_ago,
            date__lte=today
        ).order_by('date')
        
        return Response({
            'dates': [
                {
                    'date': pos.date,
                    'closing_balance': pos.closing_balance,
                    'cash_in': pos.total_cash_in,
                    'cash_out': pos.total_cash_out
                }
                for pos in positions
            ],
            'trend': self._calculate_trend(positions)
        })
    
    def _get_previous_closing(self, business, date):
        yesterday = date - timedelta(days=1)
        try:
            prev = AcShowCashPosition.objects.get(business=business, date=yesterday)
            return prev.closing_balance
        except AcShowCashPosition.DoesNotExist:
            return 0
    
    def _auto_calculate_position(self, cash_position):
        """Auto-calculate cash position from transactions"""
        business = cash_position.business
        date = cash_position.date
        
        # Calculate from transactions
        transactions = AcShowTransaction.objects.filter(
            business=business,
            transaction_date=date,
            status='completed'
        )
        
        cash_in = transactions.filter(
            transaction_type='income'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        cash_out = transactions.filter(
            transaction_type='expense'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        cash_position.total_cash_in = cash_in
        cash_position.total_cash_out = cash_out
        cash_position.calculate_closing()
        cash_position.save()
    
    def _calculate_trend(self, positions):
        """Calculate cash trend"""
        if len(positions) < 2:
            return 'stable'
        
        first = positions[0].closing_balance
        last = positions[len(positions)-1].closing_balance
        
        if last > first * 1.1:
            return 'up'
        elif last < first * 0.9:
            return 'down'
        return 'stable'


# ============================================
# ALERT VIEWS
# ============================================

class AlertViewSet(viewsets.ModelViewSet):
    """
    Business alerts and notifications.
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    serializer_class = AcShowAlertSerializer
    
    def get_queryset(self):
        business, created = BusinessProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'business_name': self.request.user.get_full_name() or 'My Business'}
        )
        return AcShowAlert.objects.filter(
            business=business,
            is_archived=False
        ).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get count of unread alerts (for notification badge).
        """
        business = request.user.profile
        count = AcShowAlert.objects.filter(
            business=business,
            is_read=False,
            is_archived=False
        ).count()
        
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Mark all alerts as read.
        """
        business = request.user.profile
        AcShowAlert.objects.filter(
            business=business,
            is_read=False
        ).update(is_read=True)
        
        return Response({'success': True, 'message': 'All alerts marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        """
        Mark specific alerts as read.
        """
        serializer = AlertMarkReadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        alert_ids = serializer.validated_data['alert_ids']
        AcShowAlert.objects.filter(
            id__in=alert_ids,
            business=request.user.profile
        ).update(is_read=True)
        
        return Response({'success': True, 'message': f'{len(alert_ids)} alerts marked as read'})


# ============================================
# BUSINESS HEALTH VIEWS
# ============================================

class BusinessHealthView(APIView):
    """
    Business health monitoring and insights.
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    
    def get(self, request):
        business = request.user.profile
        
        health, created = BusinessHealth.objects.get_or_create(
            business=business
        )
        
        # Recalculate if last updated more than 1 hour ago
        if health.last_calculated < timezone.now() - timedelta(hours=1):
            self._update_health_metrics(health)
        
        serializer = BusinessHealthSerializer(health)
        return Response(serializer.data)
    
    def _update_health_metrics(self, health):
        """Update all health metrics"""
        business = health.business
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        # Monthly revenue and expenses
        transactions = AcShowTransaction.objects.filter(
            business=business,
            transaction_date__gte=month_start,
            status='completed'
        )
        
        health.monthly_revenue = transactions.filter(
            transaction_type='income'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        health.monthly_expenses = transactions.filter(
            transaction_type='expense'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Collection rate
        receivables = AcShowTransaction.objects.filter(
            business=business,
            transaction_type='receivable'
        )
        total_receivables = receivables.aggregate(total=Sum('amount'))['total'] or 1
        collected = receivables.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0
        health.collection_rate = (collected / total_receivables * 100)
        
        # Cash buffer
        cash_position = AcShowCashPosition.objects.filter(
            business=business,
            date=today
        ).first()
        daily_expense = health.monthly_expenses / max(1, today.day)
        health.cash_buffer_days = (
            cash_position.closing_balance / daily_expense
            if cash_position and daily_expense > 0 else 0
        )
        
        # Pressure indicators
        health.due_pressure = AcShowTransaction.objects.filter(
            business=business,
            status='overdue',
            transaction_type='receivable'
        ).count()
        
        health.payment_pressure = AcShowTransaction.objects.filter(
            business=business,
            status='overdue',
            transaction_type='payable'
        ).count()
        
        health.calculate_health_score()
        health.save()


# ============================================
# REPORTS VIEWS
# ============================================

class CashflowReportView(APIView):
    """
    Cashflow analysis and reports.
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    
    def get(self, request):
        business = request.user.profile
        
        # Get date range
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Daily cashflow
        positions = AcShowCashPosition.objects.filter(
            business=business,
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')
        
        # Transaction summary
        transactions = AcShowTransaction.objects.filter(
            business=business,
            transaction_date__gte=start_date,
            transaction_date__lte=end_date,
            status='completed'
        )
        
        total_income = transactions.filter(
            transaction_type='income'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_expenses = transactions.filter(
            transaction_type='expense'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'period': {
                'start': start_date,
                'end': end_date,
                'days': days
            },
            'summary': {
                'total_income': total_income,
                'total_expenses': total_expenses,
                'net_cashflow': total_income - total_expenses,
                'average_daily_income': total_income / max(1, days),
                'average_daily_expense': total_expenses / max(1, days),
            },
            'daily_data': [
                {
                    'date': pos.date,
                    'cash_in': pos.total_cash_in,
                    'cash_out': pos.total_cash_out,
                    'closing_balance': pos.closing_balance
                }
                for pos in positions
            ]
        })