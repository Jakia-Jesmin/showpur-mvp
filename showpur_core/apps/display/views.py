from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import DisplayAgreement, InventoryTransaction, InventoryAuditLog
from .serializers import (
    DisplayAgreementSerializer, DisplayAgreementCreateSerializer,
    InventoryTransactionSerializer, RecordSaleSerializer, RecordPaymentSerializer
)

class DisplayAgreementViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'start_date', 'end_date', 'status']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'producer':
            return DisplayAgreement.objects.filter(product__owner=user)
        elif user.role == 'showroom':
            return DisplayAgreement.objects.filter(showroom=user)
        return DisplayAgreement.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DisplayAgreementCreateSerializer
        return DisplayAgreementSerializer
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        agreement = self.get_object()
        
        # Only showroom can activate
        if request.user.role != 'showroom' or agreement.showroom != request.user:
            return Response({"error": "Only the showroom can activate this agreement"}, status=403)
        
        agreement.status = 'active'
        agreement.approved_at = timezone.now()
        agreement.save()
        
        # Create audit log
        InventoryAuditLog.objects.create(
            display_agreement=agreement,
            previous_status='pending_approval',
            new_status='active',
            changes={'activated_by': request.user.id},
            changed_by=request.user
        )
        
        # Create transaction
        InventoryTransaction.objects.create(
            display_agreement=agreement,
            transaction_type='display_start',
            notes=f"Display agreement activated by {request.user.profile.business_name}",
            created_by=request.user
        )
        
        return Response({'status': 'activated'})
    
    @action(detail=True, methods=['post'])
    def record_sale(self, request, pk=None):
        agreement = self.get_object()
        
        # Only showroom can record sales
        if request.user.role != 'showroom' or agreement.showroom != request.user:
            return Response({"error": "Only the showroom can record sales"}, status=403)
        
        serializer = RecordSaleSerializer(data=request.data)
        if serializer.is_valid():
            quantity = serializer.validated_data['quantity']
            unit_price = serializer.validated_data.get('unit_price', agreement.product.price)
            amount = quantity * unit_price
            
            # Calculate commission
            commission_rate = agreement.commission_rate or agreement.showroom.profile.commission_rate or 0
            commission_amount = amount * (commission_rate / 100)
            
            # Update agreement
            agreement.units_sold += quantity
            agreement.total_commission_earned += commission_amount
            agreement.save()
            
            # Update product stock
            agreement.product.stock_quantity -= quantity
            agreement.product.save()
            
            # Create transaction
            InventoryTransaction.objects.create(
                display_agreement=agreement,
                transaction_type='sale',
                quantity=quantity,
                unit_price=unit_price,
                amount=commission_amount,
                customer_name=serializer.validated_data.get('customer_name', ''),
                customer_email=serializer.validated_data.get('customer_email', ''),
                sale_date=serializer.validated_data.get('sale_date', timezone.now().date()),
                notes=serializer.validated_data.get('notes', ''),
                created_by=request.user
            )
            
            return Response({
                'units_sold': agreement.units_sold,
                'commission_earned': agreement.total_commission_earned,
                'remaining_stock': agreement.product.stock_quantity
            })
        return Response(serializer.errors, status=400)
    
    @action(detail=True, methods=['post'])
    def record_payment(self, request, pk=None):
        agreement = self.get_object()
        
        # Only showroom or producer can record payments
        if request.user not in [agreement.showroom, agreement.product.owner]:
            return Response({"error": "Not authorized"}, status=403)
        
        serializer = RecordPaymentSerializer(data=request.data)
        if serializer.is_valid():
            payment_type = serializer.validated_data['payment_type']
            amount = serializer.validated_data['amount']
            
            if payment_type == 'commission':
                agreement.total_commission_earned += amount
                transaction_type = 'commission_paid'
            else:
                agreement.total_rent_paid += amount
                transaction_type = 'rent_paid'
            
            agreement.save()
            
            InventoryTransaction.objects.create(
                display_agreement=agreement,
                transaction_type=transaction_type,
                amount=amount,
                notes=serializer.validated_data.get('notes', ''),
                created_by=request.user
            )
            
            return Response({'status': 'payment recorded', 'amount': amount})
        return Response(serializer.errors, status=400)
    
    @action(detail=True, methods=['post'])
    def end_agreement(self, request, pk=None):
        agreement = self.get_object()
        
        # Both parties can end agreement
        if request.user not in [agreement.showroom, agreement.product.owner]:
            return Response({"error": "Not authorized"}, status=403)
        
        agreement.status = 'terminated'
        agreement.actual_end_date = timezone.now().date()
        agreement.save()
        
        InventoryTransaction.objects.create(
            display_agreement=agreement,
            transaction_type='display_end',
            notes=f"Agreement ended by {request.user.profile.business_name}",
            created_by=request.user
        )
        
        return Response({'status': 'agreement ended'})
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        user = request.user
        if user.role == 'producer':
            agreements = DisplayAgreement.objects.filter(product__owner=user, status='active')
            data = {
                'total_agreements': agreements.count(),
                'total_units_sold': agreements.aggregate(Sum('units_sold'))['units_sold__sum'] or 0,
                'total_commission': agreements.aggregate(Sum('total_commission_earned'))['total_commission_earned__sum'] or 0,
                'active_products': agreements.values('product').distinct().count(),
            }
        else:
            agreements = DisplayAgreement.objects.filter(showroom=user, status='active')
            data = {
                'total_agreements': agreements.count(),
                'total_units_sold': agreements.aggregate(Sum('units_sold'))['units_sold__sum'] or 0,
                'total_commission_earned': agreements.aggregate(Sum('total_commission_earned'))['total_commission_earned__sum'] or 0,
                'total_rent_collected': agreements.aggregate(Sum('total_rent_paid'))['total_rent_paid__sum'] or 0,
                'unique_producers': agreements.values('product__owner').distinct().count(),
            }
        return Response(data)

class InventoryTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InventoryTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'producer':
            return InventoryTransaction.objects.filter(display_agreement__product__owner=user)
        elif user.role == 'showroom':
            return InventoryTransaction.objects.filter(display_agreement__showroom=user)
        return InventoryTransaction.objects.none()