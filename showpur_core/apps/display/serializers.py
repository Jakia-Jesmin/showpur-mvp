from rest_framework import serializers
from .models import DisplayAgreement, InventoryTransaction, InventoryAuditLog
from apps.products.serializers import ProductListSerializer
from apps.accounts.serializers import UserSerializer, BusinessProfileSerializer

class DisplayAgreementSerializer(serializers.ModelSerializer):
    product_details = ProductListSerializer(source='product', read_only=True)
    showroom_details = BusinessProfileSerializer(source='showroom.profile', read_only=True)
    showroom_name = serializers.CharField(source='showroom.profile.business_name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    remaining_days = serializers.IntegerField(read_only=True)
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = DisplayAgreement
        fields = '__all__'
        read_only_fields = ['id', 'agreement_number', 'created_at', 'updated_at', 'approved_at',
                           'units_sold', 'total_commission_earned', 'total_rent_paid']

class DisplayAgreementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisplayAgreement
        fields = ['product', 'showroom', 'connection', 'shelf_location', 'display_area_sqft',
                  'start_date', 'end_date', 'fee_type', 'agreed_fee', 'commission_rate',
                  'units_displayed', 'terms_and_conditions', 'special_instructions']
    
    def validate(self, attrs):
        if attrs['start_date'] > attrs['end_date']:
            raise serializers.ValidationError("End date must be after start date")
        return attrs

class InventoryTransactionSerializer(serializers.ModelSerializer):
    display_agreement_number = serializers.CharField(source='display_agreement.agreement_number', read_only=True)
    created_by_name = serializers.CharField(source='created_by.profile.business_name', read_only=True)
    
    class Meta:
        model = InventoryTransaction
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'created_by']

class RecordSaleSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    customer_name = serializers.CharField(max_length=200, required=False)
    customer_email = serializers.EmailField(required=False)
    sale_date = serializers.DateField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)

class RecordPaymentSerializer(serializers.Serializer):
    payment_type = serializers.ChoiceField(choices=['commission', 'rent'])
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    notes = serializers.CharField(required=False, allow_blank=True)