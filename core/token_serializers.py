# core/token_serializers.py (FIXED)
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    # This line explicitly sets the primary authentication field to 'username' 
    # to match what your Login form is sending.
    username_field = User.USERNAME_FIELD
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims if you have them (like has_profile)
        # token['has_profile'] = hasattr(user, 'business_profile') 
        return token

    def validate(self, attrs):
        # Ensure that 'username' is the field being used for lookup if you 
        # have overridden the base TokenObtainPairSerializer fields.
        # If you haven't added custom fields, just calling super() is fine:
        data = super().validate(attrs)
        return data