from rest_framework import serializers
from django.utils import timezone
from .models import ConnectionRequest, Connection
from apps.accounts.serializers import UserSerializer, BusinessProfileSerializer

class ConnectionRequestSerializer(serializers.ModelSerializer):
    from_user_email = serializers.EmailField(source='from_user.email', read_only=True)
    to_user_email = serializers.EmailField(source='to_user.email', read_only=True)
    from_user_name = serializers.CharField(source='from_user.profile.business_name', read_only=True)
    to_user_name = serializers.CharField(source='to_user.profile.business_name', read_only=True)
    from_user_role = serializers.CharField(source='from_user.role', read_only=True)
    to_user_role = serializers.CharField(source='to_user.role', read_only=True)
    can_respond = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = ConnectionRequest
        fields = [
            'id', 'from_user', 'to_user', 'from_user_email', 'to_user_email',
            'from_user_name', 'to_user_name', 'from_user_role', 'to_user_role',
            'request_type', 'status', 'suggested_product_ids', 'message',
            'terms_conditions', 'proposed_duration_days', 'proposed_fee',
            'created_at', 'updated_at', 'responded_at', 'expires_at',
            'can_respond', 'is_expired'
        ]
        read_only_fields = [
            'id', 'status', 'created_at', 'updated_at', 'responded_at',
            'can_respond', 'is_expired'
        ]
    
    def validate(self, attrs):
        request = self.context.get('request')
        from_user = request.user if request else attrs.get('from_user')
        to_user = attrs.get('to_user')
        
        # Prevent self-requests
        if from_user and to_user and from_user == to_user:
            raise serializers.ValidationError("You cannot send a connection request to yourself")
        
        # Check if request already exists
        if ConnectionRequest.objects.filter(
            from_user=from_user, 
            to_user=to_user,
            status='pending'
        ).exists():
            raise serializers.ValidationError("A pending request already exists")
        
        # Validate request type matches roles
        request_type = attrs.get('request_type')
        if request_type == 'producer_to_showroom':
            if from_user.role != 'producer' or to_user.role != 'showroom':
                raise serializers.ValidationError("Invalid request type for these users")
        elif request_type == 'showroom_to_producer':
            if from_user.role != 'showroom' or to_user.role != 'producer':
                raise serializers.ValidationError("Invalid request type for these users")
        
        return attrs
    
    def create(self, validated_data):
        # Set expiry date (30 days from now)
        from datetime import timedelta
        validated_data['expires_at'] = timezone.now() + timedelta(days=30)
        return super().create(validated_data)

class ConnectionRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectionRequest
        fields = [
            'to_user', 'request_type', 'suggested_product_ids', 
            'message', 'terms_conditions', 'proposed_duration_days', 'proposed_fee'
        ]
    
    def create(self, validated_data):
        validated_data['from_user'] = self.context['request'].user
        return super().create(validated_data)

class ConnectionRequestUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectionRequest
        fields = ['status', 'message', 'terms_conditions', 'proposed_duration_days', 'proposed_fee']
        read_only_fields = ['status']

class ConnectionSerializer(serializers.ModelSerializer):
    producer_details = UserSerializer(source='producer', read_only=True)
    showroom_details = UserSerializer(source='showroom', read_only=True)
    producer_profile = BusinessProfileSerializer(source='producer.profile', read_only=True)
    showroom_profile = BusinessProfileSerializer(source='showroom.profile', read_only=True)
    duration_days = serializers.SerializerMethodField()
    
    class Meta:
        model = Connection
        fields = [
            'id', 'connection_request', 'producer', 'showroom',
            'producer_details', 'showroom_details', 'producer_profile',
            'showroom_profile', 'is_active', 'started_at', 'ended_at',
            'commission_rate', 'shelf_fee', 'duration_days'
        ]
        read_only_fields = ['id', 'started_at', 'ended_at']
    
    def get_duration_days(self, obj):
        if obj.ended_at:
            return (obj.ended_at - obj.started_at).days
        return (timezone.now() - obj.started_at).days

class PendingCountSerializer(serializers.Serializer):
    received_count = serializers.IntegerField()
    sent_count = serializers.IntegerField()
    