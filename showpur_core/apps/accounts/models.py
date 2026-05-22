from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = [
        ('producer', 'Producer'),
        ('showroom', 'Showroom'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=20, blank=True)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # AcShow fields
    acshow_enabled = models.BooleanField(default=False, help_text="User has access to AcShow financial tools")
    acshow_trial_start = models.DateTimeField(null=True, blank=True)
    acshow_trial_end = models.DateTimeField(null=True, blank=True)
    acshow_onboarding_completed = models.BooleanField(default=False)
    reset_token = models.CharField(max_length=100, blank=True, null=True)
    reset_token_expiry = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return f"{self.email} ({self.role})"

class BusinessProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    business_name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    logo = models.ImageField(upload_to='logos/', blank=True, null=True)
    cover_image = models.ImageField(upload_to='covers/', blank=True, null=True)
    website = models.URLField(blank=True)
    location = models.CharField(max_length=500)
    address = models.TextField(blank=True)
    followers = models.ManyToManyField(User, related_name='following_businesses', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Showroom specific fields
    shelf_price_per_month = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    available_shelf_space = models.IntegerField(default=0)
    
    # Producer specific fields
    product_categories = models.JSONField(default=list, blank=True)
    minimum_order_quantity = models.IntegerField(default=1)
    
    class Meta:
        db_table = 'business_profiles'
    
    def __str__(self):
        return self.business_name
    
    @property
    def followers_count(self):
        return self.followers.count()
    