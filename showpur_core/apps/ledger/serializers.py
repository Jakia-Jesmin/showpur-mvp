from rest_framework import serializers
from .models import Account


class AccountSerializer(serializers.ModelSerializer):
    account_type_display = serializers.CharField(source='get_account_type_display', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True, default=None)
    sub_accounts = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = [
            'id', 'name', 'name_bn', 'icon', 'account_code',
            'account_type', 'account_type_display',
            'parent', 'parent_name', 'sub_accounts',
            'is_default', 'is_active', 'order',
        ]
        read_only_fields = ['id', 'is_default']

    def get_sub_accounts(self, obj):
        if obj.parent_id is None:
            subs = obj.sub_accounts.filter(is_active=True)
            return AccountSerializer(subs, many=True).data
        return []
