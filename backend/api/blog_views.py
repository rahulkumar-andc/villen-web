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
        try:
            # Check for profile and role safely
            if hasattr(request.user, 'profile') and request.user.profile.role:
                if request.user.profile.role.level <= 2: # Admin or Super Admin
                    posts = BlogPost.objects.all()
        except Exception:
            # UserProfile.DoesNotExist or other issues
            pass


    if category_slug and category_slug != 'all':
        posts = posts.filter(category__slug=category_slug)
    
    # Filter restricted posts for unauthenticated users (if looking at public list)
    if not request.user.is_authenticated:
        posts = posts.filter(is_restricted=False)
    
    serializer = BlogPostListSerializer(posts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_post(request, slug):
    """Get single blog post by slug."""
    post = get_object_or_404(BlogPost, slug=slug)
    
    # Check access
    if not post.can_access(request.user):
        return Response({
            'error': 'Access denied. Login required.',
            'is_restricted': True
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = BlogPostDetailSerializer(post)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    """Create a new blog post (admin only)."""
    # Check if user is admin
    profile = getattr(request.user, 'profile', None)
    if not profile or not profile.role or profile.role.level > 2:
        return Response({
            'error': 'Admin access required.'
        }, status=status.HTTP_403_FORBIDDEN)
    
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
    
    # Check if user is admin or author
    profile = getattr(request.user, 'profile', None)
    is_admin = profile and profile.role and profile.role.level <= 2
    is_author = post.author == request.user
    
    if not (is_admin or is_author):
        return Response({
            'error': 'Permission denied.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'DELETE':
        post.delete()
        return Response({'message': 'Post deleted.'}, status=status.HTTP_200_OK)
    
    # PUT - update
    serializer = BlogPostCreateSerializer(post, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        post = serializer.save()
        return Response(BlogPostDetailSerializer(post).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
