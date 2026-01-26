from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from api.models import Note

class NoteSecurityStats(APITestCase):
    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(username='user1', password='password123')
        self.user2 = User.objects.create_user(username='user2', password='password123')
        
        # Create notes
        self.note1 = Note.objects.create(user=self.user1, title='User1 Secret', body='Hidden')
        self.note2 = Note.objects.create(user=self.user2, title='User2 Secret', body='Hidden')
        
        self.url_list = reverse('note-list')
        self.url_detail1 = reverse('note-detail', kwargs={'pk': self.note1.pk})
        self.url_detail2 = reverse('note-detail', kwargs={'pk': self.note2.pk})

    def test_anonymous_access_denied(self):
        """Ensure unauthenticated users cannot access notes."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        response = self.client.get(self.url_detail1)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        response = self.client.post(self.url_list, {'title': 'Hack', 'body': 'test'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_can_only_see_own_notes(self):
        """Ensure User1 can ONLY see User1's notes."""
        self.client.force_authenticate(user=self.user1)
        
        # List view
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check for pagination
        if 'results' in response.data:
             data = response.data['results']
        else:
             data = response.data
             
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['title'], 'User1 Secret')
        
        # Detail view - Own note
        response = self.client.get(self.url_detail1)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Detail view - Other's note (Should be 404 Not Found since it's filtered out of query set, or 403)
        # DRF generic views usually return 404 if object not in get_queryset()
        response = self.client.get(self.url_detail2)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_note_auto_assigns_owner(self):
        """Ensure creating a note automatically assigns current user as owner."""
        self.client.force_authenticate(user=self.user1)
        
        data = {'title': 'New Note', 'body': 'My content'}
        response = self.client.post(self.url_list, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Note.objects.count(), 3)
        
        new_note = Note.objects.get(title='New Note')
        self.assertEqual(new_note.user, self.user1)
