from django.apps import AppConfig

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'
    label = 'accounts'
    verbose_name = 'Accounts & Profiles'

    def ready(self):
        # Import signals here if you have any
        # import apps.accounts.signals
        pass
    