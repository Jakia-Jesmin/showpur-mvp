from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

User = settings.AUTH_USER_MODEL

class DisplayAgreement(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('terminated', 'Terminated'),
        ('completed', 'Completed'),
    ]
    
    FEE_TYPE_CHOICES = [
        ('monthly', 'Monthly Rent'),
        ('one_time', 'One Time Fee'),
        ('commission_only', 'Commission Only'),
        ('hybrid', 'Hybrid (Rent + Commission)'),
    ]
    
    # Relationships
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='display_agreements')
    showroom = models.ForeignKey(User, on_delete=models.CASCADE, related_name='display_agreements')
    connection = models.ForeignKey('connections.Connection', on_delete=models.CASCADE, related_name='display_agreements')
    
    # Agreement details
    agreement_number = models.CharField(max_length=50, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Display location
    shelf_location = models.CharField(max_length=200, blank=True, help_text="Specific location in showroom")
    display_area_sqft = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Dates
    start_date = models.DateField()
    end_date = models.DateField()
    actual_end_date = models.DateField(null=True, blank=True)
    
    # Financial terms
    fee_type = models.CharField(max_length=20, choices=FEE_TYPE_CHOICES, default='commission_only')
    agreed_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Display quantity
    units_displayed = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    min_units_to_display = models.IntegerField(default=1)
    max_units_to_display = models.IntegerField(null=True, blank=True)
    
    # Tracking
    units_sold = models.IntegerField(default=0)
    total_commission_earned = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_rent_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Terms
    terms_and_conditions = models.TextField(blank=True)
    special_instructions = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'display_agreements'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'start_date']),
            models.Index(fields=['showroom', 'status']),
            models.Index(fields=['product', 'status']),
        ]
    
    def __str__(self):
        return f"{self.product.name} @ {self.showroom.profile.business_name}"
    
    def save(self, *args, **kwargs):
        if not self.agreement_number:
            import uuid
            self.agreement_number = f"AGR-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    
    @property
    def is_active(self):
        today = timezone.now().date()
        return self.status == 'active' and self.start_date <= today <= self.end_date
    
    @property
    def remaining_days(self):
        if self.is_active:
            return (self.end_date - timezone.now().date()).days
        return 0
    
    @property
    def total_revenue(self):
        return self.total_commission_earned + self.total_rent_paid

class InventoryTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('display_start', 'Display Started'),
        ('display_end', 'Display Ended'),
        ('sale', 'Sale Made'),
        ('commission_paid', 'Commission Paid'),
        ('rent_paid', 'Rent Paid'),
        ('stock_update', 'Stock Updated'),
        ('return', 'Product Returned'),
        ('damage_report', 'Damage Reported'),
    ]
    
    display_agreement = models.ForeignKey(DisplayAgreement, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.IntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    
    # For sales tracking
    customer_name = models.CharField(max_length=200, blank=True)
    customer_email = models.EmailField(blank=True)
    sale_date = models.DateField(null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_transactions')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'inventory_transactions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.transaction_type} - {self.display_agreement.agreement_number}"

class InventoryAuditLog(models.Model):
    display_agreement = models.ForeignKey(DisplayAgreement, on_delete=models.CASCADE, related_name='audit_logs')
    previous_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changes = models.JSONField(default=dict)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'inventory_audit_logs'
        ordering = ['-changed_at']
    
    def __str__(self):
        return f"{self.display_agreement.agreement_number}: {self.previous_status} → {self.new_status}"