from rest_framework import generics, filters, status, viewsets, permissions, exceptions
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action # 🛑 CRITICAL: Need to import 'action' for custom methods
from django.db import transaction 
from django.contrib.auth import get_user_model 
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404
from django.db import models # 🛑 CRITICAL: Needed for models.Q 

User = get_user_model()

# Import all models
from .models import BusinessProfile, Product, InventoryAllocation 

# Import all required serializers
from .serializers import BusinessProfileSerializer, CustomUserSerializer, ShowroomInventorySerializer, ProductSerializer, InventoryAllocationSerializer

# Import all required permissions
from .permissions import IsUserOrReadOnly, IsProducer, IsStore, IsShowroomManager 

# Import custom token serializer
from .token_serializers import MyTokenObtainPairSerializer 


# =========================================================================
# 1. CORE API VIEWS (User Registration, User Details, Authentication)
# =========================================================================

class UserCreateView(generics.CreateAPIView):
    """Handles user registration."""
    queryset = User.objects.all()
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
    permission_classes = [IsAuthenticated, IsUserOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['business_name', 'description', 'address'] 

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return BusinessProfile.objects.none()
        if user.is_staff or user.is_superuser:
            return BusinessProfile.objects.all()
        return BusinessProfile.objects.filter(user=user)

    def get_serializer_context(self):
        return {'request': self.request} 

    def perform_create(self, serializer):
        """Automatically sets the 'user' field to the logged-in user upon creation."""
        serializer.save(user=self.request.user)

class BusinessProfileListView(APIView):
    """Handles listing all profiles or only the current user's profiles."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_param = request.query_params.get('user')
        if user_param == 'current':
            profiles = BusinessProfile.objects.filter(user=request.user)
        else:
            if not request.user.is_staff and not request.user.is_superuser:
                return Response({"detail": "You do not have permission to view all profiles."}, status=status.HTTP_403_FORBIDDEN)
            profiles = BusinessProfile.objects.all()
            
        serializer = BusinessProfileSerializer(profiles, many=True, context={'request': request})
        return Response(serializer.data)


# =========================================================================
# 3. PRODUCT & INVENTORY VIEWSETS
# =========================================================================

class ProductViewSet(viewsets.ModelViewSet):
    """Handles CRUD for Products (Producer-only)."""
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsProducer]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()
    
    def get_queryset(self):
        """Filters products to show ONLY those owned by the logged-in user's profile."""
        if not self.request.user.is_authenticated:
            return Product.objects.none()
            
        # 🛑 FIXED: Access via confirmed related name 'business_profile' 🛑
        # Assuming the ForeignKey in Product model is named 'business' (not 'business_name')
        try:
             return Product.objects.filter(business_name__user=self.request.user)
        except AttributeError:
             return Product.objects.none() # Handle case where FK link is named differently
    
    def perform_create(self, serializer):
        """Injects the current user's BusinessProfile ID into the product before saving."""
        try:
            # 🛑 FIXED: Access the profile via the confirmed related name 'business_profile' 🛑
            business_profile = self.request.user.business_profile 
            
            if business_profile.role != 'PRODUCER':
                 raise exceptions.PermissionDenied("Only Producer accounts can add new products.")

            # Assuming the ForeignKey field in Product model is named 'business'
            serializer.save(business_name=business_profile)
                
        except AttributeError:
             # Handle case where user has no profile or related name is wrong
             raise exceptions.ValidationError({"detail": "You must create a business profile before adding products."})


# --- Showroom Inventory ViewSet (Lists ACCEPTED allocations at a Store) ---
class ShowroomInventoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Lists inventory allocations received by the logged-in user's business profile(s)."""
    serializer_class = ShowroomInventorySerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_queryset(self):
        user = self.request.user
        
        # 1. Get ALL BusinessProfiles owned by the user (Stores only)
        # We assume the InventoryAllocation model uses 'receiver' as the FK for the receiving Store/Producer.
        # The Showroom Inventory only lists ACCEPTED allocations for the *current user*.
        
        if not hasattr(user, 'business_profile'):
             return InventoryAllocation.objects.none()

        # 2. Filter allocations where the receiver is the user's profile and the status is ACCEPTED
        return InventoryAllocation.objects.filter(
            receiver__user=user,
            status='ACCEPTED' # Only show stock that has actually been allocated/received
        ).select_related('product', 'receiver')


# --- Record Sale View (Showroom Manager Action) ---
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
            with transaction.atomic():
                # Lock the row to prevent race conditions
                allocation = InventoryAllocation.objects.select_for_update().get(id=allocation_id)
                
                # Internal Security Check: Ensure the user manages the receiving business
                if allocation.receiver.user != request.user: # Assuming receiver is the receiving business
                    return Response({"error": "You do not manage this showroom's inventory."}, status=status.HTTP_403_FORBIDDEN)
                    
                if allocation.quantity_remaining < quantity_sold:
                    return Response({"error": f"Cannot sell {quantity_sold} units. Only {allocation.quantity_remaining} remaining."}, status=status.HTTP_400_BAD_REQUEST)

                # Stock Update on the Allocation record
                allocation.quantity_remaining -= quantity_sold
                allocation.sales_count += quantity_sold 
                allocation.save()

        except InventoryAllocation.DoesNotExist:
            return Response({"error": "Inventory allocation not found."}, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            return Response({"error": f"An error occurred during transaction: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "message": "Sale recorded successfully.",
            "product": allocation.product.name,
            "remaining_stock": allocation.quantity_remaining,
            "business": allocation.receiver.business_name
        }, status=status.HTTP_200_OK)


# =========================================================================
# 4. INVENTORY ALLOCATION VIEWSET (Unified Logic)
# =========================================================================

class InventoryAllocationViewSet(viewsets.ModelViewSet):
    """Handles creation (Push/Request) and approval (Accept/Reject) of allocations."""
    serializer_class = InventoryAllocationSerializer
    permission_classes = [permissions.IsAuthenticated] 
    http_method_names = ['get', 'post', 'patch', 'put']

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'business_profile'):
            return InventoryAllocation.objects.none()
        
        # Show allocations where user is SENDER OR RECEIVER
        return InventoryAllocation.objects.filter(
            models.Q(sender__user=user) | models.Q(receiver__user=user)
        ).select_related('product', 'sender', 'receiver').order_by('-created_at')


    # --- 1. Unified Creation (POST /api/allocations/) ---
    def create(self, request, *args, **kwargs):
        try:
            sender_profile = request.user.business_profile
        except AttributeError:
            return Response({"detail": "User must have a Business Profile."}, status=status.HTTP_403_FORBIDDEN)

        if sender_profile.role not in ['PRODUCER', 'STORE']:
             return Response(
                 {"detail": "Only Producers and Stores can initiate an allocation."},
                 status=status.HTTP_403_FORBIDDEN
             )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                product = serializer.validated_data['product']
                quantity_allocated = serializer.validated_data['quantity_allocated']
                
                # CRITICAL: Stock check on the Product model
                if quantity_allocated > product.available_stock:
                    raise exceptions.ValidationError({
                        "quantity_allocated": f"Insufficient stock. Only {product.available_stock} units are currently available."
                    })
                
                # Save with INITIATED status, setting the sender automatically
                serializer.save(
                    sender=sender_profile, 
                    status='INITIATED'
                )
                
        except exceptions.ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"An error occurred during transaction: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        
    # --- 2. Action: Accept Allocation (Transactional Stock Deduction) ---
    @action(detail=True, methods=['post'], url_path='accept')
    def accept_allocation(self, request, pk=None):
        try:
            user_profile = request.user.business_profile
        except AttributeError:
            return Response({"detail": "User must have a Business Profile."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            with transaction.atomic():
                # Lock the allocation and the related product row for safety
                allocation = InventoryAllocation.objects.select_for_update(
                    of=('self', 'product')
                ).get(pk=pk)

                if allocation.status != 'INITIATED':
                    return Response({"detail": "This allocation is not awaiting action."}, status=status.HTTP_400_BAD_REQUEST)
                
                # Determine the required approver: The one NOT initiating the action.
                approver_profile = allocation.receiver if allocation.sender.role == 'PRODUCER' else allocation.sender
                
                if user_profile != approver_profile:
                    return Response({"detail": "You are not authorized to accept this allocation."}, status=status.HTTP_403_FORBIDDEN)
                
                # CRITICAL: Perform Stock Deduction
                product = allocation.product
                
                if allocation.quantity_allocated > product.available_stock:
                    # Reject if stock is now insufficient (defense against race conditions)
                    allocation.status = 'REJECTED'
                    allocation.save(update_fields=['status'])
                    return Response({
                        "detail": "Acceptance failed. Insufficient stock due to prior transactions.",
                        "new_status": "REJECTED"
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Deduct stock and update status
                product.available_stock -= allocation.quantity_allocated
                product.save(update_fields=['available_stock'])
                
                allocation.status = 'ACCEPTED'
                allocation.save(update_fields=['status']) 
        
        except InventoryAllocation.DoesNotExist:
            return Response({"detail": "Allocation not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": f"An error occurred during acceptance: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(self.get_serializer(allocation).data, status=status.HTTP_200_OK)

    # --- 3. Action: Reject Allocation ---
    @action(detail=True, methods=['post'], url_path='reject')
    def reject_allocation(self, request, pk=None):
        try:
            user_profile = request.user.business_profile
        except AttributeError:
            return Response({"detail": "User must have a Business Profile."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            allocation = self.get_object()
        except:
            return Response({"detail": "Allocation not found."}, status=status.HTTP_404_NOT_FOUND)

        if allocation.status != 'INITIATED':
            return Response({"detail": "This allocation is not awaiting rejection."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Determine the required rejecter (same logic as accept)
        approver_profile = allocation.receiver if allocation.sender.role == 'PRODUCER' else allocation.sender
                
        if user_profile != approver_profile:
             return Response({"detail": "You are not authorized to reject this allocation."}, status=status.HTTP_403_FORBIDDEN)

        # No stock changes required on rejection
        allocation.status = 'REJECTED'
        allocation.save(update_fields=['status']) 
        
        return Response(self.get_serializer(allocation).data, status=status.HTTP_200_OK)

# =========================================================================
# 5. USER PROFILE ACCOUNT VIEW (Combined User and Profile Data)
# =========================================================================

class UserProfileView(APIView):
    """Get and update the currently authenticated user's account information and related profiles."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Returns the authenticated user's information along with their business profiles."""
        user = request.user
        
        try:
            # 🛑 FIXED: Use correct queryset filter syntax
            business_profiles = BusinessProfile.objects.filter(user=user) 
            profile_data = BusinessProfileSerializer(business_profiles, many=True, context={'request': request}).data
        except Exception as e:
            # Better error handling/logging
            profile_data = []

        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'business_profiles': profile_data 
        }, status=status.HTTP_200_OK)
    
    def patch(self, request):
        """Updates the authenticated user's account information."""
        user = request.user
        serializer = CustomUserSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            if 'password' in request.data:
                user.set_password(request.data['password'])
                user.save()
                return Response({'message': 'Password updated. Please log in again.'}, status=status.HTTP_200_OK)
            
            serializer.save()
            
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'message': 'Account updated successfully'
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)