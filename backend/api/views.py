from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Note
from .serializers import NoteSerializer

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all().order_by('-created_at')
    serializer_class = NoteSerializer

@api_view(['POST'])
def contact_api(request):
    # In a real app, you'd send an email or save to DB here
    return Response({"status": "success", "message": "Transmission received."})
