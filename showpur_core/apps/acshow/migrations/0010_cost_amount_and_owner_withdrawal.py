import django.core.validators
import django.db.models.deletion
import django.utils.timezone
import uuid
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('acshow', '0009_alter_contact_unique_together_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Add COGS tracking to the transaction table
        migrations.AddField(
            model_name='acshowtransaction',
            name='cost_amount',
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal('0'),
                help_text='Cost of goods sold — stored alongside revenue for gross profit calculation',
                max_digits=12,
            ),
        ),

        # New owner withdrawal log table
        migrations.CreateModel(
            name='OwnerWithdrawal',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('amount', models.DecimalField(
                    decimal_places=2,
                    max_digits=12,
                    validators=[django.core.validators.MinValueValidator(Decimal('0.01'))],
                )),
                ('source', models.CharField(
                    choices=[('CASH', 'Cash in Hand'), ('BANK', 'Cash at Bank')],
                    default='CASH',
                    max_length=10,
                )),
                ('reason', models.TextField(blank=True)),
                ('withdrawn_at', models.DateTimeField(auto_now_add=True)),
                ('business', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='owner_withdrawals',
                    to='accounts.businessprofile',
                )),
                ('withdrawn_by', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='owner_withdrawals',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'Owner Withdrawal',
                'db_table': 'acshow_owner_withdrawals',
                'ordering': ['-withdrawn_at'],
            },
        ),
        migrations.AddIndex(
            model_name='ownerwithdrawal',
            index=models.Index(fields=['business', 'withdrawn_at'], name='acshow_owne_busines_idx'),
        ),
    ]
