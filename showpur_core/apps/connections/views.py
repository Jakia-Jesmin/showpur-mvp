from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import ConnectionRequest, Connection
from .serializers import (
    ConnectionRequestSerializer, ConnectionRequestCreateSerializer,
    ConnectionRequestUpdateSerializer, ConnectionSerializer, PendingCountSerializer
)

class ConnectionRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ConnectionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at', 'updated_at', 'status']
    search_fields = ['message', 'from_user__email', 'to_user__email']
    
    def get_queryset(self):
        user = self.request.user
        status_filter = self.request.query_params.get('status', None)
        request_type = self.request.query_params.get('request_type', None)
        
        queryset = ConnectionRequest.objects.filter(
            Q(from_user=user) | Q(to_user=user)
        )
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if request_type:
            queryset = queryset.filter(request_type=request_type)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ConnectionRequestCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ConnectionRequestUpdateSerializer
        return ConnectionRequestSerializer
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        connection_request = self.get_object()
        
        # Check authorization
        if connection_request.to_user != request.user:
            return Response(
                {"error": "You are not authorized to respond to this request"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if can respond
        if not connection_request.can_respond:
            return Response(
                {"error": "This request cannot be responded to anymore"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Accept the request
        connection_request.accept()
        
        # Create active connection
        if connection_request.request_type == 'producer_to_showroom':
            producer = connection_request.from_user
            showroom = connection_request.to_user
        else:
            producer = connection_request.to_user
            showroom = connection_request.from_user
        
        connection = Connection.objects.create(
            connection_request=connection_request,
            producer=producer,
            showroom=showroom,
            commission_rate=connection_request.to_user.profile.commission_rate,
            shelf_fee=connection_request.to_user.profile.shelf_price_per_month
        )
        
        serializer = ConnectionSerializer(connection, context={'request': request})
        return Response({
            'message': 'Connection request accepted successfully',
            'connection': serializer.data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        connection_request = self.get_object()
        
        # Check authorization
        if connection_request.to_user != request.user:
            return Response(
                {"error": "You are not authorized to respond to this request"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if can respond
        if not connection_request.can_respond:
            return Response(
                {"error": "This request cannot be responded to anymore"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        connection_request.reject()
        
        return Response({
            'message': 'Connection request rejected',
            'status': connection_request.status
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        connection_request = self.get_object()
        
        # Only sender can cancel
        if connection_request.from_user != request.user:
            return Response(
                {"error": "Only the sender can cancel this request"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if connection_request.status != 'pending':
            return Response(
                {"error": f"Cannot cancel request with status: {connection_request.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        connection_request.cancel()
        
        return Response({
            'message': 'Connection request cancelled',
            'status': connection_request.status
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def pending_counts(self, request):
        user = request.user
        
        received_count = ConnectionRequest.objects.filter(
            to_user=user, status='pending'
        ).count()
        
        sent_count = ConnectionRequest.objects.filter(
            from_user=user, status='pending'
        ).count()
        
        serializer = PendingCountSerializer({
            'received_count': received_count,
            'sent_count': sent_count
        })
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_connections(self, request):
        """Get all active connections for the current user"""
        user = request.user
        
        if user.role == 'producer':
            connections = Connection.objects.filter(producer=user, is_active=True)
        elif user.role == 'showroom':
            connections = Connection.objects.filter(showroom=user, is_active=True)
        else:
            return Response({"error": "Invalid user role"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ConnectionSerializer(connections, many=True, context={'request': request})
        return Response(serializer.data)

class ConnectionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'producer':
            return Connection.objects.filter(producer=user)
        elif user.role == 'showroom':
            return Connection.objects.filter(showroom=user)
        return Connection.objects.none()
    
    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        connection = self.get_object()
        user = request.user
        
        # Check authorization
        if user != connection.producer and user != connection.showroom:
            return Response(
                {"error": "You are not authorized to end this connection"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not connection.is_active:
            return Response(
                {"error": "Connection is already ended"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        connection.end_connection()
        
        return Response({
            'message': 'Connection ended successfully',
            'ended_at': connection.ended_at
        }, status=status.HTTP_200_OK)
        