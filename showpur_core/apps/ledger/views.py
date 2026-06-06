from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from apps.accounts.models import BusinessProfile
from .models import Account
from .serializers import AccountSerializer


def get_business(user):
    business, _ = BusinessProfile.objects.get_or_create(
        user=user,
        defaults={'business_name': user.get_full_name() or f"{user.username}'s Business",
                  'location': ''}
    )
    return business


class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        business = get_business(self.request.user)
        qs = Account.objects.filter(business=business, is_active=True, parent=None)
        account_type = self.request.query_params.get('type')
        if account_type:
            qs = qs.filter(account_type=account_type)
        return qs

    def perform_create(self, serializer):
        business = get_business(self.request.user)
        serializer.save(business=business, is_default=False)

    def perform_destroy(self, instance):
        if instance.is_default:
            raise PermissionDenied("System accounts cannot be deleted.")
        instance.is_active = False
        instance.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
