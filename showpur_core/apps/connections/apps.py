from django.apps import AppConfig

class ConnectionsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.connections'
    label = 'connections'
    verbose_name = 'Connections & Requests'
    
    def ready(self):
        # Import signals if any
        # import apps.connections.signals
        pass