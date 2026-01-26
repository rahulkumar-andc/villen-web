from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import BlogCategory, BlogPost
from .blog_serializers import (
    BlogCategorySerializer,
    BlogPostListSerializer,
    BlogPostDetailSerializer,
    BlogPostCreateSerializer
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
