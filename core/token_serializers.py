# core/token_serializers.py

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims (role information)
        try:
            # Assuming BusinessProfile has a one-to-one field to the User model
            profile = user.businessprofile
            # For simplicity, we'll just check if a profile exists and assume
            # the user's role is determined by their profile type/existence.
            # You can expand this later with actual 'role' fields if needed.
            token['has_profile'] = True
        except:
            token['has_profile'] = False

        return token
    