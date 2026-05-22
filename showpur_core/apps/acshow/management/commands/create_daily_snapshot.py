from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, date
from apps.acshow.models import AcShowCashPosition, AcShowTransaction
from apps.accounts.models import BusinessProfile
from django.db.models import Sum

class Command(BaseCommand):
    help = 'Auto-create daily cash position snapshots for all businesses'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Specific date (YYYY-MM-DD). Default: yesterday',
        )

    def handle(self, *args, **options):
        target_date = options.get('date')
        
        if target_date:
            target_date = date.fromisoformat(target_date)
        else:
            target_date = timezone.now().date() - timedelta(days=1)

        businesses = BusinessProfile.objects.all()
        created_count = 0
        skipped_count = 0

        for business in businesses:
            # Skip if already exists
            if AcShowCashPosition.objects.filter(business=business, date=target_date).exists():
                skipped_count += 1
                continue

            # Get previous day's closing balance
            prev_date = target_date - timedelta(days=1)
            prev_position = AcShowCashPosition.objects.filter(
                business=business, date=prev_date
            ).first()
            opening_balance = prev_position.closing_balance if prev_position else 0

            # Calculate day's transactions
            day_transactions = AcShowTransaction.objects.filter(
                business=business,
                transaction_date=target_date,
                status='completed'
            )

            total_cash_in = day_transactions.filter(
                transaction_type='income'
            ).aggregate(total=Sum('amount'))['total'] or 0

            total_cash_out = day_transactions.filter(
                transaction_type='expense'
            ).aggregate(total=Sum('amount'))['total'] or 0

            # Calculate upcoming obligations
            upcoming_payables = AcShowTransaction.objects.filter(
                business=business,
                transaction_type='payable',
                status__in=['pending', 'overdue'],
                due_date__gte=target_date,
                due_date__lte=target_date + timedelta(days=7)
            ).aggregate(total=Sum('remaining_amount'))['total'] or 0

            upcoming_receivables = AcShowTransaction.objects.filter(
                business=business,
                transaction_type='receivable',
                status__in=['pending', 'overdue'],
                due_date__gte=target_date,
                due_date__lte=target_date + timedelta(days=7)
            ).aggregate(total=Sum('remaining_amount'))['total'] or 0

            # Create snapshot
            cash_position = AcShowCashPosition.objects.create(
                business=business,
                date=target_date,
                opening_balance=opening_balance,
                total_cash_in=total_cash_in,
                total_cash_out=total_cash_out,
                upcoming_payables=upcoming_payables,
                upcoming_receivables=upcoming_receivables,
            )
            cash_position.calculate_closing()
            cash_position.save()
            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Snapshot for {target_date}: {created_count} created, {skipped_count} skipped'
            )
        )