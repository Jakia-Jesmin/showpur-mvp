# apps/acshow/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator
import uuid
from decimal import Decimal

class AcShowTransaction(models.Model):
    """
    Core financial transaction for AcShow.
    
    Business Logic:
    - Every money movement is tracked here
    - Simple categories that SME owners understand
    - Links to Showpur orders and producers
    - Supports both Showroom and Producer workflows
    
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
    
    CATEGORY_CHOICES = [
        ('sales', 'Product Sales'),
        ('service', 'Service Income'),
        ('commission', 'Commission'),
        ('rent', 'Rent'),
        ('salary', 'Staff Salary'),
        ('utility', 'Utilities'),
        ('inventory', 'Inventory Purchase'),
        ('marketing', 'Marketing'),
        ('transport', 'Transport'),
        ('other', 'Other'),
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
    description = models.TextField(
        help_text="What was this transaction for?"
    )
    category = models.CharField(
        max_length=50, 
        choices=CATEGORY_CHOICES, 
        default='other'
    )
    
    # Party information
    party_name = models.CharField(
        max_length=255, 
        blank=True,
        help_text="Who is this transaction with?"
    )
    party_phone = models.CharField(
        max_length=20, 
        blank=True,
        help_text="Contact number of the party"
    )
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
    transaction_date = models.DateField(
        default=timezone.now,
        help_text="When did this transaction happen?"
    )
    due_date = models.DateField(
        null=True, 
        blank=True,
        help_text="When is payment due?"
    )
    completed_date = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When was payment completed?"
    )
    
    # Status tracking
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    
    # Payment tracking
    paid_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="How much has been paid so far?"
    )
    remaining_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        null=True,
        blank=True,
        help_text="How much is still due?"
    )
    
    # Recurring transaction support
    is_recurring = models.BooleanField(
        default=False,
        help_text="Is this a recurring transaction?"
    )
    recurrence_pattern = models.CharField(
        max_length=50, 
        blank=True,
        choices=[
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
            ('monthly', 'Monthly'),
            ('yearly', 'Yearly'),
        ]
    )
    next_recurrence_date = models.DateField(
        null=True, 
        blank=True
    )
    
    # Metadata
    notes = models.TextField(
        blank=True,
        help_text="Any additional notes?"
    )
    receipt_image = models.ImageField(
        upload_to='acshow/receipts/', 
        blank=True, 
        null=True
    )
    
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
        ]
    
    def __str__(self):
        return f"{self.get_transaction_type_display()}: ৳{self.amount} - {self.party_name or 'N/A'}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate remaining amount
        if self.paid_amount and self.amount:
            self.remaining_amount = self.amount - self.paid_amount
        
        # Auto-update status based on payment
        if self.remaining_amount == 0 and self.status == 'pending':
            self.status = 'completed'
            self.completed_date = timezone.now()
        
        # Mark as overdue if past due date
        if (self.due_date and 
            self.due_date < timezone.now().date() and 
            self.status == 'pending'):
            self.status = 'overdue'
        
        super().save(*args, **kwargs)
    
    @property
    def is_overdue(self):
        """Check if transaction is overdue"""
        return self.status == 'overdue'
    
    @property
    def days_overdue(self):
        """Calculate days past due date"""
        if self.due_date and self.status in ['pending', 'overdue']:
            delta = timezone.now().date() - self.due_date
            return max(0, delta.days)
        return 0


class AcShowCashPosition(models.Model):
    """
    Daily cash position snapshot for AcShow.
    
    Business Logic:
    - Auto-calculated at the start/end of each day
    - Shows exactly how much cash is available
    - Tracks all cash movements for the day
    - Alerts for cash shortages
    
    For SME Users:
    - "Opening Balance" = Cash you started the day with
    - "Cash In" = All money you received today
    - "Cash Out" = All money you paid today
    - "Closing Balance" = Cash you have now
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        'accounts.BusinessProfile',
        on_delete=models.CASCADE,
        related_name='acshow_cash_positions'
    )
    date = models.DateField()
    
    # Balance information
    opening_balance = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Cash at start of day"
    )
    total_cash_in = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Total money received today"
    )
    total_cash_out = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Total money spent today"
    )
    closing_balance = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Cash at end of day"
    )
    
    # Detailed breakdowns
    cash_in_breakdown = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Breakdown of cash received by category"
    )
    # Example: {
    #     "sales": 50000,
    #     "collections": 25000,
    #     "other": 5000
    # }
    
    cash_out_breakdown = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Breakdown of cash spent by category"
    )
    # Example: {
    #     "inventory": 30000,
    #     "rent": 10000,
    #     "salary": 15000,
    #     "utilities": 5000
    # }
    
    # Alerts
    has_shortfall = models.BooleanField(
        default=False,
        help_text="Is there a cash shortage?"
    )
    shortfall_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="How much cash is missing?"
    )
    
    # Upcoming obligations
    upcoming_payables = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Total payments due in next 7 days"
    )
    upcoming_receivables = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Total collections expected in next 7 days"
    )
    
    # Metadata
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
        """Auto-calculate closing balance"""
        self.closing_balance = (
            self.opening_balance + 
            self.total_cash_in - 
            self.total_cash_out
        )
        return self.closing_balance
    
    @property
    def net_cash_flow(self):
        """Net cash flow for the day"""
        return self.total_cash_in - self.total_cash_out
    
    @property
    def cash_position_status(self):
        """Get overall cash position status"""
        if self.has_shortfall:
            return 'danger'
        elif self.closing_balance < 10000:  # Less than ৳10,000
            return 'warning'
        else:
            return 'healthy'


class QuickRecord(models.Model):
    """
    Ultra-simple transaction entry for daily operations.
    
    Design Philosophy:
    - SME owners think: "I got money" or "I paid money"
    - No accounting jargon
    - One-click entries for common transactions
    - Perfect for mobile use
    
    For SME Users:
    - "Collected Money" = Someone paid you
    - "Made Payment" = You paid someone
    - "Recorded Sale" = You sold something
    - "Made Purchase" = You bought something
    - "Paid Expense" = You paid a bill
    """
    
    ENTRY_TYPES = [
        ('collection', '💰 Collected Money'),
        ('payment', '💸 Made Payment'),
        ('sale', '🛒 Recorded Sale'),
        ('purchase', '📦 Made Purchase'),
        ('expense', '🧾 Paid Expense'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        'accounts.BusinessProfile',
        on_delete=models.CASCADE,
        related_name='acshow_quick_records'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='acshow_quick_records'
    )
    
    # Simple entry fields
    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPES)
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    description = models.TextField(
        help_text="What's this for? (e.g., 'Sold 5 bags of rice')"
    )
    
    # Optional details
    tag = models.CharField(
        max_length=50, 
        blank=True,
        help_text="Quick category (e.g., 'daily', 'weekly', 'one-time')"
    )
    party_name = models.CharField(
        max_length=255, 
        blank=True,
        help_text="Who is involved?"
    )
    
    # Payment tracking
    is_paid = models.BooleanField(
        default=True,
        help_text="Has the money been paid/received?"
    )
    due_date = models.DateField(
        null=True, 
        blank=True,
        help_text="If not paid, when is it due?"
    )
    
    # Timestamps
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
        """Convert quick record to full transaction if needed"""
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
            party_name=self.party_name,
            due_date=self.due_date,
            status='completed' if self.is_paid else 'pending'
        )


class AcShowAlert(models.Model):
    """
    Smart alerts for business health.
    
    Business Logic:
    - Proactive notifications
    - Helps prevent cashflow problems
    - Reminds about due collections
    - Warns about low stock
    
    For SME Users:
    - "⚠️ Payment due tomorrow"
    - "📥 Collect ৳5,000 from Karim"
    - "📊 Stock running low on rice"
    """
    
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
    business = models.ForeignKey(
        'accounts.BusinessProfile',
        on_delete=models.CASCADE,
        related_name='acshow_alerts'
    )
    
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Action information
    action_url = models.URLField(blank=True)
    action_label = models.CharField(max_length=100, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    
    # Link to related transaction
    related_transaction = models.ForeignKey(
        AcShowTransaction,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='alerts'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'acshow_alerts'
        ordering = ['-created_at']
        verbose_name = 'Alert'
        verbose_name_plural = 'Alerts'
    
    def __str__(self):
        return f"{self.get_alert_type_display()}: {self.title}"


class BusinessHealth(models.Model):
    """
    Overall business health metrics for AcShow dashboard.
    
    Business Logic:
    - Calculated weekly/monthly
    - Shows trends and patterns
    - Helps make business decisions
    
    For SME Users:
    - "Business is healthy" / "Needs attention"
    - See how business is doing at a glance
    """
    
    HEALTH_STATUS = [
        ('healthy', '✅ Healthy'),
        ('caution', '⚠️ Needs Attention'),
        ('critical', '🚨 Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.OneToOneField(
        'accounts.BusinessProfile',
        on_delete=models.CASCADE,
        related_name='acshow_health'
    )
    
    # Overall status
    health_status = models.CharField(
        max_length=20, 
        choices=HEALTH_STATUS, 
        default='healthy'
    )
    health_score = models.IntegerField(
        default=100,
        help_text="Business health score (0-100)"
    )
    
    # Key metrics
    monthly_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    monthly_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    collection_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        help_text="Percentage of dues collected on time"
    )
    cash_buffer_days = models.IntegerField(
        default=0,
        help_text="How many days can business run with current cash?"
    )
    
    # Pressure indicators
    due_pressure = models.IntegerField(
        default=0,
        help_text="Number of overdue collections"
    )
    payment_pressure = models.IntegerField(
        default=0,
        help_text="Number of urgent payments needed"
    )
    stock_pressure = models.IntegerField(
        default=0,
        help_text="Number of low stock items"
    )
    
    # Timestamps
    last_calculated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'acshow_health'
        verbose_name = 'Business Health'
        verbose_name_plural = 'Business Health'
    
    def __str__(self):
        return f"{self.business.business_name} - {self.get_health_status_display()}"
    
    def calculate_health_score(self):
        """Calculate overall health score based on metrics"""
        score = 100
        
        # Deduct for low collection rate
        if self.collection_rate < 70:
            score -= 20
        elif self.collection_rate < 85:
            score -= 10
        
        # Deduct for cash buffer
        if self.cash_buffer_days < 7:
            score -= 15
        elif self.cash_buffer_days < 14:
            score -= 5
        
        # Deduct for pressure indicators
        score -= min(30, self.due_pressure * 3)
        score -= min(20, self.payment_pressure * 2)
        score -= min(10, self.stock_pressure * 2)
        
        self.health_score = max(0, min(100, score))
        
        # Set status based on score
        if self.health_score >= 80:
            self.health_status = 'healthy'
        elif self.health_score >= 50:
            self.health_status = 'caution'
        else:
            self.health_status = 'critical'
        
        self.save()
        return self.health_score