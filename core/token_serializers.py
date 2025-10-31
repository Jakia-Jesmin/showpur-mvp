# core/token_serializers.py (FIXED)

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
# django.core.exceptions.ObjectDoesNotExist is no longer needed

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # 🛑 FIX: Use the capitalized related name ('BusinessProfile')
        # and the .exists() method to safely check if the user has any profiles.
        token['has_profile'] = user.business_profile.exists() 
        
        # 💡 FUTURE EXPANSION: If you need to retrieve a profile's ID/Role:
        # profile = user.BusinessProfile.first()
        # if profile:
        #    token['profile_id'] = profile.id
        
        return token