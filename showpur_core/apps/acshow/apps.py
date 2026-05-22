from django.apps import AppConfig

class AcshowConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.acshow'

    def ready(self):
        import apps.acshow.signals  # noqa