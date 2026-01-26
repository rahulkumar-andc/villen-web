from rest_framework import serializers
from .models import BlogCategory, BlogPost, PostReaction, ReactionSummary


class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ['id', 'name', 'slug', 'color']


class ReactionSummarySerializer(serializers.ModelSerializer):
    """Serializer for reaction summary."""
    class Meta:
        model = ReactionSummary
        fields = [
            'like_count', 'insightful_count', 'helpful_count',
            'interesting_count', 'confusing_count', 'total_reactions'
        ]


class PostReactionSerializer(serializers.ModelSerializer):
    """Serializer for individual reactions."""
    emoji = serializers.CharField(read_only=True)
    
    class Meta:
        model = PostReaction
        fields = ['id', 'reaction', 'emoji', 'created_at']


class BlogPostListSerializer(serializers.ModelSerializer):
    """Serializer for post list (no content)."""
    category = BlogCategorySerializer(read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    reactions = ReactionSummarySerializer(read_only=True, source='reaction_summary')
    user_reactions = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'category',
            'author_name', 'reading_time_mins', 'created_at',
            'is_public', 'is_restricted', 'reactions', 'user_reactions'
        ]
    
    def get_user_reactions(self, obj):
        """Get the reactions the current user has made."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return PostReaction.objects.filter(
                post=obj, user=request.user
            ).values_list('reaction', flat=True)
        return []


class BlogPostDetailSerializer(serializers.ModelSerializer):
    """Serializer for single post (with content)."""
    category = BlogCategorySerializer(read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    reactions = ReactionSummarySerializer(read_only=True, source='reaction_summary')
    user_reactions = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content', 'category',
            'author_name', 'reading_time_mins', 'created_at', 'updated_at',
            'is_public', 'is_restricted', 'min_role_level',
            'reactions', 'user_reactions'
        ]
    
    def get_user_reactions(self, obj):
        """Get the reactions the current user has made."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return PostReaction.objects.filter(
                post=obj, user=request.user
            ).values_list('reaction', flat=True)
        return []


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


class ReactionActionSerializer(serializers.Serializer):
    """Serializer for reaction actions."""
    reaction = serializers.ChoiceField(choices=PostReaction.REACTION_CHOICES)
    guest_id = serializers.CharField(required=False, allow_blank=True)
    
    def validate_reaction(self, value):
        """Ensure reaction is valid."""
        valid_reactions = [choice[0] for choice in PostReaction.REACTION_CHOICES]
        if value not in valid_reactions:
            raise serializers.ValidationError(f"Invalid reaction. Must be one of: {valid_reactions}")
        return value
