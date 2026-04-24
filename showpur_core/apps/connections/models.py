from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

User = settings.AUTH_USER_MODEL

class ConnectionRequest(models.Model):
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
    
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    request_type = models.CharField(max_length=30, choices=REQUEST_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Optional: producer can suggest which products to display
    suggested_product_ids = models.JSONField(default=list, blank=True)
    
    # Message and terms
    message = models.TextField(blank=True)
    terms_conditions = models.TextField(blank=True)
    
    # Duration and pricing (optional)
    proposed_duration_days = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    proposed_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'connection_requests'
        ordering = ['-created_at']
        unique_together = ['from_user', 'to_user']  # Prevent duplicate requests
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['from_user', 'to_user']),
        ]
    
    def __str__(self):
        return f"{self.from_user.email} → {self.to_user.email} ({self.status})"
    
    def accept(self):
        """Accept the connection request"""
        self.status = 'accepted'
        self.responded_at = models.DateTimeField.now()
        self.save()
    
    def reject(self):
        """Reject the connection request"""
        self.status = 'rejected'
        self.responded_at = models.DateTimeField.now()
        self.save()
    
    def cancel(self):
        """Cancel the connection request"""
        self.status = 'cancelled'
        self.save()
    
    @property
    def is_expired(self):
        """Check if request has expired"""
        from django.utils import timezone
        if self.expires_at and self.expires_at < timezone.now():
            return True
        return False
    
    @property
    def can_respond(self):
        """Check if current user can respond to this request"""
        return self.status == 'pending' and not self.is_expired

class Connection(models.Model):
    """Active connection between producer and showroom after request accepted"""
    connection_request = models.OneToOneField(ConnectionRequest, on_delete=models.CASCADE, related_name='connection')
    producer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='active_connections_as_producer')
    showroom = models.ForeignKey(User, on_delete=models.CASCADE, related_name='active_connections_as_showroom')
    
    is_active = models.BooleanField(default=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    # Business terms
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    shelf_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    class Meta:
        db_table = 'connections'
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.producer.email} ↔ {self.showroom.email}"
    
    def end_connection(self):
        """End the active connection"""
        from django.utils import timezone
        self.is_active = False
        self.ended_at = timezone.now()
        self.save()
        