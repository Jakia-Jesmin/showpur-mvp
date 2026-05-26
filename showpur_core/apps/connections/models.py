import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils import timezone

class ConnectionRequest(models.Model):
    # Keep old fields for migration
    from_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_requests_old', null=True, blank=True)
    to_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_requests_old', null=True, blank=True)
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    REQUEST_TYPES = [
        ('producer_to_showroom', 'Producer → Showroom'),
        ('showroom_to_producer', 'Showroom → Producer'),
    ]
    
    # ✅ BusinessProfile-centric
    from_business = models.ForeignKey(
        'accounts.BusinessProfile',
        on_delete=models.CASCADE,
        related_name='sent_requests'
    )
    to_business = models.ForeignKey(
        'accounts.BusinessProfile',
        on_delete=models.CASCADE,
        related_name='received_requests'
    )
    request_type = models.CharField(max_length=30, choices=REQUEST_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    suggested_product_ids = models.JSONField(default=list, blank=True)
    message = models.TextField(blank=True)
    terms_conditions = models.TextField(blank=True)
    proposed_duration_days = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    proposed_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'connection_requests'
        ordering = ['-created_at']
        unique_together = ['from_business', 'to_business', 'request_type']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['from_business', 'to_business']),
        ]
    
    def __str__(self):
        return f"{self.from_business.business_name} → {self.to_business.business_name} ({self.status})"
    
    def accept(self):
        self.status = 'accepted'
        self.responded_at = timezone.now()
        self.save()
    
    def reject(self):
        self.status = 'rejected'
        self.responded_at = timezone.now()
        self.save()
    
    def cancel(self):
        self.status = 'cancelled'
        self.save()
    
    @property
    def is_expired(self):
        if self.expires_at and self.expires_at < timezone.now():
            return True
        return False
    
    @property
    def can_respond(self):
        return self.status == 'pending' and not self.is_expired


class Connection(models.Model):
    """Active connection between businesses after request accepted"""
    connection_request = models.OneToOneField(
        ConnectionRequest,
        on_delete=models.CASCADE,
        related_name='connection'
    )
    # ✅ BusinessProfile-centric
    producer = models.ForeignKey(
        'accounts.BusinessProfile',
        on_delete=models.CASCADE,
        related_name='active_connections_as_producer'
    )
    showroom = models.ForeignKey(
        'accounts.BusinessProfile',
        on_delete=models.CASCADE,
        related_name='active_connections_as_showroom'
    )
    
    is_active = models.BooleanField(default=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    shelf_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    class Meta:
        db_table = 'connections'
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.producer.business_name} ↔ {self.showroom.business_name}"
    
    def end_connection(self):
        self.is_active = False
        self.ended_at = timezone.now()
        self.save()


class Contact(models.Model):
    """
    Customers & Suppliers for any business.
    Can optionally link to a ShowPur BusinessProfile.
    """
    id = models.UUIDField(
        primary_key=True, 
        default=uuid.uuid4, 
        editable=False,
        help_text="Globally unique identifier for this specific contact record"
    )
    CONTACT_TYPES = [
        ('customer', '👤 Customer'),
        ('supplier', '🏭 Supplier'),
    ]
    
    business = models.ForeignKey(
        'accounts.BusinessProfile',
        on_delete=models.CASCADE,
        related_name='contacts'
    )
    contact_type = models.CharField(max_length=20, choices=CONTACT_TYPES)
    
    company_name = models.CharField(max_length=255)
    proprietor_name = models.CharField(max_length=255, blank=True)
    business_address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    
    # ✅ Optional link to ShowPur business
    linked_business = models.ForeignKey(
        'accounts.BusinessProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='linked_contacts',
        help_text="Link to existing ShowPur business if they join"
    )
    
    # Auto-calculated
    total_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'contacts'
        ordering = ['company_name']
        indexes = [
            models.Index(fields=['business', 'contact_type']),
            models.Index(fields=['business', 'is_active']),
            models.Index(fields=['phone']),
        ]
    
    def __str__(self):
        return f"{self.company_name} ({self.get_contact_type_display()})"
    