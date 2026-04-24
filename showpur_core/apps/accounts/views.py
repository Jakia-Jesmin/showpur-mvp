from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, BusinessProfile
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer, 
    BusinessProfileSerializer, ChangePasswordSerializer, UserUpdateSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Registration successful. Please complete your business profile.'
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        refresh = RefreshToken.for_user(user)
        
        # Check if business profile exists
        has_profile = BusinessProfile.objects.filter(user=user).exists()
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'has_profile': has_profile,
            'role': user.role
        })

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Successfully logged out.'})
        except Exception:
            return Response({'message': 'Logged out.'})

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({'message': 'Password changed successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BusinessProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, user_id=None):
        if user_id:
            user = get_object_or_404(User, id=user_id)
            profile = get_object_or_404(BusinessProfile, user=user)
        else:
            profile = get_object_or_404(BusinessProfile, user=request.user)
        
        serializer = BusinessProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request):
        profile = get_object_or_404(BusinessProfile, user=request.user)
        serializer = BusinessProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def post(self, request):
        """Create business profile after registration"""
        if BusinessProfile.objects.filter(user=request.user).exists():
            return Response({"error": "Profile already exists"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = BusinessProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FollowUnfollowView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, profile_id):
        profile = get_object_or_404(BusinessProfile, id=profile_id)
        
        if profile.user == request.user:
            return Response({"error": "You cannot follow yourself"}, status=status.HTTP_400_BAD_REQUEST)
        
        if request.user in profile.followers.all():
            profile.followers.remove(request.user)
            return Response({
                "status": "unfollowed",
                "followers_count": profile.followers.count()
            })
        else:
            profile.followers.add(request.user)
            return Response({
                "status": "followed",
                "followers_count": profile.followers.count()
            })

class AllBusinessProfilesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        role_filter = request.query_params.get('role', None)
        queryset = BusinessProfile.objects.all()
        
        if role_filter:
            queryset = queryset.filter(user__role=role_filter)
        
        serializer = BusinessProfileSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

class UserDetailView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        user_data = UserSerializer(user).data
        
        # Add profile data if exists
        if hasattr(user, 'profile'):
            profile_data = BusinessProfileSerializer(user.profile, context={'request': request}).data
            user_data['profile'] = profile_data
        
        return Response(user_data)

class BusinessProfileBySlugView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, slug):
        """Get business profile by business name slug"""
        from .models import User
        from .serializers import UserSerializer
        from django.shortcuts import get_object_or_404
        
        business_name = slug.replace('-', ' ')
        user = get_object_or_404(User, business_name__iexact=business_name)
        serializer = UserSerializer(user)
        return Response(serializer.data)