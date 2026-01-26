# backend/api/management/commands/generate_api_key.py
"""
Management command to generate API keys for users.
"""

import secrets
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from api.models import APIKey


class Command(BaseCommand):
    help = 'Generate an API key for a user'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to generate API key for')
        parser.add_argument('--name', type=str, help='Name for the API key', default='Default API Key')
        parser.add_argument('--scopes', nargs='+', help='Scopes for the API key', default=['read'])
        parser.add_argument('--rate-limit', type=int, help='Rate limit (requests per hour)', default=1000)

    def handle(self, *args, **options):
        username = options['username']
        name = options['name']
        scopes = options['scopes']
        rate_limit = options['rate_limit']

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f'User "{username}" does not exist')

        # Generate a secure random API key
        api_key_value = secrets.token_hex(32)  # 64 character hex string

        # Create the API key
        api_key = APIKey.objects.create(
            name=name,
            key=api_key_value,
            user=user,
            scopes=scopes,
            rate_limit=rate_limit
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created API key for {username}:\n'
                f'Name: {name}\n'
                f'Key: {api_key_value}\n'
                f'Scopes: {", ".join(scopes)}\n'
                f'Rate Limit: {rate_limit} requests/hour\n\n'
                f'Use this key in the X-API-Key header for API requests.'
            )
        )