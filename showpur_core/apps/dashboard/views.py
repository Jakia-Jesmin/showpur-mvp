from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from apps.products.models import Product
from apps.display.models import DisplayAgreement, InventoryTransaction
from apps.connections.models import Connection, ConnectionRequest
from apps.social.models import Post

class ProducerDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if user.role != 'producer':
            return Response({"error": "Not a producer"}, status=403)
        
        # Basic stats
        total_products = Product.objects.filter(owner=user).count()
        active_products = Product.objects.filter(owner=user, is_active=True).count()
        
        # Display agreements
        active_agreements = DisplayAgreement.objects.filter(
            product__owner=user, 
            status='active'
        )
        pending_agreements = DisplayAgreement.objects.filter(
            product__owner=user,
            status='pending_approval'
        )
        
        # Financial stats
        total_units_sold = active_agreements.aggregate(Sum('units_sold'))['units_sold__sum'] or 0
        total_commission = active_agreements.aggregate(Sum('total_commission_earned'))['total_commission_earned__sum'] or 0
        
        # Connections
        active_connections = Connection.objects.filter(producer=user, is_active=True).count()
        pending_requests = ConnectionRequest.objects.filter(
            to_user=user, 
            status='pending'
        ).count()
        
        # Recent transactions
        recent_transactions = InventoryTransaction.objects.filter(
            display_agreement__product__owner=user
        ).order_by('-created_at')[:10]
        
        # Social stats
        total_posts = Post.objects.filter(author=user).count()
        total_likes_received = Post.objects.filter(author=user).aggregate(Sum('likes_count'))['likes_count__sum'] or 0
        
        # Chart data - last 7 days sales
        last_7_days = []
        for i in range(6, -1, -1):
            date = timezone.now().date() - timedelta(days=i)
            sales = InventoryTransaction.objects.filter(
                display_agreement__product__owner=user,
                transaction_type='sale',
                created_at__date=date
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            last_7_days.append({
                'date': date.strftime('%Y-%m-%d'),
                'sales': float(sales)
            })
        
        # Top performing products
        top_products = Product.objects.filter(owner=user).annotate(
            total_sales=Sum('display_agreements__units_sold')
        ).order_by('-total_sales')[:5]
        
        top_products_data = [
            {
                'name': p.name,
                'units_sold': p.total_sales or 0,
                'price': float(p.price)
            }
            for p in top_products
        ]
        
        return Response({
            'stats': {
                'total_products': total_products,
                'active_products': active_products,
                'active_agreements': active_agreements.count(),
                'pending_agreements': pending_agreements.count(),
                'total_units_sold': total_units_sold,
                'total_commission_earned': float(total_commission),
                'active_connections': active_connections,
                'pending_requests': pending_requests,
                'total_posts': total_posts,
                'total_engagement': total_likes_received,
            },
            'recent_transactions': [
                {
                    'type': t.transaction_type,
                    'amount': float(t.amount) if t.amount else 0,
                    'date': t.created_at.strftime('%Y-%m-%d %H:%M'),
                    'notes': t.notes
                }
                for t in recent_transactions
            ],
            'chart_data': {
                'last_7_days_sales': last_7_days,
                'top_products': top_products_data
            }
        })

class ShowroomDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if user.role != 'showroom':
            return Response({"error": "Not a showroom"}, status=403)
        
        # Display agreements
        active_agreements = DisplayAgreement.objects.filter(showroom=user, status='active')
        pending_agreements = DisplayAgreement.objects.filter(showroom=user, status='pending_approval')
        
        # Financial stats
        total_units_sold = active_agreements.aggregate(Sum('units_sold'))['units_sold__sum'] or 0
        total_commission = active_agreements.aggregate(Sum('total_commission_earned'))['total_commission_earned__sum'] or 0
        total_rent = active_agreements.aggregate(Sum('total_rent_paid'))['total_rent_paid__sum'] or 0
        
        # Unique producers
        unique_producers = active_agreements.values('product__owner').distinct().count()
        
        # Connections
        active_connections = Connection.objects.filter(showroom=user, is_active=True).count()
        pending_requests = ConnectionRequest.objects.filter(
            to_user=user, 
            status='pending'
        ).count()
        
        # Space utilization
        total_space = user.profile.available_shelf_space or 0
        used_space = active_agreements.aggregate(Sum('display_area_sqft'))['display_area_sqft__sum'] or 0
        space_utilization = (used_space / total_space * 100) if total_space > 0 else 0
        
        # Recent sales
        recent_sales = InventoryTransaction.objects.filter(
            display_agreement__showroom=user,
            transaction_type='sale'
        ).order_by('-created_at')[:10]
        
        # Chart data - last 7 days sales
        last_7_days = []
        for i in range(6, -1, -1):
            date = timezone.now().date() - timedelta(days=i)
            sales = InventoryTransaction.objects.filter(
                display_agreement__showroom=user,
                transaction_type='sale',
                created_at__date=date
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            last_7_days.append({
                'date': date.strftime('%Y-%m-%d'),
                'sales': float(sales)
            })
        
        # Products by category
        category_stats = {}
        for agreement in active_agreements.select_related('product__category'):
            cat_name = agreement.product.category.name if agreement.product.category else 'Uncategorized'
            if cat_name not in category_stats:
                category_stats[cat_name] = {
                    'count': 0,
                    'units_sold': 0
                }
            category_stats[cat_name]['count'] += 1
            category_stats[cat_name]['units_sold'] += agreement.units_sold
        
        return Response({
            'stats': {
                'active_agreements': active_agreements.count(),
                'pending_agreements': pending_agreements.count(),
                'total_units_sold': total_units_sold,
                'total_commission_earned': float(total_commission),
                'total_rent_collected': float(total_rent),
                'unique_producers': unique_producers,
                'active_connections': active_connections,
                'pending_requests': pending_requests,
                'space_utilization': round(space_utilization, 1),
                'used_space': float(used_space),
                'total_space': float(total_space),
            },
            'recent_sales': [
                {
                    'product': s.display_agreement.product.name,
                    'quantity': s.quantity,
                    'amount': float(s.amount) if s.amount else 0,
                    'customer': s.customer_name,
                    'date': s.created_at.strftime('%Y-%m-%d %H:%M')
                }
                for s in recent_sales
            ],
            'chart_data': {
                'last_7_days_sales': last_7_days,
                'category_distribution': [
                    {'name': k, 'count': v['count'], 'units_sold': v['units_sold']}
                    for k, v in category_stats.items()
                ]
            }
        })