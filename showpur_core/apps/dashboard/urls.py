from django.urls import path
from .views import ProducerDashboardAPIView, ShowroomDashboardAPIView

urlpatterns = [
    path('producer/', ProducerDashboardAPIView.as_view(), name='producer-dashboard'),
    path('showroom/', ShowroomDashboardAPIView.as_view(), name='showroom-dashboard'),
]