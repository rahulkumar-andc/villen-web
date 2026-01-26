from django.test import TestCase
from django.contrib.auth.models import User
from api.models import AuditLog, Role, UserProfile
from rest_framework.test import APIClient

class AuditLogSignalTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='auditor', password='password123')
        # Create a basic role for testing
        self.role = Role.objects.create(name='Tester', level=10)

    def test_login_audit_log(self):
        """Test that logging in creates an audit log entry."""
        initial_count = AuditLog.objects.count()
        
        # Perform login
        login_success = self.client.login(username='auditor', password='password123')
        self.assertTrue(login_success)
        
        # Check AuditLog
        self.assertEqual(AuditLog.objects.count(), initial_count + 1)
        latest_log = AuditLog.objects.first() # ordered by -created_at
        self.assertEqual(latest_log.action, 'LOGIN')
        self.assertEqual(latest_log.actor, self.user)

    def test_failed_login_audit_log(self):
        """Test that failed login creates an audit log entry."""
        initial_count = AuditLog.objects.count()
        
        # Perform failed login
        self.client.login(username='auditor', password='wrongpassword')
        
        # Check AuditLog
        self.assertEqual(AuditLog.objects.count(), initial_count + 1)
        latest_log = AuditLog.objects.first()
        self.assertEqual(latest_log.action, 'LOGIN_FAILED')
        self.assertEqual(latest_log.target_user, self.user)

    def test_role_change_audit_log(self):
        """Test that updating a role creates a system log."""
        initial_count = AuditLog.objects.filter(action='SYSTEM_CONFIG').count()
        
        # Modify role
        self.role.level = 99
        self.role.save()
        
        # Check Log
        new_count = AuditLog.objects.filter(action='SYSTEM_CONFIG').count()
        self.assertEqual(new_count, initial_count + 1)
        
        log = AuditLog.objects.filter(action='SYSTEM_CONFIG').first()
        self.assertIn("Role 'Tester' role_updated", log.details)
