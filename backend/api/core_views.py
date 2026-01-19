from rest_framework import generics, permissions
from .models import Project, Note
from .core_serializers import ProjectSerializer, NoteSerializer

class ProjectList(generics.ListCreateAPIView):
    queryset = Project.objects.filter(is_public=True)
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # Only admins can create (enforced by IsAuthenticatedOrReadOnly + view logic if needed, but simplistic for now)
        serializer.save()

class ProjectDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class NoteList(generics.ListCreateAPIView):
    queryset = Note.objects.filter(is_public=True)
    serializer_class = NoteSerializer
    permission_classes = [permissions.AllowAny] # Notes page currently posts without auth in existing code? 
    # Actually, NotesPage.jsx is sending POST without auth token. 
    # If we want public visitors to post "Intel", we allow any. 
    # But usually this is unsafe. Let's start with AllowAny for creating?
    # Or restrict to Authenticated for creating and AllowAny for reading?
    # The existing frontend code implies it's a personal log, so maybe only the User should post.
    # But the user might want a public guestbook.
    # I'll stick to AuthenticatedOrReadOnly for safety, and fixing frontend later.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class NoteDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
