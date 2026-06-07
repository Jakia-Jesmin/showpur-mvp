from django.apps import AppConfig

class LedgerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'showpur_core.apps.ledger'

    def ready(self):
        import showpur_core.apps.ledger.signals  # noqa
