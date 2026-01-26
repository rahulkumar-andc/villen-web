"""
Django management command to create a superuser
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile, Role


class Command(BaseCommand):
    help = 'Create a superuser with all necessary setup'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, required=True, help='Username for the superuser')
        parser.add_argument('--email', type=str, required=True, help='Email for the superuser')
        parser.add_argument('--password', type=str, required=True, help='Password for the superuser')

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'User {username} already exists'))
            return

        # Create user
        user = User.objects.create_superuser(username, email, password)
        
        # Get or create SuperAdmin role
        super_admin_role, _ = Role.objects.get_or_create(
            level=Role.SUPER_ADMIN,
            defaults={
                'name': 'Super Admin',
                'role_type': 'SYSTEM',
                'description': 'System administrator with full access'
            }
        )

        # Create user profile
        profile = UserProfile.objects.create(
            user=user,
            role=super_admin_role,
            is_verified=True
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created superuser {username} with role {super_admin_role.name}'
            )
        )
