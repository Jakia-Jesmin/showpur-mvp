from django.db import migrations, models


def seed_capital_accounts(apps, schema_editor):
    """Add Owner's Drawing to every existing BusinessProfile that doesn't have it."""
    Account = apps.get_model('ledger', 'Account')
    BusinessProfile = apps.get_model('accounts', 'BusinessProfile')

    for bp in BusinessProfile.objects.all():
        Account.objects.get_or_create(
            business=bp,
            name="Owner's Drawing",
            defaults={
                'name_bn': 'মালিকের উত্তোলন',
                'account_type': 'capital',
                'icon': '👤',
                'order': 1,
                'is_default': True,
                'is_active': True,
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ('ledger', '0001_initial'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='account',
            name='account_type',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('income',   'Money In'),
                    ('expense',  'Money Out'),
                    ('cash_bank','My Cash & Bank'),
                    ('receivable','Will Collect'),
                    ('payable',  'Will Pay'),
                    ('capital',  "Owner's Capital"),
                ],
            ),
        ),
        migrations.RunPython(seed_capital_accounts, migrations.RunPython.noop),
    ]
