from django.urls import path
from . import blog_views

urlpatterns = [
    path('categories/', blog_views.list_categories, name='blog_categories'),
    path('posts/', blog_views.list_posts, name='blog_posts'),
    path('posts/create/', blog_views.create_post, name='blog_create'),
    path('posts/<slug:slug>/', blog_views.get_post, name='blog_post'),
    path('posts/<slug:slug>/edit/', blog_views.update_delete_post, name='blog_edit'),
]
