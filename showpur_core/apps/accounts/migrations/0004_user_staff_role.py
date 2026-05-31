from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_user_reset_token_user_reset_token_expiry'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='staff_role',
            field=models.CharField(
                choices=[
                    ('maker', 'Maker (Data Entry)'),
                    ('checker', 'Checker (Approver)'),
                    ('both', 'Both (Make & Check)'),
                    ('admin', 'Admin'),
                ],
                default='both',
                max_length=20,
            ),
        ),
    ]
