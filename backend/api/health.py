"""
Health check and monitoring views for the API.
"""
from django.db import connection
from django.db.utils import OperationalError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint to monitor API status.
    Returns: 200 OK if healthy, 503 Service Unavailable if issues.
    """
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        db_status = "healthy"
    except OperationalError as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"
    
    health_data = {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "debug": settings.DEBUG,
        "timestamp": str(__import__('django.utils.timezone', fromlist=['now']).now()),
    }
    
    status_code = 200 if db_status == "healthy" else 503
    return Response(health_data, status=status_code)


@api_view(['GET'])
@permission_classes([AllowAny])
def version(request):
    """
    Returns API version information.
    """
    return Response({
        "version": "1.0.0",
        "api": "Shadow Layer API",
        "environment": "production" if not settings.DEBUG else "development",
    })
