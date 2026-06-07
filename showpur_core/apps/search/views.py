from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import status
from django.db.models import Q, Count
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from showpur_core.apps.products.models import Product, Category
from showpur_core.apps.accounts.models import BusinessProfile
from showpur_core.apps.display.models import DisplayAgreement

class GlobalSearchAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        search_type = request.query_params.get('type', 'all')  # all, products, showrooms, producers
        
        if not query:
            return Response({
                'products': [],
                'showrooms': [],
                'producers': [],
                'total_results': 0
            })
        
        results = {}
        
        # Search products
        if search_type in ['all', 'products']:
            results['products'] = self.search_products(query, request)
        
        # Search showrooms
        if search_type in ['all', 'showrooms']:
            results['showrooms'] = self.search_showrooms(query, request)
        
        # Search producers
        if search_type in ['all', 'producers']:
            results['producers'] = self.search_producers(query, request)
        
        total = len(results.get('products', [])) + len(results.get('showrooms', [])) + len(results.get('producers', []))
        results['total_results'] = total
        
        return Response(results)
    
    def search_products(self, query, request):
        products = Product.objects.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(category__name__icontains=query),
            is_active=True,
            is_approved=True
        ).select_related('category', 'owner__profile')[:20]
        
        return [
            {
                'id': p.id,
                'type': 'product',
                'name': p.name,
                'description': p.short_description or p.description[:150],
                'price': float(p.price),
                'image': p.main_image.url if p.main_image else None,
                'category': p.category.name if p.category else None,
                'owner_name': p.owner.profile.business_name,
                'url': f'/products/{p.slug}/'
            }
            for p in products
        ]
    
    def search_showrooms(self, query, request):
        showrooms = BusinessProfile.objects.filter(
            Q(business_name__icontains=query) |
            Q(bio__icontains=query) |
            Q(location__icontains=query),
            user__role='showroom'
        ).select_related('user')[:20]
        
        return [
            {
                'id': s.id,
                'type': 'showroom',
                'name': s.business_name,
                'description': s.bio[:150] if s.bio else '',
                'location': s.location,
                'logo': s.logo.url if s.logo else None,
                'followers': s.followers.count(),
                'url': f'/showroom/{s.user.id}/'
            }
            for s in showrooms
        ]
    
    def search_producers(self, query, request):
        producers = BusinessProfile.objects.filter(
            Q(business_name__icontains=query) |
            Q(bio__icontains=query) |
            Q(product_categories__icontains=query),
            user__role='producer'
        ).select_related('user')[:20]
        
        return [
            {
                'id': p.id,
                'type': 'producer',
                'name': p.business_name,
                'description': p.bio[:150] if p.bio else '',
                'logo': p.logo.url if p.logo else None,
                'product_count': p.user.products.filter(is_active=True).count(),
                'url': f'/producer/{p.user.id}/'
            }
            for p in producers
        ]

class AdvancedSearchAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def post(self, request):
        filters = request.data
        
        queryset = Product.objects.filter(is_active=True, is_approved=True)
        
        # Category filter
        if filters.get('category_id'):
            queryset = queryset.filter(category_id=filters['category_id'])
        
        # Price range
        if filters.get('min_price'):
            queryset = queryset.filter(price__gte=filters['min_price'])
        if filters.get('max_price'):
            queryset = queryset.filter(price__lte=filters['max_price'])
        
        # Location (via showroom availability)
        if filters.get('location'):
            queryset = queryset.filter(
                display_agreements__showroom__profile__location__icontains=filters['location'],
                display_agreements__status='active'
            ).distinct()
        
        # Condition
        if filters.get('condition'):
            queryset = queryset.filter(condition=filters['condition'])
        
        # In stock only
        if filters.get('in_stock_only'):
            queryset = queryset.filter(stock_quantity__gt=0)
        
        # Sort
        sort_by = filters.get('sort_by', '-created_at')
        if sort_by in ['price', '-price', 'created_at', '-created_at', 'name']:
            queryset = queryset.order_by(sort_by)
        
        # Pagination
        page = filters.get('page', 1)
        page_size = filters.get('page_size', 20)
        start = (page - 1) * page_size
        end = start + page_size
        
        total = queryset.count()
        products = queryset[start:end]
        
        from showpur_core.apps.products.serializers import ProductListSerializer
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        
        return Response({
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size,
            'results': serializer.data
        })

class SearchSuggestionsAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        
        if not query or len(query) < 2:
            return Response({'suggestions': []})
        
        suggestions = set()
        
        # Product name suggestions
        products = Product.objects.filter(
            name__icontains=query,
            is_active=True
        )[:5]
        for p in products:
            suggestions.add(p.name)
        
        # Category suggestions
        categories = Category.objects.filter(name__icontains=query)[:3]
        for c in categories:
            suggestions.add(c.name)
        
        # Business name suggestions
        businesses = BusinessProfile.objects.filter(
            business_name__icontains=query
        )[:5]
        for b in businesses:
            suggestions.add(b.business_name)
        
        return Response({'suggestions': list(suggestions)[:10]})

class TrendingSearchAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get(self, request):
        # For now, return popular categories and featured products
        popular_categories = Category.objects.annotate(
            product_count=Count('products')
        ).filter(product_count__gt=0).order_by('-product_count')[:5]
        
        featured_products = Product.objects.filter(
            is_featured=True, 
            is_active=True
        )[:5]
        
        from showpur_core.apps.products.serializers import ProductListSerializer, CategorySerializer
        
        return Response({
            'popular_categories': CategorySerializer(popular_categories, many=True).data,
            'featured_products': ProductListSerializer(featured_products, many=True, context={'request': request}).data
        })