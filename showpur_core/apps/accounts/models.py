from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = [
        ('producer', 'Producer'),
        ('showroom', 'Showroom'),
    ]

    STAFF_ROLES = [
        ('maker', 'Maker (Data Entry)'),
        ('checker', 'Checker (Approver)'),
        ('both', 'Both (Make & Check)'),
        ('admin', 'Admin'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    staff_role = models.CharField(max_length=20, choices=STAFF_ROLES, default='both')
    phone = models.CharField(max_length=20, blank=True)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # AcShow access
    acshow_enabled = models.BooleanField(default=False)
    acshow_trial_start = models.DateTimeField(null=True, blank=True)
    acshow_trial_end = models.DateTimeField(null=True, blank=True)
    acshow_onboarding_completed = models.BooleanField(default=False)

    # Password reset
    reset_token = models.CharField(max_length=100, blank=True, null=True)
    reset_token_expiry = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def is_maker(self):
        return self.staff_role in ('maker', 'both', 'admin')

    @property
    def is_checker(self):
        return self.staff_role in ('checker', 'both', 'admin')

    @property
    def can_self_approve(self):
        """Single-operator users (both/admin) approve their own transactions."""
        return self.staff_role in ('both', 'admin')


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

    # Showroom-specific
    shelf_price_per_month = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    available_shelf_space = models.IntegerField(default=0)

    # Producer-specific
    product_categories = models.JSONField(default=list, blank=True)
    minimum_order_quantity = models.IntegerField(default=1)

    class Meta:
        db_table = 'business_profiles'

    def __str__(self):
        return self.business_name

    @property
    def followers_count(self):
        return self.followers.count()
