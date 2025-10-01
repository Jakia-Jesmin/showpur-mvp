# core/views.py (The final, correctly structured file)

from rest_framework import generics, filters, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import BusinessProfile, InventoryAllocation
# Import all required serializers
from .serializers import BusinessProfileSerializer, UserSerializer, ShowroomInventorySerializer 
# Import all required permissions
from .permissions import IsOwnerOrReadOnly, IsShowroomManager 
# Import custom token serializer
from .token_serializers import MyTokenObtainPairSerializer 
from rest_framework_simplejwt.views import TokenObtainPairView # Base class for our custom view


# =========================================================================
# 1. CORE API VIEWS (Business Profiles, Registration, User Details)
# =========================================================================

class BusinessProfileListCreateView(generics.ListCreateAPIView):
    queryset = BusinessProfile.objects.all()
    serializer_class = BusinessProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] 
    filter_backends = [filters.SearchFilter]
    search_fields = ['business_name', 'description', 'address'] 

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BusinessProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BusinessProfile.objects.all()
    serializer_class = BusinessProfileSerializer
    permission_classes = [IsOwnerOrReadOnly] 

class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# =========================================================================
# 2. AUTHENTICATION / JWT VIEWS
# =========================================================================

class MyTokenObtainPairView(TokenObtainPairView):
    """
    Custom view using MyTokenObtainPairSerializer to add 'has_profile' claim.
    """
    serializer_class = MyTokenObtainPairSerializer


# =========================================================================
# 3. SHOWROOM MANAGER VIEWS
# =========================================================================

class ShowroomInventoryListView(generics.ListAPIView):
    """
    Lists inventory allocations specifically received by the logged-in user's business.
    """
    serializer_class = ShowroomInventorySerializer
    # We can use IsAuthenticated here since the queryset filters by the user
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        user = self.request.user
        try:
            # Filters all InventoryAllocation objects to those received by the user's profile
            showroom_profile = user.businessprofile 
        except BusinessProfile.DoesNotExist:
            return InventoryAllocation.objects.none() 

        return InventoryAllocation.objects.filter(
            receiving_business=showroom_profile
        ).select_related('product', 'receiving_business')
    

class RecordSaleView(APIView):
    """
    Handles recording an offline sale by a showroom manager.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        allocation_id = request.data.get('allocation_id')
        quantity_sold = request.data.get('quantity_sold', 1) 

        try:
            allocation = InventoryAllocation.objects.get(id=allocation_id)
        except InventoryAllocation.DoesNotExist:
            return Response({"error": "Inventory allocation not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # Security Check: Must be the managing showroom manager
        if allocation.receiving_business.user != request.user:
            return Response({"error": "You do not manage this showroom's inventory."}, status=status.HTTP_403_FORBIDDEN)
            
        # Validation
        if not isinstance(quantity_sold, int) or quantity_sold <= 0:
            return Response({"error": "Quantity sold must be a positive integer."}, status=status.HTTP_400_BAD_REQUEST)
        
        if allocation.quantity_remaining < quantity_sold:
            return Response({"error": f"Cannot sell {quantity_sold} units. Only {allocation.quantity_remaining} remaining."}, status=status.HTTP_400_BAD_REQUEST)

        # Update Stock
        allocation.quantity_remaining -= quantity_sold
        allocation.sales_count += quantity_sold 
        allocation.save()

        return Response({
            "message": "Sale recorded successfully.",
            "product": allocation.product.name,
            "remaining_stock": allocation.quantity_remaining
        }, status=status.HTTP_200_OK)
    