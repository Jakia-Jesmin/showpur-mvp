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
    