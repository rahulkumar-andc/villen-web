from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Note
from .serializers import NoteSerializer

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
