from django.apps import AppConfig

class DashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'showpur_core.apps.dashboard'
    label = 'dashboard'
    verbose_name = 'Dashboards'