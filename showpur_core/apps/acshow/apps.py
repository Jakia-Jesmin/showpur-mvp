from django.apps import AppConfig

class AcshowConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'showpur_core.apps.acshow'

    def ready(self):
        import showpur_core.apps.acshow.signals  # noqa