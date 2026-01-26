from django.http import HttpResponse
from django.utils import timezone
from django.conf import settings
from django.views.decorators.http import condition
from django.utils.feedgenerator import Rss201rev2Feed
from .models import BlogPost
import logging

logger = logging.getLogger(__name__)


def get_feed_last_modified(request):
    """Get the last modified time of the feed."""
    latest_post = BlogPost.objects.filter(
        is_public=True,
        is_restricted=False
    ).order_by('-created_at').first()
    
    return latest_post.updated_at if latest_post else timezone.now()


def get_feed_etag(request):
    """Generate ETag for the feed."""
    latest_post = BlogPost.objects.filter(
        is_public=True,
        is_restricted=False
    ).order_by('-created_at').first()
    
    return str(latest_post.id) if latest_post else "empty"


@condition(etag_func=get_feed_etag, last_modified_func=get_feed_last_modified)
def rss_feed(request):
    """
    Generate proper RSS 2.0 feed for blog posts.
    Includes caching headers and proper XML format.
    Accessible at /feeds/rss/
    """
    try:
        # Get posts with pagination
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', min(int(request.GET.get('per_page', 50)), 50)))
        
        start = (page - 1) * per_page
        end = start + per_page
        
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
        
        logger.info(f'RSS feed accessed. Returned {len(posts)} posts.')
        return response
        
    except ValueError as e:
        logger.warning(f'Invalid pagination parameters: {e}')
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
        logger.error(f'RSS feed generation error: {e}')
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

