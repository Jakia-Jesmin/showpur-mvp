# core/models.py
from django.conf import settings
from django.db import models
from django.contrib.auth import get_user_model

# Get the User model
User = get_user_model() 

# 1. Business Profile Model (Owned by the all users)
class BusinessProfile(models.Model):
    # Link a user to their profile.
    # on_delete=models.CASCADE means if a user is deleted, their profile is too.
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='business_profile', null=True)
    ROLE_CHOICES = (('PRODUCER', 'Producer/Product Owner'), ('STORE', 'Showroom/Store'),)
    role = models.CharField(
        max_length=10, 
        choices=ROLE_CHOICES, 
        default='STORE' # Default new registrations to Store if not specified
    )
    business_name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    contact_email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    website = models.URLField(blank=True)
    facebook_page = models.URLField(blank=True)
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    cover_photo = models.ImageField(upload_to='covers/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.business_name} ({self.role})"
    
# 2. Product Model (Owned by the Producer/MSME)
class Product(models.Model):
    business_name = models.ForeignKey(BusinessProfile, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    description = models.TextField()
    
# Dual Pricing & Commission (CRITICAL for the model)
    wholesale_price = models.DecimalField(max_digits=10, decimal_places=2) 
    retail_price = models.DecimalField(max_digits=10, decimal_places=2)      
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2)    
    product_image = models.ImageField(upload_to='products/', blank=True, null=True)
    available_stock = models.IntegerField(
        default=0,
        help_text="Current number of units available for sale or allocation."
    )
    
    def __str__(self):
        return self.name

# 3. Inventory Allocation & Tracking (The "Stock")
# core/models.py

class InventoryAllocation(models.Model):
    # Define status choices for the allocation/request
    STATUS_CHOICES = (
        ('INITIATED', 'Initiated by Sender, Awaiting Receiver/Manager Action'),
        ('ACCEPTED', 'Accepted, Inventory Transferred'),
        ('REJECTED', 'Rejected'),
    )
    # 🛑 REQUIRED FIELD 1: Which product is being allocated (Inventory Source)
    product = models.ForeignKey(
        'Product', 
        on_delete=models.CASCADE, 
        related_name='allocations_made',
        help_text="The specific product that stock is being allocated from.")
    
    # 🛑 REQUIRED FIELD 2: Who is receiving the allocation (Inventory Destination)
    receiver = models.ForeignKey(
        'BusinessProfile', 
        on_delete=models.CASCADE, 
        related_name='received_allocations',
        help_text="The business profile that receives this allocation (the receiver).")
    
    # Optional but highly recommended (The business that owns the product/is sending)
    # This field ensures the source business is explicitly saved on the allocation record.
    sender = models.ForeignKey(
        'BusinessProfile',
        on_delete=models.CASCADE,
        related_name='sent_allocations',
        help_text="The business profile that owns the product (the sender).",)
    
    # Allocation Details
    quantity_allocated = models.PositiveIntegerField()
    quantity_remaining = models.PositiveIntegerField(
    help_text="The remaining quantity available at the receiving business.")
    sales_count = models.PositiveIntegerField(default=0)
    
    # 🛑 CRITICAL: The updated status field 🛑
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='INITIATED', # All new allocations start here
        help_text="Status of the allocation request or transfer."
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Allocation of {self.product.name} from {self.sender.business_name} to {self.receiver.business_name}"
    