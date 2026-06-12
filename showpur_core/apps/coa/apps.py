from django.apps import AppConfig


class CoaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'showpur_core.apps.coa'
    verbose_name = 'Chart of Accounts'

    def ready(self):
        import showpur_core.apps.coa.signals
