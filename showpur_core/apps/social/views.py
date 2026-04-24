from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import Post, Like, Comment, CommentLike, PostView
from .serializers import (
    PostListSerializer, PostDetailSerializer, PostCreateSerializer,
    CommentSerializer, SharePostSerializer
)

class PostViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['content']
    ordering_fields = ['created_at', 'likes_count', 'comments_count']
    
    def get_queryset(self):
        user = self.request.user
        post_type = self.request.query_params.get('post_type', None)
        
        if user.is_authenticated:
            # Show posts from users they follow + their own + public posts
            following_users = user.following_businesses.all()
            queryset = Post.objects.filter(
                Q(is_public=True) |
                Q(author=user) |
                Q(author__in=following_users),
                is_active=True
            )
        else:
            queryset = Post.objects.filter(is_public=True, is_active=True)
        
        if post_type:
            queryset = queryset.filter(post_type=post_type)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PostListSerializer
        elif self.action == 'retrieve':
            return PostDetailSerializer
        elif self.action == 'create':
            return PostCreateSerializer
        return PostListSerializer
    
    def perform_create(self, serializer):
        serializer.save()
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Record view
        PostView.objects.create(
            post=instance,
            user=request.user if request.user.is_authenticated else None,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        
        if not created:
            like.delete()
            post.update_stats()
            return Response({'status': 'unliked', 'likes_count': post.likes_count})
        
        post.update_stats()
        return Response({'status': 'liked', 'likes_count': post.likes_count})
    
    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        original_post = self.get_object()
        serializer = SharePostSerializer(data=request.data)
        
        if serializer.is_valid():
            shared_post = Post.objects.create(
                author=request.user,
                content=serializer.validated_data.get('content', ''),
                shared_post=original_post,
                post_type=original_post.post_type
            )
            
            # Update original post's share count
            original_post.shares_count += 1
            original_post.save(update_fields=['shares_count'])
            
            result_serializer = PostListSerializer(shared_post, context={'request': request})
            return Response(result_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def feed(self, request):
        """Get feed of posts from followed businesses"""
        following = request.user.following_businesses.all()
        posts = Post.objects.filter(
            author__in=following,
            is_active=True,
            is_public=True
        ).order_by('-created_at')[:50]
        
        serializer = PostListSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_posts(self, request):
        posts = Post.objects.filter(author=request.user, is_active=True)
        serializer = PostListSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        post_id = self.request.query_params.get('post_id')
        if post_id:
            return Comment.objects.filter(post_id=post_id, parent_comment=None, is_active=True)
        return Comment.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        post_id = self.request.data.get('post_id')
        parent_id = self.request.data.get('parent_comment')
        
        post = get_object_or_404(Post, id=post_id)
        parent = None
        if parent_id:
            parent = get_object_or_404(Comment, id=parent_id)
        
        comment = serializer.save(user=self.request.user, post=post, parent_comment=parent)
        
        # Update post comment count
        post.comments_count += 1
        post.save(update_fields=['comments_count'])
        
        return comment
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        comment = self.get_object()
        like, created = CommentLike.objects.get_or_create(user=request.user, comment=comment)
        
        if not created:
            like.delete()
            comment.likes_count -= 1
            comment.save(update_fields=['likes_count'])
            return Response({'status': 'unliked', 'likes_count': comment.likes_count})
        
        comment.likes_count += 1
        comment.save(update_fields=['likes_count'])
        return Response({'status': 'liked', 'likes_count': comment.likes_count})