from django.urls import path
from .views import GlobalSearchAPIView, AdvancedSearchAPIView, SearchSuggestionsAPIView, TrendingSearchAPIView

urlpatterns = [
    path('global/', GlobalSearchAPIView.as_view(), name='global-search'),
    path('advanced/', AdvancedSearchAPIView.as_view(), name='advanced-search'),
    path('suggestions/', SearchSuggestionsAPIView.as_view(), name='search-suggestions'),
    path('trending/', TrendingSearchAPIView.as_view(), name='trending-search'),
]