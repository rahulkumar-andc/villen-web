"""
Migration for adding word_count to BlogPost
Generated: 2026-01-25
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_postreaction_reactionsummary'),
    ]

    operations = [
        migrations.AddField(
            model_name='blogpost',
            name='word_count',
            field=models.PositiveIntegerField(default=0, help_text='Total word count'),
        ),
    ]

