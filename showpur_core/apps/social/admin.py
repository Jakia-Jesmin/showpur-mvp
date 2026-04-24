from django.contrib import admin
from .models import Post, Like, Comment, CommentLike, PostView

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['id', 'author', 'content_preview', 'post_type', 'likes_count', 'comments_count', 'created_at']
    list_filter = ['post_type', 'is_public', 'is_active', 'created_at']
    search_fields = ['author__email', 'content']
    readonly_fields = ['likes_count', 'comments_count', 'shares_count', 'views_count']
    
    def content_preview(self, obj):
        return obj.content[:50]
    content_preview.short_description = 'Content'

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'post__content']

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'content_preview', 'likes_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'content']
    
    def content_preview(self, obj):
        return obj.content[:50]
    content_preview.short_description = 'Content'

@admin.register(PostView)
class PostViewAdmin(admin.ModelAdmin):
    list_display = ['post', 'user', 'ip_address', 'viewed_at']
    list_filter = ['viewed_at']