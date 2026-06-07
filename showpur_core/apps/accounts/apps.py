from django.apps import AppConfig

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'showpur_core.apps.accounts'
    label = 'accounts'
    verbose_name = 'Accounts & Profiles'

    def ready(self):
        # Import signals here if you have any
        # import showpur_core.apps.accounts.signals
        pass
    