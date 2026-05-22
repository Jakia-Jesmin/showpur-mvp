from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.accounts.models import BusinessProfile
from .models import TransactionCategory

DEFAULT_CATEGORIES = [
    # Income
    {'name': 'Product Sales', 'name_bn': 'পণ্য বিক্রয়', 'category_type': 'income', 'icon': '🛒', 'order': 1},
    {'name': 'Service Income', 'name_bn': 'সেবা আয়', 'category_type': 'income', 'icon': '🔧', 'order': 2},
    {'name': 'Collection', 'name_bn': 'পাওনা আদায়', 'category_type': 'income', 'icon': '💵', 'order': 3},
    {'name': 'Other Income', 'name_bn': 'অন্যান্য আয়', 'category_type': 'income', 'icon': '📋', 'order': 99},
    # Expense
    {'name': 'Inventory Purchase', 'name_bn': 'পণ্য কেনা', 'category_type': 'expense', 'icon': '📦', 'order': 1},
    {'name': 'Rent', 'name_bn': 'ভাড়া', 'category_type': 'expense', 'icon': '🏠', 'order': 2},
    {'name': 'Salary', 'name_bn': 'বেতন', 'category_type': 'expense', 'icon': '👥', 'order': 3},
    {'name': 'Utilities', 'name_bn': 'বিদ্যুৎ/পানি', 'category_type': 'expense', 'icon': '⚡', 'order': 4},
    {'name': 'Transport', 'name_bn': 'পরিবহন', 'category_type': 'expense', 'icon': '🚛', 'order': 5},
    {'name': 'Other Expense', 'name_bn': 'অন্যান্য খরচ', 'category_type': 'expense', 'icon': '📋', 'order': 99},
]

@receiver(post_save, sender=BusinessProfile)
def create_default_categories(sender, instance, created, **kwargs):
    if created:
        for cat in DEFAULT_CATEGORIES:
            TransactionCategory.objects.get_or_create(
                business=instance,
                name=cat['name'],
                defaults={**cat, 'is_default': True}
            )