# apps/acshow/models.py

from django.db import connections, models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator
import uuid
from decimal import Decimal
from apps.connections.models import Contact

# ============================================
# SHARED CHOICES
# ============================================

SALE_SOURCE_CHOICES = [
    ('pos', '🏪 Own Shop'),
    ('showroom', '🏬 Showroom'),
    ('online', '📱 Online'),
    ('direct', '👤 Direct'),
    ('consignment', '🤝 Consignment'),
    ('manual', '📋 Manual'),
]

SALE_TYPE_CHOICES = [
    ('own', 'Own Product'),
    ('commission', 'Commission/Consignment'),
]

# ============================================
# TRANSACTION CATEGORY (Chart of Accounts)
# ============================================

class TransactionCategory(models.Model):
    CATEGORY_TYPES = [
        ('income', '📥 Money In'),
        ('expense', '📤 Money Out'),
    ]
    business = models.ForeignKey('accounts.BusinessProfile', on_delete=models.CASCADE, related_name='acshow_categories')
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
# CONTACT (Customers & Suppliers)
# ============================================

class Contact(models.Model):
    CONTACT_TYPES = [
        ('customer', '👤 Customer'),
        ('supplier', '🏭 Supplier'),
        ('agent', '🤝 Agent'),
    ]
    
    business = models.ForeignKey('accounts.BusinessProfile', on_delete=models.CASCADE, related_name='acshow_contacts')
    contact_type = models.CharField(max_length=20, choices=CONTACT_TYPES)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    total_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'acshow_contacts'
        ordering = ['name']
        unique_together = ['business', 'name', 'contact_type']
    
    def __str__(self):
        return f"{self.get_contact_type_display()} {self.name}"

# ============================================
# CORE TRANSACTION
# ============================================

class AcShowTransaction(models.Model):
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
    
    SOURCE_CHOICES = [
        ('pos', 'POS Terminal'),
        ('manual', 'Manual Entry'),
        ('quick', 'Quick Record'),
        ('showpur', 'Showpur Order'),
        ('bulk', 'Bulk Import'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('accounts.BusinessProfile', on_delete=models.CASCADE, related_name='acshow_transactions')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='acshow_transactions')
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    description = models.TextField(help_text="What was this transaction for?")
    transaction_category = models.ForeignKey(TransactionCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    
    # Contact
    contact = models.ForeignKey('connections.Contact', on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions', help_text="Linked customer or supplier")
    
    # Party
    party_name = models.CharField(max_length=255, blank=True)
    party_phone = models.CharField(max_length=20, blank=True)
    party_type = models.CharField(max_length=20, choices=[
        ('producer', 'Producer'), ('showroom', 'Showroom'), ('customer', 'Customer'),
        ('supplier', 'Supplier'), ('employee', 'Employee'), ('other', 'Other'),
    ], default='other')
    
    # Product
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, blank=True, related_name='acshow_transactions')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1, validators=[MinValueValidator(Decimal('0.01'))])
    linked_producer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='acshow_transactions_as_party')
    
    # Sale context
    sale_source = models.CharField(max_length=20, choices=SALE_SOURCE_CHOICES, default='manual')
    sale_type = models.CharField(max_length=20, choices=SALE_TYPE_CHOICES, default='own')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')
    
    # Dates
    transaction_date = models.DateField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    
    # Status & Payment
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Recurring
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(max_length=50, blank=True, choices=[
        ('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('yearly', 'Yearly'),
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
        if self.due_date and self.due_date < timezone.now().date() and self.status == 'pending':
            self.status = 'overdue'
        super().save(*args, **kwargs)
    
    @property
    def is_overdue(self):
        return self.status == 'overdue'
    
    @property
    def days_overdue(self):
        if self.due_date and self.status in ['pending', 'overdue']:
            return max(0, (timezone.now().date() - self.due_date).days)
        return 0

# ============================================
# CASH POSITION
# ============================================

class AcShowCashPosition(models.Model):
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
        if self.has_shortfall: return 'danger'
        elif self.closing_balance < 10000: return 'warning'
        return 'healthy'

# ============================================
# QUICK RECORD
# ============================================

class QuickRecord(models.Model):
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
    
    contact = models.ForeignKey('connections.Contact', on_delete=models.SET_NULL, null=True, blank=True, help_text="Linked customer or supplier")
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, blank=True, related_name='acshow_quick_records')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    sale_source = models.CharField(max_length=20, choices=SALE_SOURCE_CHOICES, default='manual')
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
        transaction_type = 'receivable' if (self.entry_type == 'sale' and not self.is_paid) else \
                          'payable' if (self.entry_type == 'purchase' and not self.is_paid) else \
                          'income' if self.entry_type in ['collection', 'sale'] else 'expense'
        
        return AcShowTransaction.objects.create(
            business=self.business,
            created_by=self.created_by,
            transaction_type=transaction_type,
            amount=self.amount,
            description=self.description,
            transaction_category=self.transaction_category,
            contact=self.contact,
            product=self.product,
            quantity=self.quantity,
            sale_source=self.sale_source,
            party_name=self.party_name,
            due_date=self.due_date,
            source='quick',
            status='completed' if self.is_paid else 'pending'
        )

# ============================================
# ALERT
# ============================================

class AcShowAlert(models.Model):
    ALERT_TYPES = [
        ('payment_due', 'Payment Due'), ('collection_due', 'Collection Due'),
        ('low_cash', 'Low Cash Warning'), ('low_stock', 'Low Stock Alert'),
        ('overdue', 'Overdue Payment'), ('milestone', 'Business Milestone'),
    ]
    PRIORITY_CHOICES = [('high', '🔴 High'), ('medium', '🟡 Medium'), ('low', '🟢 Low')]
    
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
    HEALTH_STATUS = [('healthy', '✅ Healthy'), ('caution', '⚠️ Needs Attention'), ('critical', '🚨 Critical')]
    
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
        self.health_status = 'healthy' if self.health_score >= 80 else 'caution' if self.health_score >= 50 else 'critical'
        self.save()
        return self.health_score