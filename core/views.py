from rest_framework import generics, filters, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User

# Import all models
from .models import BusinessProfile, InventoryAllocation 

# Import all required serializers
from .serializers import BusinessProfileSerializer, UserSerializer, ShowroomInventorySerializer 

# Import all required permissions
# NOTE: Ensure IsOwnerOrReadOnly and IsShowroomManager are defined in core/permissions.py
from .permissions import IsOwnerOrReadOnly, IsShowroomManager 

# Import custom token serializer
from .token_serializers import MyTokenObtainPairSerializer 
from rest_framework_simplejwt.views import TokenObtainPairView


# =========================================================================
# 1. CORE API VIEWS (User Registration, User Details, Authentication)
# =========================================================================

class UserCreateView(generics.CreateAPIView):
    """Handles user registration."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    Allows a logged-in user to retrieve and update their own details.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Returns the currently authenticated user
        return self.request.user

class MyTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT view using MyTokenObtainPairSerializer to add 'has_profile' claim.
    """
    serializer_class = MyTokenObtainPairSerializer


# =========================================================================
# 2. BUSINESS PROFILE VIEWSET (Consolidated CRUD for BusinessProfile)
# =========================================================================

class BusinessProfileViewSet(viewsets.ModelViewSet):
    """
    Provides CRUD operations for BusinessProfile. 
    Lists only the current user's profiles (or all for staff/superuser).
    """
    serializer_class = BusinessProfileSerializer
    # REFINEMENT: Use IsOwnerOrReadOnly for detail permissions.
    # Note: Staff/Superusers will see all objects in the list due to get_queryset, 
    # and IsOwnerOrReadOnly allows read-only for non-owners.
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly] 
    filter_backends = [filters.SearchFilter]
    search_fields = ['business_name', 'description', 'address'] 

    def get_queryset(self):
        # Admin users (staff/superuser) can see all business profiles
        if self.request.user.is_staff or self.request.user.is_superuser:
            return BusinessProfile.objects.all()
        
        # Regular users (like RidaBadam) only see profiles linked to their user account
        # assuming the link field in BusinessProfile is named 'user'
        return BusinessProfile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatically sets the 'user' field to the logged-in user upon creation."""
        serializer.save(user=self.request.user)


# =========================================================================
# 3. INVENTORY & SALES VIEWS (Showroom Manager Functionality)
# =========================================================================

class ShowroomInventoryListView(generics.ListAPIView):
    """
    Lists inventory allocations specifically received by the logged-in user's business.
    This is the showroom's current stock.
    """
    serializer_class = ShowroomInventorySerializer
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        user = self.request.user
        try:
            # Filters all InventoryAllocation objects to those received by the user's profile
            # Note: Assuming a OneToOne relationship, access via user.businessprofile
            showroom_profile = user.businessprofile 
        except BusinessProfile.DoesNotExist:
            return InventoryAllocation.objects.none() 

        return InventoryAllocation.objects.filter(
            receiving_business=showroom_profile
        ).select_related('product', 'receiving_business')
    

class RecordSaleView(APIView):
    """
    Handles recording an offline sale by a showroom manager, deducting stock
    from their business's specific InventoryAllocation.
    """
    # REFINEMENT: Use IsShowroomManager for specific role-based access control.
    permission_classes = [IsShowroomManager] 

    def post(self, request, *args, **kwargs):
        allocation_id = request.data.get('allocation_id')
        # Ensure quantity_sold is treated as an integer, defaulting to 1
        try:
            quantity_sold = int(request.data.get('quantity_sold', 1))
        except ValueError:
            return Response({"error": "Quantity sold must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST)

        # Validation checks
        if quantity_sold <= 0:
            return Response({"error": "Quantity sold must be a positive integer."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            allocation = InventoryAllocation.objects.get(id=allocation_id)
        except InventoryAllocation.DoesNotExist:
            return Response({"error": "Inventory allocation not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # Internal Security Check (Redundant if IsShowroomManager is used, but good safeguard)
        if allocation.receiving_business.user != request.user:
            return Response({"error": "You do not manage this showroom's inventory."}, status=status.HTTP_403_FORBIDDEN)
            
        if allocation.quantity_remaining < quantity_sold:
            return Response({"error": f"Cannot sell {quantity_sold} units. Only {allocation.quantity_remaining} remaining."}, status=status.HTTP_400_BAD_REQUEST)

        # --- Stock Update ---
        allocation.quantity_remaining -= quantity_sold
        allocation.sales_count += quantity_sold 
        allocation.save()
        # --------------------

        return Response({
            "message": "Sale recorded successfully.",
            "product": allocation.product.name,
            "remaining_stock": allocation.quantity_remaining,
            "business": allocation.receiving_business.business_name
        }, status=status.HTTP_200_OK)
    
    