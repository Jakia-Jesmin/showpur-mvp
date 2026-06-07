from django.apps import AppConfig

class ConnectionsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'showpur_core.apps.connections'
    label = 'connections'
    verbose_name = 'Connections & Requests'
    
    def ready(self):
        # Import signals if any
        # import showpur_core.apps.connections.signals
        pass