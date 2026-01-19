from rest_framework import serializers
from .models import Project, Note

class ProjectSerializer(serializers.ModelSerializer):
    status_color = serializers.ReadOnlyField()

    class Meta:
        model = Project
        fields = ['id', 'title', 'category', 'status', 'status_color', 'tagline', 'link', 'is_public', 'created_at']

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'title', 'body', 'is_public', 'created_at']
