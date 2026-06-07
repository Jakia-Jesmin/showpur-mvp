from django.db.models.signals import post_save
from django.dispatch import receiver
from showpur_core.apps.accounts.models import BusinessProfile
from .models import Account

DEFAULT_ACCOUNTS = [
    # Money In — actual revenue only (collections are asset movements, not income)
    {'name': 'Product Sales',    'name_bn': 'পণ্য বিক্রয়',          'account_type': 'income',     'icon': '🛒', 'order': 1},
    {'name': 'Service Income',   'name_bn': 'সেবা আয়',              'account_type': 'income',     'icon': '🔧', 'order': 2},
    {'name': 'Other Income',     'name_bn': 'অন্যান্য আয়',          'account_type': 'income',     'icon': '📋', 'order': 99},

    # Money Out — actual costs
    {'name': 'Product Purchase', 'name_bn': 'পণ্য কেনা',             'account_type': 'expense',    'icon': '📦', 'order': 1},
    {'name': 'Raw Materials',    'name_bn': 'কাঁচামাল',              'account_type': 'expense',    'icon': '🏗️', 'order': 2},
    {'name': 'Salary',           'name_bn': 'বেতন',                  'account_type': 'expense',    'icon': '👥', 'order': 3},
    {'name': 'Shop Rent',        'name_bn': 'দোকান ভাড়া',           'account_type': 'expense',    'icon': '🏠', 'order': 4},
    {'name': 'Utilities',        'name_bn': 'বিদ্যুৎ/পানি/গ্যাস',   'account_type': 'expense',    'icon': '⚡', 'order': 5},
    {'name': 'Transport',        'name_bn': 'পরিবহন',                'account_type': 'expense',    'icon': '🚛', 'order': 6},
    {'name': 'Marketing',        'name_bn': 'মার্কেটিং',             'account_type': 'expense',    'icon': '📢', 'order': 7},
    {'name': 'Bank Charges',     'name_bn': 'ব্যাংক চার্জ',         'account_type': 'expense',    'icon': '🏦', 'order': 8},
    {'name': 'Loan Repayment',   'name_bn': 'ঋণ পরিশোধ',            'account_type': 'expense',    'icon': '💳', 'order': 9},
    {'name': 'Other Expense',    'name_bn': 'অন্যান্য খরচ',         'account_type': 'expense',    'icon': '📋', 'order': 99},

    # My Cash & Bank — where money physically lives
    {'name': 'Cash in Hand',     'name_bn': 'হাতে নগদ',              'account_type': 'cash_bank',  'icon': '💵', 'order': 1},
    {'name': 'bKash',            'name_bn': 'বিকাশ',                 'account_type': 'cash_bank',  'icon': '📱', 'order': 2},
    {'name': 'Nagad',            'name_bn': 'নগদ',                   'account_type': 'cash_bank',  'icon': '📱', 'order': 3},
    {'name': 'Rocket',           'name_bn': 'রকেট',                  'account_type': 'cash_bank',  'icon': '📱', 'order': 4},
    {'name': 'Bank Account',     'name_bn': 'ব্যাংক হিসাব',         'account_type': 'cash_bank',  'icon': '🏦', 'order': 5},

    # Will Collect — credit sales not yet collected (asset, not income)
    {'name': 'Customer Credit',  'name_bn': 'বাকি বিক্রয়',          'account_type': 'receivable', 'icon': '📥', 'order': 1},

    # Will Pay — credit purchases not yet paid (liability, not expense)
    {'name': 'Supplier Credit',  'name_bn': 'বাকি কেনা',             'account_type': 'payable',    'icon': '📤', 'order': 1},
]


@receiver(post_save, sender=BusinessProfile)
def seed_default_accounts(sender, instance, created, **kwargs):
    if created:
        for acc in DEFAULT_ACCOUNTS:
            Account.objects.get_or_create(
                business=instance,
                name=acc['name'],
                defaults={**acc, 'is_default': True}
            )
