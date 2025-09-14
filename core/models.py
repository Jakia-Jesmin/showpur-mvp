# core/models.py
from django.db import models

class BusinessProfile(models.Model):
    business_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    contact_email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    website = models.URLField(blank=True)
    facebook_page = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.business_name
    