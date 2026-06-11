from django.db import models


class Account(models.Model):
    ACCOUNT_TYPES = [
        ('income',     'Money In'),
        ('expense',    'Money Out'),
        ('cash_bank',  'My Cash & Bank'),
        ('receivable', 'Will Collect'),
        ('payable',    'Will Pay'),
        ('capital',    "Owner's Capital"),
    ]

    business = models.ForeignKey(
        'accounts.BusinessProfile', on_delete=models.CASCADE,
        related_name='ledger_accounts'
    )
    name = models.CharField(max_length=100)
    name_bn = models.CharField(max_length=100, blank=True)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES)
    parent = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='sub_accounts'
    )
    account_code = models.CharField(max_length=10, blank=True)
    icon = models.CharField(max_length=10, blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ledger_accounts'
        ordering = ['order', 'name']
        unique_together = ['business', 'name']
        verbose_name = 'Account'
        verbose_name_plural = 'Chart of Accounts'

    def __str__(self):
        prefix = f"{self.icon} " if self.icon else ""
        return f"{prefix}{self.name}"
