from django.db import migrations

DEFAULT_ACCOUNTS = [
    {'name': 'Product Sales',    'name_bn': 'পণ্য বিক্রয়',          'account_type': 'income',     'icon': '🛒', 'order': 1},
    {'name': 'Service Income',   'name_bn': 'সেবা আয়',              'account_type': 'income',     'icon': '🔧', 'order': 2},
    {'name': 'Other Income',     'name_bn': 'অন্যান্য আয়',          'account_type': 'income',     'icon': '📋', 'order': 99},

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

    {'name': 'Cash in Hand',     'name_bn': 'হাতে নগদ',              'account_type': 'cash_bank',  'icon': '💵', 'order': 1},
    {'name': 'bKash',            'name_bn': 'বিকাশ',                 'account_type': 'cash_bank',  'icon': '📱', 'order': 2},
    {'name': 'Nagad',            'name_bn': 'নগদ',                   'account_type': 'cash_bank',  'icon': '📱', 'order': 3},
    {'name': 'Rocket',           'name_bn': 'রকেট',                  'account_type': 'cash_bank',  'icon': '📱', 'order': 4},
    {'name': 'Bank Account',     'name_bn': 'ব্যাংক হিসাব',         'account_type': 'cash_bank',  'icon': '🏦', 'order': 5},

    {'name': 'Customer Credit',  'name_bn': 'বাকি বিক্রয়',          'account_type': 'receivable', 'icon': '📥', 'order': 1},

    {'name': 'Supplier Credit',  'name_bn': 'বাকি কেনা',             'account_type': 'payable',    'icon': '📤', 'order': 1},

    {'name': "Owner's Drawing",  'name_bn': 'মালিকের উত্তোলন',      'account_type': 'capital',    'icon': '👤', 'order': 1},
]


def seed_default_accounts(apps, schema_editor):
    Account = apps.get_model('coa', 'Account')
    BusinessProfile = apps.get_model('accounts', 'BusinessProfile')

    for bp in BusinessProfile.objects.all():
        for acc in DEFAULT_ACCOUNTS:
            Account.objects.get_or_create(
                business=bp,
                name=acc['name'],
                defaults={**acc, 'is_default': True}
            )


class Migration(migrations.Migration):

    dependencies = [
        ('coa', '0001_initial'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_default_accounts, migrations.RunPython.noop),
    ]
