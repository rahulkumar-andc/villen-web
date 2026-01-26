# backend/api/versioning.py
"""
API versioning implementation for the Villen Web API.
Supports version negotiation via Accept headers.
"""

from rest_framework.versioning import BaseVersioning
from rest_framework.exceptions import NotAcceptable
import re


class AcceptHeaderVersioning(BaseVersioning):
    """
    Custom versioning scheme using Accept headers.
    Format: application/vnd.villen.v1+json
    """

    default_version = 'v1'
    allowed_versions = ['v1']
    version_param = 'version'

    def determine_version(self, request, *args, **kwargs):
        """
        Determine the API version from the Accept header.
        """
        accept_header = request.META.get('HTTP_ACCEPT', '')

        # Look for version in Accept header (e.g., application/vnd.villen.v1+json)
        version_match = re.search(r'application/vnd\.villen\.(\w+)\+json', accept_header)

        if version_match:
            version = f"v{version_match.group(1)}"
            if version in self.allowed_versions:
                return version

        # Default to v1 if no version specified or invalid version
        return self.default_version

    def reverse(self, viewname, args=None, kwargs=None, request=None, format=None, **extra):
        """
        Reverse URL with version information.
        """
        # For now, just return the standard reverse
        # In a more complex setup, this could modify URLs based on version
        return super().reverse(viewname, args, kwargs, request, format, **extra)


class VillenVersioning:
    """
    Utility class for handling API versioning logic.
    """

    @staticmethod
    def get_version_features(version):
        """
        Return features available for a specific API version.
        """
        features = {
            'v1': {
                'blog_posts': True,
                'projects': True,
                'notes': True,
                'contact': True,
                'rss_feed': True,
                'health_check': True,
                'api_keys': True,
                'pagination': True,
                'filtering': True,
                'search': True,
            }
        }

        return features.get(version, features['v1'])

    @staticmethod
    def is_feature_available(version, feature):
        """
        Check if a feature is available in the given version.
        """
        features = VillenVersioning.get_version_features(version)
        return features.get(feature, False)

    @staticmethod
    def get_deprecated_features(version):
        """
        Return features that are deprecated in the given version.
        """
        deprecated = {
            'v1': [],  # No deprecated features in v1
        }

        return deprecated.get(version, [])

    @staticmethod
    def get_sunset_date(version):
        """
        Return sunset date for API versions.
        """
        # Example: versions are supported for 2 years
        sunset_dates = {
            'v1': None,  # Current version, no sunset date
        }

        return sunset_dates.get(version)