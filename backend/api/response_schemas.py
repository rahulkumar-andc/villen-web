"""
API Response Schema Documentation
Defines expected response structures for all API endpoints
"""

# Authentication Responses
AUTH_RESPONSE_SCHEMAS = {
    'login': {
        'description': 'Successful login response',
        'status': 200,
        'schema': {
            'access': 'str (JWT token)',
            'refresh': 'str (JWT token)',
            'user': {
                'id': 'int',
                'username': 'str',
                'email': 'str',
                'firstName': 'str',
                'lastName': 'str',
                'isVerified': 'bool',
            }
        }
    },
    'register': {
        'description': 'User registration response',
        'status': 201,
        'schema': {
            'id': 'int',
            'username': 'str',
            'email': 'str',
            'message': 'str (verification email sent)',
        }
    },
    'refresh_token': {
        'description': 'Token refresh response',
        'status': 200,
        'schema': {
            'access': 'str (new JWT token)',
        }
    },
}

# Blog Responses
BLOG_RESPONSE_SCHEMAS = {
    'post_list': {
        'description': 'List of blog posts with pagination',
        'status': 200,
        'schema': {
            'count': 'int (total posts)',
            'next': 'str or null (next page URL)',
            'previous': 'str or null (previous page URL)',
            'results': [
                {
                    'id': 'int',
                    'slug': 'str',
                    'title': 'str',
                    'excerpt': 'str',
                    'content': 'str (HTML)',
                    'featuredImage': 'str (URL)',
                    'category': 'str',
                    'tags': ['str'],
                    'viewCount': 'int',
                    'likeCount': 'int',
                    'author': 'str',
                    'createdAt': 'datetime',
                    'updatedAt': 'datetime',
                }
            ]
        }
    },
    'post_detail': {
        'description': 'Single blog post detail',
        'status': 200,
        'schema': {
            'id': 'int',
            'slug': 'str',
            'title': 'str',
            'excerpt': 'str',
            'content': 'str (HTML)',
            'featuredImage': 'str (URL)',
            'category': 'str',
            'tags': ['str'],
            'viewCount': 'int',
            'likeCount': 'int',
            'author': 'str',
            'createdAt': 'datetime',
            'updatedAt': 'datetime',
            'relatedPosts': [
                {
                    'id': 'int',
                    'slug': 'str',
                    'title': 'str',
                }
            ]
        }
    },
    'category_list': {
        'description': 'List of blog categories',
        'status': 200,
        'schema': [
            {
                'id': 'int',
                'name': 'str',
                'slug': 'str',
                'postCount': 'int',
            }
        ]
    },
}

# Notes Responses
NOTES_RESPONSE_SCHEMAS = {
    'list': {
        'description': 'List of user notes',
        'status': 200,
        'schema': {
            'count': 'int',
            'next': 'str or null',
            'previous': 'str or null',
            'results': [
                {
                    'id': 'int',
                    'title': 'str',
                    'content': 'str',
                    'tags': ['str'],
                    'isPublic': 'bool',
                    'owner': 'str',
                    'createdAt': 'datetime',
                    'updatedAt': 'datetime',
                }
            ]
        }
    },
    'create': {
        'description': 'Create new note response',
        'status': 201,
        'schema': {
            'id': 'int',
            'title': 'str',
            'content': 'str',
            'tags': ['str'],
            'isPublic': 'bool',
            'owner': 'str',
            'createdAt': 'datetime',
            'updatedAt': 'datetime',
        }
    },
    'update': {
        'description': 'Update note response',
        'status': 200,
        'schema': {
            'id': 'int',
            'title': 'str',
            'content': 'str',
            'tags': ['str'],
            'isPublic': 'bool',
            'owner': 'str',
            'createdAt': 'datetime',
            'updatedAt': 'datetime',
        }
    },
    'delete': {
        'description': 'Delete note response',
        'status': 204,
        'schema': None
    },
}

# Health/Status Responses
HEALTH_RESPONSE_SCHEMAS = {
    'health': {
        'description': 'API health check',
        'status': 200,
        'schema': {
            'status': 'str (healthy|degraded|unhealthy)',
            'database': 'str (healthy|unhealthy)',
            'debug': 'bool',
            'timestamp': 'datetime',
        }
    },
    'version': {
        'description': 'API version information',
        'status': 200,
        'schema': {
            'version': 'str',
            'api': 'str',
            'environment': 'str (development|production)',
        }
    },
}

# Error Responses
ERROR_RESPONSE_SCHEMAS = {
    'bad_request': {
        'description': 'Invalid request data',
        'status': 400,
        'schema': {
            'error': 'str (error message)',
            'errors': {
                'fieldName': 'str (field-specific error)',
            }
        }
    },
    'unauthorized': {
        'description': 'Missing or invalid authentication',
        'status': 401,
        'schema': {
            'error': 'str (authentication required)',
        }
    },
    'forbidden': {
        'description': 'User lacks permission',
        'status': 403,
        'schema': {
            'error': 'str (permission denied)',
        }
    },
    'not_found': {
        'description': 'Resource not found',
        'status': 404,
        'schema': {
            'error': 'str (not found)',
        }
    },
    'conflict': {
        'description': 'Resource conflict',
        'status': 409,
        'schema': {
            'error': 'str (conflict details)',
        }
    },
    'validation_error': {
        'description': 'Data validation failed',
        'status': 422,
        'schema': {
            'error': 'str (validation failed)',
            'errors': {
                'fieldName': 'str (validation error)',
            }
        }
    },
    'rate_limit': {
        'description': 'Too many requests',
        'status': 429,
        'schema': {
            'error': 'str (rate limit exceeded)',
            'retryAfter': 'int (seconds)',
        }
    },
    'server_error': {
        'description': 'Internal server error',
        'status': 500,
        'schema': {
            'error': 'str (error message)',
        }
    },
    'service_unavailable': {
        'description': 'Service temporarily unavailable',
        'status': 503,
        'schema': {
            'error': 'str (service unavailable)',
        }
    },
}

# Combine all schemas
ALL_SCHEMAS = {
    'auth': AUTH_RESPONSE_SCHEMAS,
    'blog': BLOG_RESPONSE_SCHEMAS,
    'notes': NOTES_RESPONSE_SCHEMAS,
    'health': HEALTH_RESPONSE_SCHEMAS,
    'errors': ERROR_RESPONSE_SCHEMAS,
}

# Cache control recommendations
CACHE_RECOMMENDATIONS = {
    '/api/health/': 'public, max-age=60',
    '/api/version/': 'public, max-age=3600',
    '/api/blog/posts/': 'public, max-age=300',
    '/api/blog/posts/<id>/': 'public, max-age=1800',
    '/api/notes/': 'private, max-age=300',
    '/api/contact/': 'no-cache',
    '/feeds/rss/': 'public, max-age=3600',
}
