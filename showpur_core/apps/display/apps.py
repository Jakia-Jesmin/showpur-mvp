from django.apps import AppConfig

class DisplayConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'showpur_core.apps.display'
    label = 'display'
    verbose_name = 'Display Agreements & Inventory'