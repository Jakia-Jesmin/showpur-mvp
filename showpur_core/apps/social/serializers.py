from rest_framework import serializers
from .models import Post, Like, Comment, CommentLike, PostView
from apps.accounts.serializers import UserSerializer, BusinessProfileSerializer
from apps.products.serializers import ProductListSerializer

class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.profile.business_name', read_only=True)
    user_avatar = serializers.ImageField(source='user.profile.logo', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    replies = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'user_name', 'user_avatar', 'user_role', 'content', 
                  'parent_comment', 'replies', 'likes_count', 'is_liked', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
    
    def get_replies(self, obj):
        if obj.parent_comment is None:
            replies = Comment.objects.filter(parent_comment=obj, is_active=True)
            return CommentSerializer(replies, many=True, context=self.context).data
        return []
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return CommentLike.objects.filter(comment=obj, user=request.user).exists()
        return False

class PostListSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.profile.business_name', read_only=True)
    author_logo = serializers.ImageField(source='author.profile.logo', read_only=True)
    author_role = serializers.CharField(source='author.role', read_only=True)
    main_image = serializers.ImageField(source='image', read_only=True)
    promoted_product_details = ProductListSerializer(source='promoted_product', read_only=True)
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ['id', 'author', 'author_name', 'author_logo', 'author_role', 'content', 
                  'post_type', 'image', 'video_url', 'promoted_product', 'promoted_product_details',
                  'shared_post', 'likes_count', 'comments_count', 'shares_count', 'views_count',
                  'is_liked', 'created_at']
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(post=obj, user=request.user).exists()
        return False

class PostDetailSerializer(PostListSerializer):
    comments = serializers.SerializerMethodField()
    is_shared = serializers.SerializerMethodField()
    shared_post_details = serializers.SerializerMethodField()
    
    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + ['comments', 'is_shared', 'shared_post_details']
    
    def get_comments(self, obj):
        comments = obj.comments.filter(parent_comment=None, is_active=True)
        return CommentSerializer(comments, many=True, context=self.context).data
    
    def get_is_shared(self, obj):
        return obj.shared_post is not None
    
    def get_shared_post_details(self, obj):
        if obj.shared_post:
            return PostListSerializer(obj.shared_post, context=self.context).data
        return None

class PostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['content', 'post_type', 'image', 'video_url', 'promoted_product', 'is_public']
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)

class SharePostSerializer(serializers.Serializer):
    content = serializers.CharField(required=False, allow_blank=True)