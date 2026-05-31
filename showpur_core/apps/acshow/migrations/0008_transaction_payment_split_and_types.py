from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('acshow', '0007_acshowtransaction_approved_by_and_more'),
    ]

    operations = [
        # Add payment split fields
        migrations.AddField(
            model_name='acshowtransaction',
            name='payment_method',
            field=models.CharField(
                choices=[
                    ('cash_hand', 'Cash in Hand'),
                    ('cash_bank', 'Cash at Bank'),
                    ('mixed', 'Cash Hand + Bank'),
                    ('credit', 'Full Credit'),
                    ('partial', 'Partial (Cash + Credit)'),
                ],
                default='cash_hand',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='acshowtransaction',
            name='cash_hand_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='acshowtransaction',
            name='cash_bank_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='acshowtransaction',
            name='credit_amount',
            field=models.DecimalField(
                decimal_places=2, default=0, max_digits=12,
                help_text='Portion on credit — creates AR (for sales) or AP (for purchases)',
            ),
        ),
        # Add QuickRecord payment split fields
        migrations.AddField(
            model_name='quickrecord',
            name='cash_hand_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='quickrecord',
            name='cash_bank_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        # Extend transaction_type choices to include sale and purchase
        migrations.AlterField(
            model_name='acshowtransaction',
            name='transaction_type',
            field=models.CharField(
                choices=[
                    ('income', 'Income'),
                    ('expense', 'Expense'),
                    ('sale', 'Sale'),
                    ('purchase', 'Purchase'),
                    ('receivable', 'Receivable'),
                    ('payable', 'Payable'),
                ],
                max_length=20,
            ),
        ),
        # Remove stale sale_type field (replaced by transaction_type=sale/purchase)
        migrations.RemoveField(
            model_name='acshowtransaction',
            name='sale_type',
        ),
    ]
