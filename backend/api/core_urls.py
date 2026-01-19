from django.urls import path
from .core_views import ProjectList, ProjectDetail, NoteList, NoteDetail, ContactCreate

urlpatterns = [
    path('projects/', ProjectList.as_view(), name='project-list'),
    path('projects/<int:pk>/', ProjectDetail.as_view(), name='project-detail'),
    path('notes/', NoteList.as_view(), name='note-list'),
    path('notes/<int:pk>/', NoteDetail.as_view(), name='note-detail'),
    path('contact/', ContactCreate.as_view(), name='contact-create'),
]
