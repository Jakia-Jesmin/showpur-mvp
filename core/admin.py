# core/admin.py

from django.contrib import admin
from .models import BusinessProfile, Product, InventoryAllocation # <-- Import your models

# 🛑 CRITICAL: Register your models 🛑
admin.site.register(BusinessProfile)
admin.site.register(Product)
admin.site.register(InventoryAllocation)
# Add any other models you want to manage here
