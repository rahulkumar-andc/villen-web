from rest_framework import serializers
from .models import BlogCategory, BlogPost


class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ['id', 'name', 'slug', 'color']


class BlogPostListSerializer(serializers.ModelSerializer):
    """Serializer for post list (no content)."""
    category = BlogCategorySerializer(read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'category',
            'author_name', 'reading_time_mins', 'created_at',
            'is_public', 'is_restricted'
        ]


class BlogPostDetailSerializer(serializers.ModelSerializer):
    """Serializer for single post (with content)."""
    category = BlogCategorySerializer(read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content', 'category',
            'author_name', 'reading_time_mins', 'created_at', 'updated_at',
            'is_public', 'is_restricted', 'min_role_level'
        ]


class BlogPostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating posts."""
    category_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = BlogPost
        fields = [
            'title', 'slug', 'excerpt', 'content', 'category_id',
            'is_public', 'is_restricted', 'min_role_level', 'reading_time_mins'
        ]
    
    def create(self, validated_data):
        category_id = validated_data.pop('category_id', None)
        if category_id:
            validated_data['category'] = BlogCategory.objects.get(id=category_id)
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
