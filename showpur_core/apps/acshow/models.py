# apps/acshow/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator
import uuid
from decimal import Decimal


# ============================================
# TRANSACTION CATEGORY (Chart of Accounts)
# ============================================

class TransactionCategory(models.Model):
    """
    Simple category system for transactions.
    SME-friendly — no accounting jargon.
    
    Two types: Money In (income) and Money Out (expense).
    Each business gets default categories automatically.
    """
    
    CATEGORY_TYPES = [
        ('income', '📥 Money In'),
        ('expense', '📤 Money Out'),
    ]
    
    business = models.ForeignKey(
        'accounts.BusinessProfile',
        on_delete=models.CASCADE,
        related_name='acshow_categories'
    )
    name = models.CharField(max_length=100)
    name_bn = models.CharField(max_length=100, blank=True, help_text="Bengali name")
    category_type = models.CharField(max_length=20, choices=CATEGORY_TYPES)
    icon = models.CharField(max_length=10, blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'acshow_categories'
        ordering = ['order', 'name']
        unique_together = ['business', 'name']
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
    
    def __str__(self):
        return f"{self.icon} {self.name}"


# ============================================
# CORE TRANSACTION
# ============================================

class AcShowTransaction(models.Model):
    """
    Core financial transaction for AcShow.
    
    For SME Users:
    - "Income" = Money you received
    - "Expense" = Money you spent  
    - "Receivable" = Money others owe you
    - "Payable" = Money you owe others
    """
    
    TRANSACTION_TYPES = [
        ('income', '💰 Income'),
        ('expense', '💸 Expense'),
        ('receivable', '📥 Money to Collect'),
        ('payable', '📤 Money to Pay'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('overdue', '⚠️ Overdue'),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        'accounts.BusinessProfile',
        on_delete=models.CASCADE,
        related_name='acshow_transactions'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='acshow_transactions'
    )
    
    # Transaction details
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Amount in BDT"
    )
    description = models.TextField(help_text="What was this transaction for?")
    
    # Category — now a ForeignKey instead of CharField
    transaction_category = models.ForeignKey(
        TransactionCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
        help_text="Transaction category"
    )
    
    # Party information
    party_name = models.CharField(max_length=255, blank=True, help_text="Who is this transaction with?")
    party_phone = models.CharField(max_length=20, blank=True, help_text="Contact number of the party")
    party_type = models.CharField(
        max_length=20,
        choices=[
            ('producer', 'Producer'),
            ('showroom', 'Showroom'),
            ('customer', 'Customer'),
            ('supplier', 'Supplier'),
            ('employee', 'Employee'),
            ('other', 'Other'),
        ],
        default='other'
    )
    
    # Link to Showpur entities
    linked_order = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acshow_transactions',
        help_text="Linked product if applicable"
    )
    linked_producer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acshow_transactions_as_party',
        help_text="Linked producer if transaction is with a producer"
    )
    
    # Dates
    transaction_date = models.DateField(default=timezone.now, help_text="When did this transaction happen?")
    due_date = models.DateField(null=True, blank=True, help_text="When is payment due?")
    completed_date = models.DateTimeField(null=True, blank=True, help_text="When was payment completed?")
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Payment tracking
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="How much has been paid so far?")
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="How much is still due?")
    
    # Source tracking
    SOURCE_CHOICES = [
        ('pos', 'POS Terminal'),
        ('manual', 'Manual Entry'),
        ('quick', 'Quick Record'),
        ('showpur', 'Showpur Order'),
        ('bulk', 'Bulk Import'),
    ]
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')
    
    # Recurring transaction support
    is_recurring = models.BooleanField(default=False, help_text="Is this a recurring transaction?")
    recurrence_pattern = models.CharField(max_length=50, blank=True, choices=[
        ('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('yearly', 'Yearly'),
    ])
    next_recurrence_date = models.DateField(null=True, blank=True)
    
    # Metadata
    notes = models.TextField(blank=True, help_text="Any additional notes?")
    receipt_image = models.ImageField(upload_to='acshow/receipts/', blank=True, null=True)
    
    # Timestamps
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
            models.Index(fields=['party_type', 'party_name']),
            models.Index(fields=['transaction_category']),
        ]
    
    def __str__(self):
        return f"{self.get_transaction_type_display()}: ৳{self.amount} - {self.party_name or 'N/A'}"
    
    def save(self, *args, **kwargs):
        if self.paid_amount and self.amount:
            self.remaining_amount = self.amount - self.paid_amount
        
        if self.remaining_amount == 0 and self.status == 'pending':
            self.status = 'completed'
            self.completed_date = timezone.now()
        
        if (self.due_date and 
            self.due_date < timezone.now().date() and 
            self.status == 'pending'):
            self.status = 'overdue'
        
        super().save(*args, **kwargs)
    
    @property
    def is_overdue(self):
        return self.status == 'overdue'
    
    @property
    def days_overdue(self):
        if self.due_date and self.status in ['pending', 'overdue']:
            delta = timezone.now().date() - self.due_date
            return max(0, delta.days)
        return 0


# ============================================
# CASH POSITION
# ============================================

class AcShowCashPosition(models.Model):
    """Daily cash position snapshot."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('accounts.BusinessProfile', on_delete=models.CASCADE, related_name='acshow_cash_positions')
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
        return f"Cash Position {self.date}: ৳{self.closing_balance}"
    
    def calculate_closing(self):
        self.closing_balance = self.opening_balance + self.total_cash_in - self.total_cash_out
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


# ============================================
# QUICK RECORD
# ============================================

class QuickRecord(models.Model):
    """Ultra-simple transaction entry for daily operations."""
    
    ENTRY_TYPES = [
        ('collection', '💰 Collected Money'),
        ('payment', '💸 Made Payment'),
        ('sale', '🛒 Recorded Sale'),
        ('purchase', '📦 Made Purchase'),
        ('expense', '🧾 Paid Expense'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('accounts.BusinessProfile', on_delete=models.CASCADE, related_name='acshow_quick_records')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='acshow_quick_records')
    
    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    description = models.TextField(help_text="What's this for?")
    
    # Category
    transaction_category = models.ForeignKey(TransactionCategory, on_delete=models.SET_NULL, null=True, blank=True)
    tag = models.CharField(max_length=50, blank=True)
    party_name = models.CharField(max_length=255, blank=True)
    is_paid = models.BooleanField(default=True)
    due_date = models.DateField(null=True, blank=True)
    
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
        return f"{self.get_entry_type_display()}: ৳{self.amount}"
    
    def create_transaction(self):
        if not self.is_paid:
            transaction_type = 'receivable' if self.entry_type == 'sale' else 'payable'
        else:
            transaction_type = 'income' if self.entry_type in ['collection', 'sale'] else 'expense'
        
        return AcShowTransaction.objects.create(
            business=self.business,
            created_by=self.created_by,
            transaction_type=transaction_type,
            amount=self.amount,
            description=self.description,
            transaction_category=self.transaction_category,
            party_name=self.party_name,
            due_date=self.due_date,
            source='quick',
            status='completed' if self.is_paid else 'pending'
        )


# ============================================
# ALERT
# ============================================

class AcShowAlert(models.Model):
    """Smart alerts for business health."""
    
    ALERT_TYPES = [
        ('payment_due', 'Payment Due'),
        ('collection_due', 'Collection Due'),
        ('low_cash', 'Low Cash Warning'),
        ('low_stock', 'Low Stock Alert'),
        ('overdue', 'Overdue Payment'),
        ('milestone', 'Business Milestone'),
    ]
    
    PRIORITY_CHOICES = [
        ('high', '🔴 High'),
        ('medium', '🟡 Medium'),
        ('low', '🟢 Low'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('accounts.BusinessProfile', on_delete=models.CASCADE, related_name='acshow_alerts')
    
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    action_url = models.URLField(blank=True)
    action_label = models.CharField(max_length=100, blank=True)
    
    is_read = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    
    related_transaction = models.ForeignKey(AcShowTransaction, on_delete=models.CASCADE, null=True, blank=True, related_name='alerts')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'acshow_alerts'
        ordering = ['-created_at']
        verbose_name = 'Alert'
        verbose_name_plural = 'Alerts'
    
    def __str__(self):
        return f"{self.get_alert_type_display()}: {self.title}"


# ============================================
# BUSINESS HEALTH
# ============================================

class BusinessHealth(models.Model):
    """Overall business health metrics."""
    
    HEALTH_STATUS = [
        ('healthy', '✅ Healthy'),
        ('caution', '⚠️ Needs Attention'),
        ('critical', '🚨 Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.OneToOneField('accounts.BusinessProfile', on_delete=models.CASCADE, related_name='acshow_health')
    
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
        verbose_name_plural = 'Business Health'
    
    def __str__(self):
        return f"{self.business.business_name} - {self.get_health_status_display()}"
    
    def calculate_health_score(self):
        score = 100
        if self.collection_rate < 70: score -= 20
        elif self.collection_rate < 85: score -= 10
        if self.cash_buffer_days < 7: score -= 15
        elif self.cash_buffer_days < 14: score -= 5
        score -= min(30, self.due_pressure * 3)
        score -= min(20, self.payment_pressure * 2)
        score -= min(10, self.stock_pressure * 2)
        self.health_score = max(0, min(100, score))
        
        if self.health_score >= 80: self.health_status = 'healthy'
        elif self.health_score >= 50: self.health_status = 'caution'
        else: self.health_status = 'critical'
        
        self.save()
        return self.health_score