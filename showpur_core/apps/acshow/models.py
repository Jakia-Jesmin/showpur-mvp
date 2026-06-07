from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator
import uuid
from decimal import Decimal
from showpur_core.apps.connections.models import Contact
from showpur_core.apps.ledger.models import Account


# ============================================================
# SHARED CHOICES
# ============================================================

SALE_SOURCE_CHOICES = [
    ('pos', 'Own Shop'),
    ('showroom', 'Showroom'),
    ('online', 'Online'),
    ('direct', 'Direct'),
    ('consignment', 'Consignment'),
    ('manual', 'Manual'),
]


# ============================================================
# CORE TRANSACTION
# ============================================================

class AcShowTransaction(models.Model):

    TRANSACTION_TYPES = [
        ('income', 'Income'),           # general money in (non-product)
        ('expense', 'Expense'),         # general money out (non-product)
        ('sale', 'Sale'),               # product sold to customer
        ('purchase', 'Purchase'),       # product bought from supplier
        ('receivable', 'Receivable'),   # standalone: money to collect
        ('payable', 'Payable'),         # standalone: money to pay
    ]

    # income / sale / receivable → increase AR or cash
    INCOME_TYPES = ('income', 'sale', 'receivable')
    # expense / purchase / payable → decrease cash or increase AP
    EXPENSE_TYPES = ('expense', 'purchase', 'payable')

    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('pending_edit', 'Edit Pending Approval'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('cash_hand', 'Cash in Hand'),
        ('cash_bank', 'Cash at Bank'),
        ('mixed', 'Cash Hand + Bank'),
        ('credit', 'Full Credit'),
        ('partial', 'Partial (Cash + Credit)'),
    ]

    SOURCE_CHOICES = [
        ('pos', 'POS Terminal'),
        ('manual', 'Manual Entry'),
        ('quick', 'Quick Record'),
        ('showpur', 'Showpur Order'),
        ('bulk', 'Bulk Import'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        'accounts.BusinessProfile', on_delete=models.CASCADE,
        related_name='acshow_transactions'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='acshow_transactions'
    )

    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    description = models.TextField()
    account = models.ForeignKey(
        Account, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='transactions'
    )

    # Payment split — how the amount was settled
    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash_hand'
    )
    cash_hand_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cash_bank_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    credit_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Portion on credit — creates AR (for sales) or AP (for purchases)"
    )

    # Legacy payment tracking (kept for compatibility)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Contact
    contact = models.ForeignKey(
        'connections.Contact', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='transactions'
    )
    party_name = models.CharField(max_length=255, blank=True)
    party_phone = models.CharField(max_length=20, blank=True)
    party_type = models.CharField(max_length=20, choices=[
        ('producer', 'Producer'), ('showroom', 'Showroom'),
        ('customer', 'Customer'), ('supplier', 'Supplier'),
        ('employee', 'Employee'), ('other', 'Other'),
    ], default='other')

    # Product
    product = models.ForeignKey(
        'products.Product', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='acshow_transactions'
    )
    quantity = models.DecimalField(
        max_digits=10, decimal_places=2, default=1,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    sale_source = models.CharField(max_length=20, choices=SALE_SOURCE_CHOICES, default='manual')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')

    # Dates
    transaction_date = models.DateField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Maker-checker audit trail
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='approved_transactions'
    )
    rejected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='rejected_transactions'
    )
    rejection_reason = models.TextField(blank=True)
    edited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='edited_transactions'
    )

    # Recurring
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(max_length=50, blank=True, choices=[
        ('daily', 'Daily'), ('weekly', 'Weekly'),
        ('monthly', 'Monthly'), ('yearly', 'Yearly'),
    ])
    next_recurrence_date = models.DateField(null=True, blank=True)

    notes = models.TextField(blank=True)
    receipt_image = models.ImageField(upload_to='acshow/receipts/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'acshow_transactions'
        ordering = ['-transaction_date', '-created_at']
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        indexes = [
            models.Index(fields=['business', 'transaction_type', 'status']),
            models.Index(fields=['business', 'transaction_date']),
            models.Index(fields=['due_date', 'status']),
            models.Index(fields=['account']),
        ]

    def __str__(self):
        return f"{self.get_transaction_type_display()}: {self.amount} - {self.party_name or 'N/A'}"

    def save(self, *args, **kwargs):
        # Recompute payment split totals
        cash_total = (self.cash_hand_amount or 0) + (self.cash_bank_amount or 0)
        self.paid_amount = cash_total
        self.credit_amount = max(self.amount - cash_total, Decimal('0'))
        self.remaining_amount = self.credit_amount

        # Derive payment_method label
        has_hand = (self.cash_hand_amount or 0) > 0
        has_bank = (self.cash_bank_amount or 0) > 0
        has_credit = self.credit_amount > 0
        if not has_credit:
            if has_hand and has_bank:
                self.payment_method = 'mixed'
            elif has_bank:
                self.payment_method = 'cash_bank'
            else:
                self.payment_method = 'cash_hand'
        elif not has_hand and not has_bank:
            self.payment_method = 'credit'
        else:
            self.payment_method = 'partial'

        super().save(*args, **kwargs)

    # ── Computed properties ───────────────────────────────────

    @property
    def is_overdue(self):
        if not self.due_date:
            return False
        return (
            self.status in ('pending',) and
            self.remaining_amount > 0 and
            self.due_date < timezone.now().date()
        )

    @property
    def days_overdue(self):
        if self.is_overdue:
            return (timezone.now().date() - self.due_date).days
        return 0

    @property
    def is_income_type(self):
        return self.transaction_type in self.INCOME_TYPES

    @property
    def is_expense_type(self):
        return self.transaction_type in self.EXPENSE_TYPES


# ============================================================
# CASH POSITION  (daily snapshot)
# ============================================================

class AcShowCashPosition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        'accounts.BusinessProfile', on_delete=models.CASCADE,
        related_name='acshow_cash_positions'
    )
    date = models.DateField()
    opening_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_cash_in = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_cash_out = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    closing_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cash_in_breakdown = models.JSONField(default=dict, blank=True)
    cash_out_breakdown = models.JSONField(default=dict, blank=True)
    has_shortfall = models.BooleanField(default=False)
    shortfall_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    upcoming_payables = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    upcoming_receivables = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'acshow_cash_positions'
        unique_together = ['business', 'date']
        ordering = ['-date']
        verbose_name = 'Cash Position'
        verbose_name_plural = 'Cash Positions'

    def __str__(self):
        return f"Cash Position {self.date}: {self.closing_balance}"

    def calculate_closing(self):
        self.closing_balance = self.opening_balance + self.total_cash_in - self.total_cash_out
        self.has_shortfall = self.closing_balance < 0
        self.shortfall_amount = abs(self.closing_balance) if self.has_shortfall else 0
        return self.closing_balance

    @property
    def net_cash_flow(self):
        return self.total_cash_in - self.total_cash_out

    @property
    def cash_position_status(self):
        if self.has_shortfall:
            return 'danger'
        elif self.closing_balance < 10000:
            return 'warning'
        return 'healthy'


# ============================================================
# QUICK RECORD  (fast daily entry — auto-creates a transaction)
# ============================================================

class QuickRecord(models.Model):
    ENTRY_TYPES = [
        ('collection', 'Collected Money'),
        ('payment', 'Made Payment'),
        ('sale', 'Recorded Sale'),
        ('purchase', 'Made Purchase'),
        ('expense', 'Paid Expense'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        'accounts.BusinessProfile', on_delete=models.CASCADE,
        related_name='acshow_quick_records'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='acshow_quick_records'
    )

    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPES)
    amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    description = models.TextField()

    contact = models.ForeignKey(
        'connections.Contact', on_delete=models.SET_NULL,
        null=True, blank=True
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='acshow_quick_records'
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    sale_source = models.CharField(max_length=20, choices=SALE_SOURCE_CHOICES, default='manual')
    account = models.ForeignKey(
        Account, on_delete=models.SET_NULL, null=True, blank=True
    )

    # Payment details
    cash_hand_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cash_bank_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=True)
    due_date = models.DateField(null=True, blank=True)
    party_name = models.CharField(max_length=255, blank=True)
    tag = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'acshow_quick_records'
        ordering = ['-created_at']
        verbose_name = 'Quick Record'
        verbose_name_plural = 'Quick Records'
        indexes = [
            models.Index(fields=['business', 'entry_type']),
            models.Index(fields=['business', 'created_at']),
        ]

    def __str__(self):
        return f"{self.get_entry_type_display()}: {self.amount}"

    def _map_transaction_type(self):
        mapping = {
            'collection': 'income',
            'sale': 'sale',
            'purchase': 'purchase',
            'payment': 'expense',
            'expense': 'expense',
        }
        return mapping.get(self.entry_type, 'income')

    def create_transaction(self):
        creator = self.created_by
        auto_approve = creator.can_self_approve if hasattr(creator, 'can_self_approve') else False

        return AcShowTransaction.objects.create(
            business=self.business,
            created_by=creator,
            transaction_type=self._map_transaction_type(),
            amount=self.amount,
            description=self.description,
            account=self.account,
            contact=self.contact,
            product=self.product,
            quantity=self.quantity,
            sale_source=self.sale_source,
            cash_hand_amount=self.cash_hand_amount,
            cash_bank_amount=self.cash_bank_amount,
            party_name=self.party_name,
            due_date=self.due_date,
            source='quick',
            status='approved' if auto_approve else 'pending',
        )


# ============================================================
# ALERT
# ============================================================

class AcShowAlert(models.Model):
    ALERT_TYPES = [
        ('payment_due', 'Payment Due'),
        ('collection_due', 'Collection Due'),
        ('low_cash', 'Low Cash Warning'),
        ('low_stock', 'Low Stock Alert'),
        ('overdue', 'Overdue Payment'),
        ('milestone', 'Business Milestone'),
    ]
    PRIORITY_CHOICES = [('high', 'High'), ('medium', 'Medium'), ('low', 'Low')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        'accounts.BusinessProfile', on_delete=models.CASCADE,
        related_name='acshow_alerts'
    )
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    title = models.CharField(max_length=255)
    message = models.TextField()
    action_url = models.URLField(blank=True)
    action_label = models.CharField(max_length=100, blank=True)
    is_read = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    related_transaction = models.ForeignKey(
        AcShowTransaction, on_delete=models.CASCADE,
        null=True, blank=True, related_name='alerts'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'acshow_alerts'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_alert_type_display()}: {self.title}"


# ============================================================
# BUSINESS HEALTH  (computed score — updated periodically)
# ============================================================

class BusinessHealth(models.Model):
    HEALTH_STATUS = [
        ('healthy', 'Healthy'),
        ('caution', 'Needs Attention'),
        ('critical', 'Critical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.OneToOneField(
        'accounts.BusinessProfile', on_delete=models.CASCADE,
        related_name='acshow_health'
    )
    health_status = models.CharField(max_length=20, choices=HEALTH_STATUS, default='healthy')
    health_score = models.IntegerField(default=100)
    monthly_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    monthly_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    collection_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cash_buffer_days = models.IntegerField(default=0)
    due_pressure = models.IntegerField(default=0)
    payment_pressure = models.IntegerField(default=0)
    stock_pressure = models.IntegerField(default=0)
    last_calculated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'acshow_health'
        verbose_name = 'Business Health'

    def __str__(self):
        return f"{self.business.business_name} — {self.get_health_status_display()}"

    def calculate_health_score(self):
        score = 100
        if self.collection_rate < 70:
            score -= 20
        elif self.collection_rate < 85:
            score -= 10
        if self.cash_buffer_days < 7:
            score -= 15
        elif self.cash_buffer_days < 14:
            score -= 5
        score -= min(30, self.due_pressure * 3)
        score -= min(20, self.payment_pressure * 2)
        score -= min(10, self.stock_pressure * 2)
        self.health_score = max(0, min(100, score))
        self.health_status = (
            'healthy' if self.health_score >= 80 else
            'caution' if self.health_score >= 50 else
            'critical'
        )
        self.save()
        return self.health_score
