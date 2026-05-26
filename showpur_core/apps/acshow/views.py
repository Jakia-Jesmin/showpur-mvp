# apps/acshow/views.py

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Q, Count
from datetime import timedelta

from apps.accounts.models import BusinessProfile
from apps.connections.models import Contact
from .models import (
    AcShowTransaction, AcShowCashPosition, QuickRecord, 
    AcShowAlert, BusinessHealth
)
from .serializers import (
    AcShowTransactionListSerializer, AcShowTransactionCreateSerializer, AcShowTransactionDetailSerializer,
    TransactionStatusUpdateSerializer, AcShowCashPositionSerializer, CashPositionCreateSerializer,
    QuickRecordSerializer, AcShowAlertSerializer, AlertMarkReadSerializer,
    BusinessHealthSerializer, ContactSerializer, AcShowDashboardSerializer
)
from .permissions import HasAcShowAccess


def get_user_business(user):
    """Helper to ensure uniform BusinessProfile retrieval across all views."""
    business, _ = BusinessProfile.objects.get_or_create(
        user=user,
        defaults={'business_name': user.get_full_name() or f"{user.username}'s Business"}
    )
    return business


# ============================================
# DASHBOARD VIEWS
# ============================================

class AcShowDashboardView(APIView):
    """
    Main AcShow dashboard providing health updates, alerts, and transaction statuses.
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    
    def get(self, request):
        business = get_user_business(request.user)
        dashboard_data = AcShowDashboardSerializer.build_dashboard(business)
        
        return Response({
            'success': True,
            'data': dashboard_data.data,
            'message': f'Welcome back, {request.user.get_full_name() or request.user.username}! 👋'
        })


class DashboardSummaryCardsView(APIView):
    """
    Quick summary cards for dashboard top section tracking Cash, Receivables, Payables, and Health.
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    
    def get(self, request):
        business = get_user_business(request.user)
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
        ).aggregate(total=Sum('remaining_amount'))['total'] or 0
        
        # Pending payments
        pending_payments = AcShowTransaction.objects.filter(
            business=business,
            transaction_type='payable',
            status__in=['pending', 'overdue']
        ).aggregate(total=Sum('remaining_amount'))['total'] or 0
        
        # Health score lookup
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
                    'alert': f'৳{pending_collections} pending collection' if pending_collections > 0 else 'All clear!'
                },
                {
                    'title': '📤 To Pay',
                    'amount': pending_payments,
                    'trend': 'warning' if pending_payments > 0 else 'good',
                    'action': '/acshow/payables',
                    'alert': f'৳{pending_payments} pending payment' if pending_payments > 0 else 'Nothing due!'
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
    Complete transaction management with query parameters filtering capabilities.
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
        business = get_user_business(self.request.user)
        queryset = AcShowTransaction.objects.filter(business=business).select_related('created_by', 'product', 'contact')
        
        # Filters extraction
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
        
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(transaction_date__range=[start_date, end_date])
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(party_name__icontains=search) |
                Q(description__icontains=search) |
                Q(notes__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        transaction = self.get_object()
        serializer = TransactionStatusUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action_type = serializer.validated_data['action']
        business = get_user_business(request.user)
        
        if action_type == 'complete':
            transaction.status = 'completed'
            transaction.completed_date = timezone.now()
            transaction.paid_amount = transaction.amount
            transaction.remaining_amount = 0
            transaction.save()
            
            AcShowAlert.objects.create(
                business=business,
                alert_type='milestone',
                priority='low',
                title='Transaction Completed',
                message=f'Transaction of ৳{transaction.amount} completed',
                related_transaction=transaction
            )
            return Response({'success': True, 'message': 'Transaction marked as completed ✅'})
        
        elif action_type == 'cancel':
            transaction.status = 'cancelled'
            transaction.save()
            return Response({'success': True, 'message': 'Transaction cancelled'})
        
        elif action_type == 'update_payment':
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
        if not isinstance(request.data, list):
            return Response({'error': 'Expected a list of transactions'}, status=status.HTTP_400_BAD_REQUEST)
        
        created, errors = [], []
        for idx, item in enumerate(request.data):
            serializer = AcShowTransactionCreateSerializer(data=item, context={'request': request})
            if serializer.is_valid():
                transaction = serializer.save()
                created.append(AcShowTransactionListSerializer(transaction).data)
            else:
                errors.append({'index': idx, 'errors': serializer.errors})
        
        return Response({
            'success': len(errors) == 0,
            'created_count': len(created),
            'created': created,
            'errors': errors if errors else None
        }, status=status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS)


    @action(detail=False, methods=['get'])
    def summary(self, request):
        business = get_user_business(request.user)
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        monthly = AcShowTransaction.objects.filter(
            business=business,
            transaction_date__gte=month_start,
            transaction_date__lte=today
        )
        
        # Fixed calculation logic to include both pure instances and collected ledger settlements
        income = monthly.filter(transaction_type__in=['income', 'receivable']).aggregate(total=Sum('amount'))['total'] or 0
        expenses = monthly.filter(transaction_type__in=['expense', 'payable']).aggregate(total=Sum('amount'))['total'] or 0
        
        categories = monthly.values('transaction_category').annotate(
            total=Sum('amount'), count=Count('id')
        ).order_by('-total')
        
        total_receivables = AcShowTransaction.objects.filter(business=business, transaction_type='receivable')
        collected = total_receivables.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0
        total = total_receivables.aggregate(total=Sum('amount'))['total'] or 1
        
        return Response({
            'monthly': {
                'income': income,
                'expenses': expenses,
                'profit': income - expenses,
                'collection_rate': round((collected / total * 100), 1)
            },
            'categories': [{'category': cat['transaction_category'], 'total': cat['total'], 'count': cat['count']} for cat in categories]
        })


# ============================================
# QUICK RECORD VIEWS
# ============================================

class QuickRecordViewSet(viewsets.ModelViewSet):
    """
    Ultra-simple structural transaction points built primarily for optimization on low-end endpoints.
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    serializer_class = QuickRecordSerializer
    
    def get_queryset(self):
        business = get_user_business(self.request.user)
        return QuickRecord.objects.filter(business=business).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        records = self.get_queryset().filter(created_at__date=today)
        serializer = self.get_serializer(records, many=True)
        
        total_in = records.filter(entry_type__in=['collection', 'sale']).aggregate(total=Sum('amount'))['total'] or 0
        total_out = records.filter(entry_type__in=['payment', 'expense', 'purchase']).aggregate(total=Sum('amount'))['total'] or 0
        
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
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update']:
            return CashPositionCreateSerializer
        return AcShowCashPositionSerializer
    
    def get_queryset(self):
        business = get_user_business(self.request.user)
        return AcShowCashPosition.objects.filter(business=business).order_by('-date')
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        business = get_user_business(request.user)
        today = timezone.now().date()
        
        cash_position, created = AcShowCashPosition.objects.get_or_create(
            business=business,
            date=today,
            defaults={'opening_balance': self._get_previous_closing(business, today)}
        )
        
        if created or not cash_position.closing_balance:
            self._auto_calculate_position(cash_position)
        
        serializer = AcShowCashPositionSerializer(cash_position)
        return Response({'data': serializer.data, 'is_new': created})
    
    @action(detail=False, methods=['get'])
    def week_summary(self, request):
        business = get_user_business(request.user)
        today = timezone.now().date()
        week_ago = today - timedelta(days=6)
        
        positions = AcShowCashPosition.objects.filter(
            business=business, date__gte=week_ago, date__lte=today
        ).order_by('date')
        
        return Response({
            'dates': [{'date': pos.date, 'closing_balance': pos.closing_balance, 'cash_in': pos.total_cash_in, 'cash_out': pos.total_cash_out} for pos in positions],
            'trend': self._calculate_trend(positions)
        })
    
    def _get_previous_closing(self, business, current_date):
        yesterday = current_date - timedelta(days=1)
        prev = AcShowCashPosition.objects.filter(business=business, date=yesterday).first()
        return prev.closing_balance if prev else 0
    
    def _auto_calculate_position(self, cash_position):
        transactions = AcShowTransaction.objects.filter(
            business=cash_position.business,
            transaction_date=cash_position.date,
            status='completed'
        )
        # Fixed: Included completed receivables/payables in dynamic cash flows
        cash_in = transactions.filter(transaction_type__in=['income', 'receivable']).aggregate(total=Sum('amount'))['total'] or 0
        cash_out = transactions.filter(transaction_type__in=['expense', 'payable']).aggregate(total=Sum('amount'))['total'] or 0
        
        cash_position.total_cash_in = cash_in
        cash_position.total_cash_out = cash_out
        cash_position.calculate_closing()
        cash_position.save()
    
    def _calculate_trend(self, positions):
        if len(positions) < 2:
            return 'stable'
        first = positions[0].closing_balance
        last = positions[len(positions)-1].closing_balance
        if last > first * 1.1: return 'up'
        elif last < first * 0.9: return 'down'
        return 'stable'


# ============================================
# ALERT VIEWS
# ============================================

class AlertViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    serializer_class = AcShowAlertSerializer
    
    def get_queryset(self):
        business = get_user_business(self.request.user)
        return AcShowAlert.objects.filter(business=business, is_archived=False).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        business = get_user_business(request.user)
        count = AcShowAlert.objects.filter(business=business, is_read=False, is_archived=False).count()
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        business = get_user_business(request.user)
        AcShowAlert.objects.filter(business=business, is_read=False).update(is_read=True)
        return Response({'success': True, 'message': 'All alerts marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        serializer = AlertMarkReadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        business = get_user_business(request.user)
        alert_ids = serializer.validated_data['alert_ids']
        AcShowAlert.objects.filter(id__in=alert_ids, business=business).update(is_read=True)
        return Response({'success': True, 'message': f'{len(alert_ids)} alerts marked as read'})


# ============================================
# BUSINESS HEALTH VIEWS
# ============================================

class BusinessHealthView(APIView):
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    
    def get(self, request):
        business = get_user_business(request.user)
        health, _ = BusinessHealth.objects.get_or_create(business=business)
        
        if health.last_calculated < timezone.now() - timedelta(hours=1):
            self._update_health_metrics(health)
            
        serializer = BusinessHealthSerializer(health)
        return Response(serializer.data)
    
    def _update_health_metrics(self, health):
        business = health.business
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        transactions = AcShowTransaction.objects.filter(
            business=business, transaction_date__gte=month_start, status='completed'
        )
        
        # Fixed calculation indicators
        health.monthly_revenue = transactions.filter(transaction_type__in=['income', 'receivable']).aggregate(total=Sum('amount'))['total'] or 0
        health.monthly_expenses = transactions.filter(transaction_type__in=['expense', 'payable']).aggregate(total=Sum('amount'))['total'] or 0
        
        receivables = AcShowTransaction.objects.filter(business=business, transaction_type='receivable')
        total_receivables = receivables.aggregate(total=Sum('amount'))['total'] or 1
        collected = receivables.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0
        health.collection_rate = (collected / total_receivables * 100)
        
        cash_position = AcShowCashPosition.objects.filter(business=business, date=today).first()
        daily_expense = health.monthly_expenses / max(1, today.day)
        health.cash_buffer_days = (cash_position.closing_balance / daily_expense if cash_position and daily_expense > 0 else 0)
        
        health.due_pressure = AcShowTransaction.objects.filter(business=business, status='overdue', transaction_type='receivable').count()
        health.payment_pressure = AcShowTransaction.objects.filter(business=business, status='overdue', transaction_type='payable').count()
        
        health.calculate_health_score()
        health.save()


# ============================================
# REPORTS VIEWS
# ============================================

class CashflowReportView(APIView):
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    
    def get(self, request):
        business = get_user_business(request.user)
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        positions = AcShowCashPosition.objects.filter(business=business, date__gte=start_date, date__lte=end_date).order_by('date')
        transactions = AcShowTransaction.objects.filter(business=business, transaction_date__gte=start_date, transaction_date__lte=end_date, status='completed')
        
        # Fixed calculation aggregators
        total_income = transactions.filter(transaction_type__in=['income', 'receivable']).aggregate(total=Sum('amount'))['total'] or 0
        total_expenses = transactions.filter(transaction_type__in=['expense', 'payable']).aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'period': {'start': start_date, 'end': end_date, 'days': days},
            'summary': {
                'total_income': total_income,
                'total_expenses': total_expenses,
                'net_cashflow': total_income - total_expenses,
                'average_daily_income': total_income / max(1, days),
                'average_daily_expense': total_expenses / max(1, days),
            },
            'daily_data': [{'date': pos.date, 'cash_in': pos.total_cash_in, 'cash_out': pos.total_cash_out, 'closing_balance': pos.closing_balance} for pos in positions]
        })


class ContactViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    serializer_class = ContactSerializer
    
    def get_queryset(self):
        business = get_user_business(self.request.user)
        contact_type = self.request.query_params.get('type')
        queryset = Contact.objects.filter(business=business, is_active=True)
        if contact_type:
            queryset = queryset.filter(contact_type=contact_type)
        return queryset.order_by('company_name')

class StartTrialView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        from django.utils import timezone
        from datetime import timedelta
        
        user.acshow_trial_start = timezone.now()
        user.acshow_trial_end = timezone.now() + timedelta(days=14)
        user.acshow_enabled = True
        user.save()
        
        return Response({
            'success': True,
            'message': 'Trial started! 14 days free.',
            'trial_end': user.acshow_trial_end
        })
    