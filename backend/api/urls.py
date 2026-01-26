from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NoteViewSet, contact_api
from .health import health_check, version
from .rss import rss_feed

router = DefaultRouter()
router.register(r'notes', NoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('contact/', contact_api),
    path('health/', health_check, name='health-check'),
    path('version/', version, name='api-version'),
    path('feeds/rss/', rss_feed, name='rss-feed'),
]
