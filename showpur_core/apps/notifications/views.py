from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer, MarkReadSerializer

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'priority']
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user, is_archived=False)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        serializer = MarkReadSerializer(data=request.data)
        if serializer.is_valid():
            if serializer.validated_data.get('mark_all'):
                Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
            else:
                notification_ids = serializer.validated_data.get('notification_ids', [])
                Notification.objects.filter(
                    recipient=request.user, 
                    id__in=notification_ids
                ).update(is_read=True)
            return Response({'status': 'marked as read'})
        return Response(serializer.errors, status=400)
    
    @action(detail=True, methods=['post'])
    def mark_single_read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        Notification.objects.filter(recipient=request.user).delete()
        return Response({'status': 'all notifications cleared'})

class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)
    
    def get_object(self):
        obj, created = NotificationPreference.objects.get_or_create(user=self.request.user)
        return obj
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)