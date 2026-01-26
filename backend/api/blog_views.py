from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import BlogCategory, BlogPost, PostReaction, ReactionSummary
from .blog_serializers import (
    BlogCategorySerializer,
    BlogPostListSerializer,
    BlogPostDetailSerializer,
    BlogPostCreateSerializer,
    ReactionActionSerializer,
    PostReactionSerializer
)


from .permissions import IsAdmin, IsOwner

@api_view(['GET'])
@permission_classes([AllowAny])
def list_categories(request):
    """List all blog categories."""
    categories = BlogCategory.objects.all()
    serializer = BlogCategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_posts(request):
    """List blog posts. Admins see all, others see public only."""
    category_slug = request.query_params.get('category')
    
    # Default to public posts
    posts = BlogPost.objects.filter(is_public=True)
    
    # Allow admins to see everything
    if request.user.is_authenticated:
        # Check if Admin (Level <= 2) using permissions logic would be cleaner, 
        # but for list filtering we need to check request.user directly or use a custom queryset method.
        # We'll keep the manual check here for LIST filtering, but safe.
        try:
            if hasattr(request.user, 'profile') and request.user.profile.role:
                if request.user.profile.role.level <= 2: # Admin
                    posts = BlogPost.objects.all()
        except Exception:
            pass

    if category_slug and category_slug != 'all':
        posts = posts.filter(category__slug=category_slug)
    
    # Filter restricted posts for unauthenticated users
    if not request.user.is_authenticated:
        posts = posts.filter(is_restricted=False)
    
    serializer = BlogPostListSerializer(posts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_post(request, slug):
    """Get single blog post."""
    post = get_object_or_404(BlogPost, slug=slug)
    
    # Check access logic model method
    if not post.can_access(request.user):
        return Response({
            'error': 'Access denied. Login required.',
            'is_restricted': True
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = BlogPostDetailSerializer(post)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def create_post(request):
    """Create a new blog post (admin only)."""
    # Permission class handles the check now
    serializer = BlogPostCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        post = serializer.save()
        return Response(BlogPostDetailSerializer(post).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def update_delete_post(request, slug):
    """Update or delete a blog post."""
    post = get_object_or_404(BlogPost, slug=slug)
    
    # Manual check for OR condition (Admin OR Owner)
    # DRF function-based views with OR permissions are tricky with decorators.
    # So we used IsAuthenticated above, and check object permission here.
    
    # We can use our Permission classes manually
    is_admin = IsAdmin().has_permission(request, None)
    is_owner = IsOwner().has_object_permission(request, None, post)
    
    if not (is_admin or is_owner):
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'DELETE':
        post.delete()
        return Response({'message': 'Post deleted.'}, status=status.HTTP_200_OK)
    
    # PUT
    serializer = BlogPostCreateSerializer(post, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        post = serializer.save()
        return Response(BlogPostDetailSerializer(post).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# Blog Reactions
# =============================================================================

def get_client_ip(request):
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def generate_guest_id(request):
    """Generate a unique ID for anonymous users based on IP and user agent."""
    import hashlib
    ip = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    unique_string = f"{ip}:{user_agent}"
    return hashlib.md5(unique_string.encode()).hexdigest()


def update_reaction_summary(post):
    """Update or create reaction summary for a post."""
    summary, created = ReactionSummary.objects.get_or_create(post=post)
    summary.update_counts()
    return summary


@api_view(['POST'])
@permission_classes([AllowAny])
def add_reaction(request, slug):
    """
    Add a reaction to a blog post.
    
    POST /api/blog/{slug}/reactions/
    Body: {"reaction": "like", "guest_id": "optional"}
    """
    post = get_object_or_404(BlogPost, slug=slug)
    
    # Check if user can access the post
    if not post.can_access(request.user):
        return Response({
            'error': 'Access denied. Login required.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = ReactionActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    reaction_type = serializer.validated_data['reaction']
    guest_id = serializer.validated_data.get('guest_id')
    
    # Determine user or guest
    if request.user.is_authenticated:
        user = request.user
        guest_id = None
    else:
        user = None
        if not guest_id:
            guest_id = generate_guest_id(request)
    
    try:
        with transaction.atomic():
            # Check if reaction already exists
            existing_filter = {
                'post': post,
                'reaction': reaction_type
            }
            if user:
                existing_filter['user'] = user
            else:
                existing_filter['guest_id'] = guest_id
            
            existing_reaction = PostReaction.objects.filter(**existing_filter).first()
            
            if existing_reaction:
                # Remove the reaction (toggle off)
                existing_reaction.delete()
                action = 'removed'
            else:
                # Add new reaction
                PostReaction.objects.create(
                    post=post,
                    user=user,
                    guest_id=guest_id,
                    reaction=reaction_type,
                    ip_address=get_client_ip(request) if not user else None
                )
                action = 'added'
            
            # Update summary
            summary = update_reaction_summary(post)
            
            return Response({
                'action': action,
                'reaction': reaction_type,
                'summary': summary.to_dict(),
                'message': f'Reaction {action}.'
            }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_reactions(request, slug):
    """Get all reactions for a blog post."""
    post = get_object_or_404(BlogPost, slug=slug)
    
    # Check if user can access the post
    if not post.can_access(request.user):
        return Response({
            'error': 'Access denied. Login required.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get or create summary
    summary, created = ReactionSummary.objects.get_or_create(post=post)
    if created:
        summary.update_counts()
    
    # Get user's reactions if authenticated
    user_reactions = []
    if request.user.is_authenticated:
        user_reactions = list(PostReaction.objects.filter(
            post=post,
            user=request.user
        ).values_list('reaction', flat=True))
    
    return Response({
        'summary': summary.to_dict(),
        'user_reactions': user_reactions
    })


@api_view(['DELETE'])
@permission_classes([AllowAny])
def remove_reaction(request, slug):
    """
    Remove a specific reaction from a blog post.
    
    DELETE /api/blog/{slug}/reactions/
    Body: {"reaction": "like"}
    """
    post = get_object_or_404(BlogPost, slug=slug)
    
    if not post.can_access(request.user):
        return Response({
            'error': 'Access denied. Login required.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = ReactionActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    reaction_type = serializer.validated_data['reaction']
    
    # Build filter
    filter_params = {
        'post': post,
        'reaction': reaction_type
    }
    
    if request.user.is_authenticated:
        filter_params['user'] = request.user
    else:
        guest_id = serializer.validated_data.get('guest_id') or generate_guest_id(request)
        filter_params['guest_id'] = guest_id
    
    # Delete the reaction
    deleted, _ = PostReaction.objects.filter(**filter_params).delete()
    
    if deleted > 0:
        # Update summary
        summary, _ = ReactionSummary.objects.get_or_create(post=post)
        summary.update_counts()
        
        return Response({
            'action': 'removed',
            'reaction': reaction_type,
            'summary': summary.to_dict()
        })
    else:
        return Response({
            'error': 'Reaction not found.'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_popular_reactions(request):
    """Get posts with most reactions."""
    limit = int(request.query_params.get('limit', 10))
    
    popular_posts = []
    summaries = ReactionSummary.objects.filter(
        total_reactions__gt=0
    ).select_related('post').order_by('-total_reactions')[:limit]
    
    for summary in summaries:
        post = summary.post
        popular_posts.append({
            'slug': post.slug,
            'title': post.title,
            'reactions': summary.to_dict()
        })
    
    return Response({
        'posts': popular_posts
    })
