from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.http import HttpResponse
from django.utils import timezone
from django.utils.feedgenerator import Rss201rev2Feed
from .models import Note, BlogPost
from .serializers import NoteSerializer
from .permissions import APIKeyOrUserAuth, HasAPIKeyScope

from rest_framework.permissions import IsAuthenticated
from .permissions import IsOwner

class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        # Users can only see their own notes
        return Note.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # Auto-assign the current user as owner
        serializer.save(user=self.request.user)

@api_view(['POST'])
def contact_api(request):
    # In a real app, you'd send an email or save to DB here
    return Response({"status": "success", "message": "Transmission received."})


# =============================================================================
# RSS Feed with API Key Support
# =============================================================================

class RSSFeedView(APIView):
    """
    RSS feed endpoint with API key authentication support.
    Accessible to both authenticated users and API keys with 'read' scope.
    """
    permission_classes = [APIKeyOrUserAuth, HasAPIKeyScope('read')]

    def get(self, request):
        """
        Generate RSS feed with optional API key authentication.
        """
        try:
            # Get pagination parameters
            page = int(request.GET.get('page', 1))
            per_page = int(request.GET.get('per_page', min(int(request.GET.get('per_page', 50)), 50)))

            start = (page - 1) * per_page
            end = start + per_page

            # Get public blog posts
            posts = BlogPost.objects.filter(
                is_public=True,
                is_restricted=False
            ).order_by('-created_at')[start:end]

            # Build absolute URL from request
            site_url = request.build_absolute_uri('/').rstrip('/')
            blog_url = f"{site_url}/blog"

            # Create feed
            feed = Rss201rev2Feed(
                title='Shadow Layer Blog',
                link=blog_url,
                description='Cybersecurity research, tools, and insights from Villen',
                language='en-us',
            )

            # Add posts to feed
            for post in posts:
                feed.add_item(
                    title=post.title,
                    link=f"{blog_url}/{post.slug}",
                    description=post.excerpt or post.content[:200],
                    author_email='contact@villen.me',
                    author_name='Villen',
                    pubdate=post.created_at,
                    updateddate=post.updated_at,
                    categories=[post.category.name] if post.category else [],
                    unique_id=post.slug,
                    item_copyright='Copyright © 2024 Villen. All rights reserved.',
                )

            # Generate RSS XML
            response = HttpResponse(
                feed.writeString('UTF-8'),
                content_type='application/rss+xml; charset=utf-8'
            )

            # Add caching headers
            response['Cache-Control'] = 'public, max-age=3600'  # Cache for 1 hour
            response['X-Frame-Options'] = 'SAMEORIGIN'

            # Add API key usage info if authenticated via API key
            if hasattr(request, 'auth') and hasattr(request.auth, 'name'):
                response['X-API-Key-Name'] = request.auth.name

            return response

        except ValueError as e:
            return HttpResponse(
                '<?xml version="1.0" encoding="UTF-8"?>'
                '<rss version="2.0">'
                '<channel>'
                '<title>Error</title>'
                '<description>Invalid pagination parameters</description>'
                '</channel>'
                '</rss>',
                content_type='application/rss+xml; charset=utf-8',
                status=400
            )
        except Exception as e:
            return HttpResponse(
                '<?xml version="1.0" encoding="UTF-8"?>'
                '<rss version="2.0">'
                '<channel>'
                '<title>Error</title>'
                '<description>Error generating feed</description>'
                '</channel>'
                '</rss>',
                content_type='application/rss+xml; charset=utf-8',
                status=500
            )
