# core/models.py

from django.db import models
from django.contrib.auth.models import User

class BusinessProfile(models.Model):
    # Link a user to their profile.
    # on_delete=models.CASCADE means if a user is deleted, their profile is too.
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    business_name = models.CharField(max_length=255)
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
        return self.business_name
    
    # 1. Product Model (Owned by the Producer/MSME)
class Product(models.Model):
    business = models.ForeignKey(BusinessProfile, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    description = models.TextField()
    
    # Dual Pricing & Commission (CRITICAL for the model)
    wholesale_price = models.DecimalField(max_digits=10, decimal_places=2) 
    retail_price = models.DecimalField(max_digits=10, decimal_places=2)      
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2)    
    
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    
    def __str__(self):
        return self.name

# 2. Inventory Allocation & Tracking (The "Stock")
class InventoryAllocation(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='allocations')
    
    # The partner business (acting as the showroom) that receives the stock
    receiving_business = models.ForeignKey(
        BusinessProfile, 
        on_delete=models.CASCADE, 
        related_name='received_inventory',
    ) 
    
    quantity_allocated = models.IntegerField(default=0)
    quantity_remaining = models.IntegerField(default=0) # Current stock
    sales_count = models.IntegerField(default=0)         # Total sales recorded from this stock
    
    def __str__(self):
        return f"{self.product.name} at {self.receiving_business.business_name} (Remaining: {self.quantity_remaining})"
