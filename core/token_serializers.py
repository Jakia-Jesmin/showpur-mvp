# core/token_serializers.py

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.exceptions import ObjectDoesNotExist # 🛑 Import the specific exception

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims (role information)
        try:
            # Attempt to access the related BusinessProfile object
            profile = user.businessprofile 
            
            # Since the profile exists, set the flag to True
            token['has_profile'] = True
            
            # 💡 FUTURE EXPANSION: You can add more specific roles here:
            # token['role'] = profile.profile_type # e.g., 'showroom' or 'producer'

        except ObjectDoesNotExist: # 🛑 Catch the specific exception 
            # If the profile doesn't exist, set the flag to False
            token['has_profile'] = False
        
        # NOTE: No need to return 'profile_id', the frontend knows the user ID
        # but you could add the profile's ID if needed for direct API calls.
        # token['profile_id'] = profile.id if 'profile' in locals() else None

        return token
    