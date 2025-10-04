from rest_framework import generics, filters, status, viewsets, permissions
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction 
from django.contrib.auth import get_user_model 
from rest_framework_simplejwt.views import TokenObtainPairView

User = get_user_model()

# Import all models
from .models import BusinessProfile, Product, InventoryAllocation 

# Import all required serializers
from .serializers import BusinessProfileSerializer, CustomUserSerializer, ShowroomInventorySerializer, ProductSerializer, InventoryAllocationSerializer

# Import all required permissions
from .permissions import IsOwnerOrReadOnly, IsShowroomManager 

# Import custom token serializer
from .token_serializers import MyTokenObtainPairSerializer 


# =========================================================================
# 1. CORE API VIEWS (User Registration, User Details, Authentication)
# =========================================================================

class UserCreateView(generics.CreateAPIView):
    """Handles user registration."""
    queryset = User.objects.all()
    # Using the correct user serializer name defined in core/serializers.py
    serializer_class = CustomUserSerializer 
    permission_classes = [AllowAny]

class UserDetailView(generics.RetrieveUpdateAPIView):
    """Allows a logged-in user to retrieve and update their own details."""
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class MyTokenObtainPairView(TokenObtainPairView):
    """Custom JWT view using MyTokenObtainPairSerializer to add 'has_profile' claim."""
    serializer_class = MyTokenObtainPairSerializer


# =========================================================================
# 2. BUSINESS PROFILE VIEWSET (Consolidated CRUD for BusinessProfile)
# =========================================================================

class BusinessProfileViewSet(viewsets.ModelViewSet):
    """Provides CRUD operations for BusinessProfile."""
    serializer_class = BusinessProfileSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly] 
    filter_backends = [filters.SearchFilter]
    search_fields = ['business_name', 'description', 'address'] 

    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.is_superuser:
            return BusinessProfile.objects.all()
        # Assumes the link field in BusinessProfile is named 'user'
        return BusinessProfile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatically sets the 'user' field to the logged-in user upon creation."""
        serializer.save(user=self.request.user)

class BusinessProfileListView(APIView):
    """Handles listing all profiles or only the current user's profiles."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        owner = request.query_params.get('owner')
        if owner == 'current':
            profiles = BusinessProfile.objects.filter(user=request.user)
        else:
            # Only allow listing all profiles for staff/admin
            if not request.user.is_staff and not request.user.is_superuser:
                 return Response({"detail": "You do not have permission to view all profiles."}, status=status.HTTP_403_FORBIDDEN)
            profiles = BusinessProfile.objects.all()
            
        serializer = BusinessProfileSerializer(profiles, many=True, context={'request': request})
        return Response(serializer.data)


# =========================================================================
# 3. INVENTORY & SALES VIEWS (Showroom Manager Functionality)
# =========================================================================

class ShowroomInventoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Lists inventory allocations received by the logged-in user's business profile(s)."""
    serializer_class = ShowroomInventorySerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_queryset(self):
        user = self.request.user
        
        # 1. Get ALL BusinessProfiles owned by the user
        owned_profiles = BusinessProfile.objects.filter(user=user)

        if not owned_profiles.exists():
            return InventoryAllocation.objects.none()

        # 2. Filter allocations where receiving_business is one of the user's owned profiles
        return InventoryAllocation.objects.filter(
            receiving_business__in=owned_profiles
        ).select_related('product', 'receiving_business')
    
# --- Product ViewSet (Producer-side) ---

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_queryset(self):
        """Filters products to show ONLY those owned by the logged-in user's profile."""
        try:
            # Assumes a user has AT MOST one profile for product creation
            return Product.objects.filter(business__user=self.request.user)
        except:
            return Product.objects.none()

    def perform_create(self, serializer):
        """Injects the current user's BusinessProfile ID into the product before saving."""
        try:
            business_profile = self.request.user.businessprofile # Assumes single profile
        except BusinessProfile.DoesNotExist:
            raise exceptions.ValidationError({"detail": "You must create a business profile before adding products."})
            
        serializer.save(business=business_profile)
        
class RecordSaleView(APIView):
    """Handles recording an offline sale by a showroom manager, deducting stock."""
    permission_classes = [IsShowroomManager] 

    def post(self, request, *args, **kwargs):
        allocation_id = request.data.get('allocation_id')
        try:
            quantity_sold = int(request.data.get('quantity_sold', 1))
        except ValueError:
            return Response({"error": "Quantity sold must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST)

        if quantity_sold <= 0:
            return Response({"error": "Quantity sold must be a positive integer."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. CRITICAL FIX: Lock the row to prevent race conditions
            with transaction.atomic():
                allocation = InventoryAllocation.objects.select_for_update().get(id=allocation_id)
                
                # Internal Security Check: Ensure the user owns the receiving business
                if allocation.receiving_business.user != request.user:
                    return Response({"error": "You do not manage this showroom's inventory."}, status=status.HTTP_403_FORBIDDEN)
                    
                if allocation.quantity_remaining < quantity_sold:
                    return Response({"error": f"Cannot sell {quantity_sold} units. Only {allocation.quantity_remaining} remaining."}, status=status.HTTP_400_BAD_REQUEST)

                # --- Stock Update ---
                allocation.quantity_remaining -= quantity_sold
                allocation.sales_count += quantity_sold 
                allocation.save()
                # --------------------

        except InventoryAllocation.DoesNotExist:
            return Response({"error": "Inventory allocation not found."}, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            return Response({"error": f"An error occurred during transaction: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "message": "Sale recorded successfully.",
            "product": allocation.product.name,
            "remaining_stock": allocation.quantity_remaining,
            "business": allocation.receiving_business.business_name
        }, status=status.HTTP_200_OK)
    
# =========================================================================
# New: Inventory Allocation ViewSet (Producer-side)
# =========================================================================
class InventoryAllocationViewSet(viewsets.ModelViewSet):
    """Allows Producers to create (allocate) inventory to a Showroom BusinessProfile."""
    serializer_class = InventoryAllocationSerializer
    permission_classes = [permissions.IsAuthenticated] 
    http_method_names = ['get', 'post']

    def get_queryset(self):
        """Producers only see the allocations they created/own (via their products)."""
        try:
            # Filter allocations where the product belongs to the logged-in Producer
            return InventoryAllocation.objects.filter(product__business__user=self.request.user).select_related('product', 'receiving_business')
        except:
            return InventoryAllocation.objects.none()

    def perform_create(self, serializer):
        """Sets the initial quantity_remaining and saves the allocation record atomically."""
        quantity = serializer.validated_data.get('quantity_allocated')
        
        # Ensures the entire creation process succeeds or fails together
        with transaction.atomic():
            # Set remaining stock to allocated quantity, and sales count to 0
            serializer.save(quantity_remaining=quantity, sales_count=0)
            
# =========================================================================
# UPDATED: Enhanced User Profile Account View (Option 1 Implementation)
# =========================================================================
class UserProfileView(APIView):
    """Get and update the currently authenticated user's account information."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Returns the authenticated user's information along with their business profile."""
        user = request.user
        
        try:
            # Use filter() to handle potentially multiple profiles gracefully if model allows
            business_profiles = BusinessProfile.objects.filter(user=user)
            # Use serializer for complex fields and URLs
            profile_data = BusinessProfileSerializer(business_profiles, many=True, context={'request': request}).data
        except:
            profile_data = []

        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'business_profiles': profile_data
        }, status=status.HTTP_200_OK)
    
    def patch(self, request):
        """
        FIX: Update the authenticated user's account information (username, email, password).
        Uses CustomUserSerializer for validation.
        """
        user = request.user
        
        # Use the CustomUserSerializer instance for validation and saving
        serializer = CustomUserSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            # If password is in data, handle it separately for hashing
            if 'password' in request.data:
                user.set_password(request.data['password'])
                user.save()
                # Force re-login after password change
                return Response({'message': 'Password updated. Please log in again.'}, status=status.HTTP_200_OK)
            
            # Save other fields (username, email)
            serializer.save()
            
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'message': 'Account updated successfully'
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    