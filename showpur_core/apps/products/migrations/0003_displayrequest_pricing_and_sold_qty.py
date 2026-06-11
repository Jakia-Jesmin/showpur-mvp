from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0002_rename_reserved_quantity_product_reserved_dropship_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='displayrequest',
            name='quantity_dispatched',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='displayrequest',
            name='quantity_sold',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='displayrequest',
            name='wholesale_price',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='displayrequest',
            name='retail_price',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AlterField(
            model_name='displayrequest',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending',    'Pending'),
                    ('accepted',   'Accepted'),
                    ('rejected',   'Rejected'),
                    ('dispatched', 'Dispatched'),
                    ('received',   'Received'),
                    ('active',     'Active'),
                    ('closed',     'Closed'),
                    ('sold',       'Sold'),
                    ('returned',   'Returned'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
    ]
