from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db.models import Sum, Q
from datetime import timedelta

from showpur_core.apps.accounts.models import BusinessProfile
from showpur_core.apps.connections.models import Contact
from .models import (
    AcShowTransaction, AcShowCashPosition, QuickRecord,
    AcShowAlert, BusinessHealth,
)
from .serializers import (
    AcShowDashboardSerializer,
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
    ContactSerializer,
    compute_account_balances,
    compute_daily_pl,
    compute_daily_cash_position,
    compute_7day_forecast,
    _sum,
)
from .permissions import HasAcShowAccess, IsMaker, IsChecker, CanApproveTransaction
from .selectors.business_pulse import (
    get_daily_business_pulse,
    get_inventory_quality_report,
    get_receivables_aging_report,
)


def get_business(user):
    business, _ = BusinessProfile.objects.get_or_create(
        user=user,
        defaults={'business_name': user.get_full_name() or f"{user.username}'s Business",
                  'location': ''}
    )
    return business


# ============================================================
# DASHBOARD
# ============================================================

class AcShowDashboardView(APIView):
    """
    Full dashboard: account balances, daily cash position, daily P&L,
    overdue summary, 7-day cashflow forecast.
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]

    def get(self, request):
        business = get_business(request.user)
        serializer = AcShowDashboardSerializer.build(business)
        return Response({'success': True, 'data': serializer.data})


class DashboardSummaryCardsView(APIView):
    """
    4 summary cards:
      Cash in Hand | Cash at Bank | Accounts Receivable | Accounts Payable
    Plus: Daily P&L and overdue count.
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]

    def get(self, request):
        business = get_business(request.user)
        today = timezone.now().date()

        balances = compute_account_balances(business)
        pl       = compute_daily_pl(business, today)
        cash_pos = compute_daily_cash_position(business, today)

        overdue_count = AcShowTransaction.objects.filter(
            business=business,
            status='pending',
            remaining_amount__gt=0,
            due_date__lt=today,
        ).count()

        return Response({
            'cards': [
                {
                    'title': 'Cash in Hand',
                    'amount': balances['cash_in_hand'],
                    'action_url': '/acshow/cashflow',
                },
                {
                    'title': 'Cash at Bank',
                    'amount': balances['cash_at_bank'],
                    'action_url': '/acshow/cashflow',
                },
                {
                    'title': 'Accounts Receivable',
                    'amount': balances['accounts_receivable'],
                    'subtitle': 'Dues from customers',
                    'action_url': '/acshow/receivables',
                },
                {
                    'title': 'Accounts Payable',
                    'amount': balances['accounts_payable'],
                    'subtitle': 'Dues to suppliers',
                    'action_url': '/acshow/payables',
                },
            ],
            'daily_pl': pl,
            'daily_cash_position': cash_pos,
            'overdue_count': overdue_count,
        })


# ============================================================
# TRANSACTIONS
# ============================================================

class TransactionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class TransactionViewSet(viewsets.ModelViewSet):
    pagination_class = TransactionPagination
    permission_classes = [IsAuthenticated, HasAcShowAccess]

    def get_serializer_class(self):
        if self.action == 'list':
            return AcShowTransactionListSerializer
        if self.action == 'create':
            return AcShowTransactionCreateSerializer
        if self.action in ('retrieve', 'update', 'partial_update'):
            return AcShowTransactionDetailSerializer
        if self.action == 'update_status':
            return TransactionStatusUpdateSerializer
        return AcShowTransactionListSerializer

    def get_queryset(self):
        business = get_business(self.request.user)
        qs = AcShowTransaction.objects.filter(business=business).select_related(
            'created_by', 'product', 'contact', 'account',
            'approved_by', 'rejected_by',
        )

        p = self.request.query_params

        t_type = p.get('type')
        if t_type:
            qs = qs.filter(transaction_type=t_type)

        # Receivables = sale + receivable + income with outstanding balance
        if p.get('receivables_only') == '1':
            qs = qs.filter(
                transaction_type__in=('receivable', 'sale', 'income'),
                remaining_amount__gt=0,
            )

        # Payables = purchase + payable + expense with outstanding balance
        if p.get('payables_only') == '1':
            qs = qs.filter(
                transaction_type__in=('payable', 'purchase', 'expense'),
                remaining_amount__gt=0,
            )

        # Overdue: pending, past due, has remaining
        if p.get('overdue') == '1':
            qs = qs.filter(
                status='pending',
                remaining_amount__gt=0,
                due_date__lt=timezone.now().date(),
            )

        s = p.get('status')
        if s:
            qs = qs.filter(status=s)

        cat = p.get('category')
        if cat:
            qs = qs.filter(account_id=cat)

        party_type = p.get('party_type')
        if party_type:
            qs = qs.filter(party_type=party_type)

        start = p.get('start_date')
        end   = p.get('end_date')
        if start and end:
            qs = qs.filter(transaction_date__range=[start, end])

        q = p.get('search')
        if q:
            qs = qs.filter(
                Q(party_name__icontains=q) |
                Q(description__icontains=q) |
                Q(notes__icontains=q)
            )

        return qs.order_by('-transaction_date', '-created_at')

    # ── Maker-Checker actions ────────────────────────────────

    @action(detail=True, methods=['post'],
            permission_classes=[IsAuthenticated, IsChecker, CanApproveTransaction])
    def approve(self, request, pk=None):
        txn = self.get_object()
        if txn.status not in ('pending', 'pending_edit'):
            return Response({'error': 'Only pending transactions can be approved.'}, status=400)
        txn.status = 'approved'
        txn.approved_by = request.user
        txn.save()
        return Response({'message': 'Transaction approved.', 'status': txn.status})

    @action(detail=True, methods=['post'],
            permission_classes=[IsAuthenticated, IsChecker, CanApproveTransaction])
    def reject(self, request, pk=None):
        txn = self.get_object()
        if txn.status not in ('pending', 'pending_edit'):
            return Response({'error': 'Only pending transactions can be rejected.'}, status=400)
        txn.status = 'rejected'
        txn.rejected_by = request.user
        txn.rejection_reason = request.data.get('reason', '')
        txn.save()
        return Response({'message': 'Transaction rejected.', 'status': txn.status})

    @action(detail=True, methods=['put'],
            permission_classes=[IsAuthenticated, IsMaker])
    def submit_edit(self, request, pk=None):
        txn = self.get_object()
        if txn.status != 'approved':
            return Response({'error': 'Only approved transactions can be edited.'}, status=400)
        serializer = AcShowTransactionCreateSerializer(
            txn, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(status='pending_edit', edited_by=request.user)
        return Response({'message': 'Edit submitted for approval.', 'status': 'pending_edit'})

    # ── Payment collection / mark complete ──────────────────

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        txn = self.get_object()
        serializer = TransactionStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        act = serializer.validated_data['action']

        if act == 'complete':
            txn.cash_hand_amount = txn.amount  # treat as fully collected/paid in cash
            txn.cash_bank_amount = 0
            txn.status = 'approved'
            txn.save()
            return Response({'success': True, 'message': 'Transaction marked as fully paid.'})

        elif act == 'cancel':
            txn.status = 'rejected'
            txn.save()
            return Response({'success': True, 'message': 'Transaction cancelled.'})

        elif act == 'update_payment':
            from decimal import Decimal
            paid = Decimal(str(serializer.validated_data['paid_amount']))
            current = (txn.cash_hand_amount or Decimal('0')) + (txn.cash_bank_amount or Decimal('0'))
            outstanding = max(txn.amount - current, Decimal('0'))
            payment = min(paid, outstanding)
            txn.cash_hand_amount = (txn.cash_hand_amount or Decimal('0')) + payment
            txn.save()  # save() recalculates remaining_amount and credit_amount
            if txn.remaining_amount == 0:
                txn.status = 'approved'
                txn.save()
            return Response({
                'success': True,
                'message': f'Payment of {payment} recorded.',
                'remaining': txn.remaining_amount,
            })

    # ── Collect payment via service (updates Daily Pulse) ───
    @action(detail=True, methods=['post'])
    def collect(self, request, pk=None):
        from decimal import Decimal
        from .services.ledger_core import record_collection_payment

        txn = self.get_object()
        raw_amount = request.data.get('amount')
        payment_method = (request.data.get('payment_method', 'CASH') or 'CASH').upper()

        if not raw_amount:
            return Response({'error': 'amount is required.'}, status=400)
        if payment_method not in ('CASH', 'BANK'):
            return Response({'error': 'payment_method must be CASH or BANK.'}, status=400)

        try:
            record_collection_payment(txn, Decimal(str(raw_amount)), payment_method, request.user)
            txn.refresh_from_db()
            return Response({
                'success': True,
                'remaining': str(txn.remaining_amount),
                'message': f'Collection of ৳{raw_amount} recorded.',
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=400)

    # ── Monthly summary ──────────────────────────────────────

    @action(detail=False, methods=['get'])
    def summary(self, request):
        business = get_business(request.user)
        today = timezone.now().date()
        month_start = today.replace(day=1)

        monthly = AcShowTransaction.objects.filter(
            business=business,
            transaction_date__gte=month_start,
            transaction_date__lte=today,
            status='approved',
        )

        income    = _sum(monthly.filter(transaction_type__in=('income', 'sale')))
        purchases = _sum(monthly.filter(transaction_type='purchase'))
        expenses  = _sum(monthly.filter(transaction_type='expense'))
        collected = _sum(monthly.filter(transaction_type='receivable'))
        paid_out  = _sum(monthly.filter(transaction_type='payable'))

        return Response({
            'period': {'start': month_start, 'end': today},
            'income': income,
            'purchases': purchases,
            'expenses': expenses,
            'collected': collected,
            'paid_out': paid_out,
            'gross_profit': income - purchases,
            'net_profit': income - purchases - expenses,
        })

    # ── Bulk create ──────────────────────────────────────────

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        if not isinstance(request.data, list):
            return Response({'error': 'Expected a list.'}, status=400)
        created, errors = [], []
        for i, item in enumerate(request.data):
            s = AcShowTransactionCreateSerializer(data=item, context={'request': request})
            if s.is_valid():
                created.append(AcShowTransactionListSerializer(s.save()).data)
            else:
                errors.append({'index': i, 'errors': s.errors})
        return Response({
            'created_count': len(created),
            'created': created,
            'errors': errors or None,
        }, status=201 if not errors else 207)


# ============================================================
# QUICK RECORD
# ============================================================

class QuickRecordViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    serializer_class = QuickRecordSerializer

    def get_queryset(self):
        return QuickRecord.objects.filter(
            business=get_business(self.request.user)
        ).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        records = self.get_queryset().filter(created_at__date=today)
        total_in  = _sum(records.filter(entry_type__in=('collection', 'sale')))
        total_out = _sum(records.filter(entry_type__in=('payment', 'expense', 'purchase')))
        return Response({
            'records': self.get_serializer(records, many=True).data,
            'summary': {
                'total_in': total_in,
                'total_out': total_out,
                'net': total_in - total_out,
                'count': records.count(),
            },
        })


# ============================================================
# CASH POSITION
# ============================================================

class CashPositionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasAcShowAccess]

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return CashPositionCreateSerializer
        return AcShowCashPositionSerializer

    def get_queryset(self):
        return AcShowCashPosition.objects.filter(
            business=get_business(self.request.user)
        ).order_by('-date')

    @action(detail=False, methods=['get'])
    def today(self, request):
        business = get_business(request.user)
        data = compute_daily_cash_position(business)
        return Response({'data': data})

    @action(detail=False, methods=['get'])
    def week_summary(self, request):
        business = get_business(request.user)
        today = timezone.now().date()
        week_ago = today - timedelta(days=6)
        positions = AcShowCashPosition.objects.filter(
            business=business, date__gte=week_ago, date__lte=today
        ).order_by('date')
        return Response({
            'dates': AcShowCashPositionSerializer(positions, many=True).data,
            'forecast_7day': compute_7day_forecast(business),
        })


# ============================================================
# ALERTS
# ============================================================

class AlertViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    serializer_class = AcShowAlertSerializer

    def get_queryset(self):
        return AcShowAlert.objects.filter(
            business=get_business(self.request.user), is_archived=False
        ).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'success': True})

    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        s = AlertMarkReadSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        business = get_business(request.user)
        AcShowAlert.objects.filter(
            id__in=s.validated_data['alert_ids'], business=business
        ).update(is_read=True)
        return Response({'success': True})


# ============================================================
# BUSINESS HEALTH
# ============================================================

class BusinessHealthView(APIView):
    permission_classes = [IsAuthenticated, HasAcShowAccess]

    def get(self, request):
        business = get_business(request.user)
        health, _ = BusinessHealth.objects.get_or_create(business=business)

        if health.last_calculated < timezone.now() - timedelta(hours=1):
            self._refresh(health)

        return Response(BusinessHealthSerializer(health).data)

    def _refresh(self, health):
        business = health.business
        today = timezone.now().date()
        month_start = today.replace(day=1)

        approved_month = AcShowTransaction.objects.filter(
            business=business, transaction_date__gte=month_start, status='approved'
        )
        health.monthly_revenue  = _sum(approved_month.filter(transaction_type__in=('income', 'sale')))
        health.monthly_expenses = _sum(approved_month.filter(transaction_type__in=('expense', 'purchase')))

        total_recv = AcShowTransaction.objects.filter(
            business=business, transaction_type__in=('receivable', 'sale', 'income')
        )
        total_amount    = _sum(total_recv)
        collected_amount = _sum(total_recv.filter(status='approved'))
        health.collection_rate = (
            round((collected_amount / total_amount) * 100, 2) if total_amount else 100
        )

        balances = compute_account_balances(business)
        daily_exp = health.monthly_expenses / max(1, today.day)
        total_cash = balances['cash_in_hand'] + balances['cash_at_bank']
        health.cash_buffer_days = int(total_cash / daily_exp) if daily_exp > 0 else 999

        health.due_pressure = AcShowTransaction.objects.filter(
            business=business,
            transaction_type__in=('receivable', 'sale', 'income'),
            status='pending', remaining_amount__gt=0, due_date__lt=today,
        ).count()
        health.payment_pressure = AcShowTransaction.objects.filter(
            business=business,
            transaction_type__in=('payable', 'purchase', 'expense'),
            status='pending', remaining_amount__gt=0, due_date__lt=today,
        ).count()

        health.calculate_health_score()


# ============================================================
# CASHFLOW REPORT
# ============================================================

class CashflowReportView(APIView):
    permission_classes = [IsAuthenticated, HasAcShowAccess]

    def get(self, request):
        business = get_business(request.user)
        days = int(request.query_params.get('days', 30))
        today = timezone.now().date()
        start = today - timedelta(days=days - 1)

        txns = AcShowTransaction.objects.filter(
            business=business, transaction_date__range=[start, today], status='approved'
        )

        total_income    = _sum(txns.filter(transaction_type__in=('income', 'sale')))
        total_collected = _sum(txns.filter(transaction_type='receivable'))
        total_purchase  = _sum(txns.filter(transaction_type='purchase'))
        total_expenses  = _sum(txns.filter(transaction_type='expense'))
        total_paid_out  = _sum(txns.filter(transaction_type='payable'))

        cash_in  = total_income + total_collected
        cash_out = total_purchase + total_expenses + total_paid_out

        positions = AcShowCashPosition.objects.filter(
            business=business, date__range=[start, today]
        ).order_by('date')

        return Response({
            'period': {'start': start, 'end': today, 'days': days},
            'summary': {
                'total_income': total_income,
                'total_collected': total_collected,
                'total_purchase': total_purchase,
                'total_expenses': total_expenses,
                'total_paid_out': total_paid_out,
                'net_cashflow': cash_in - cash_out,
                'gross_profit': total_income - total_purchase,
            },
            'daily_positions': AcShowCashPositionSerializer(positions, many=True).data,
            'forecast_7day': compute_7day_forecast(business),
        })


# ============================================================
# CONTACTS
# ============================================================

class ContactViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasAcShowAccess]
    serializer_class = ContactSerializer

    def get_queryset(self):
        business = get_business(self.request.user)
        qs = Contact.objects.filter(business=business, is_active=True)
        t = self.request.query_params.get('type')
        if t:
            qs = qs.filter(contact_type=t)
        return qs.order_by('company_name')


# ============================================================
# CATEGORIES
# ============================================================



# ============================================================
# TRIAL ACTIVATION
# ============================================================

class StartTrialView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.acshow_enabled:
            return Response({'message': 'AcShow is already active.'})
        user.acshow_trial_start = timezone.now()
        user.acshow_trial_end   = timezone.now() + timedelta(days=14)
        user.acshow_enabled     = True
        user.save()
        return Response({
            'success': True,
            'message': '14-day free trial started.',
            'trial_end': user.acshow_trial_end,
        })


# ============================================================
# FLOOR 1: DAILY BUSINESS PULSE
# GET /api/v1/acshow/dashboard-pulse/
# ============================================================

class DashboardPulseView(APIView):
    """
    The 5 critical numbers for today: cash available, sales, gross profit,
    collections, withdrawals, and net cash change.
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]

    def get(self, request):
        business = get_business(request.user)
        pulse = get_daily_business_pulse(business)
        return Response({'success': True, 'data': pulse})


# ============================================================
# FLOOR 1: INVENTORY QUALITY
# GET /api/v1/acshow/inventory-quality/
# ============================================================

class InventoryQualityView(APIView):
    """
    Classify outstanding showroom inventory by age: HEALTHY / WATCH / RISK / DEAD STOCK.
    Returns total and per-bucket values plus a line-item breakdown.
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]

    def get(self, request):
        business = get_business(request.user)
        report = get_inventory_quality_report(business)
        return Response({'success': True, 'data': report})


# ============================================================
# FLOOR 1: RECEIVABLES AGING REPORT
# GET /api/v1/acshow/aging-report/
# ============================================================

class AgingReportView(APIView):
    """
    Bucket all outstanding receivables by how overdue they are:
    current, 1-30, 31-60, 61-90, 90+ days.
    """
    permission_classes = [IsAuthenticated, HasAcShowAccess]

    def get(self, request):
        business = get_business(request.user)
        report = get_receivables_aging_report(business)
        return Response({'success': True, 'data': report})
