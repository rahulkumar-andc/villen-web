"""
Migration for adding blog reaction models
Generated: 2026-01-25
"""

from django.db import migrations, models
import django.db.models.constraints


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_note_user'),
    ]

    operations = [
        # Create PostReaction model
        migrations.CreateModel(
            name='PostReaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('guest_id', models.CharField(blank=True, help_text='Anonymous user ID for guests', max_length=64, null=True)),
                ('reaction', models.CharField(choices=[('like', '👍 Like'), ('insightful', '💡 Insightful'), ('helpful', '📚 Helpful'), ('interesting', '🎯 Interesting'), ('confusing', '❓ Confusing')], max_length=20)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reactions', to='api.blogpost')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='blog_reactions', to='auth.user')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        
        # Add indexes for PostReaction
        migrations.AddIndex(
            model_name='postreaction',
            index=models.Index(fields=['post', 'reaction'], name='api_postreac_post_id_6d9c9f_idx'),
        ),
        migrations.AddIndex(
            model_name='postreaction',
            index=models.Index(fields=['user', 'post'], name='api_postreac_user_id_2d7b0f_idx'),
        ),
        
        # Add unique constraints for PostReaction
        migrations.AddConstraint(
            model_name='postreaction',
            constraint=django.db.models.constraints.UniqueConstraint(fields=['post', 'user', 'reaction'], name='unique_user_reaction_per_post'),
        ),
        migrations.AddConstraint(
            model_name='postreaction',
            constraint=django.db.models.constraints.UniqueConstraint(fields=['post', 'guest_id', 'reaction'], name='unique_guest_reaction_per_post'),
        ),
        
        # Create ReactionSummary model
        migrations.CreateModel(
            name='ReactionSummary',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('like_count', models.PositiveIntegerField(default=0)),
                ('insightful_count', models.PositiveIntegerField(default=0)),
                ('helpful_count', models.PositiveIntegerField(default=0)),
                ('interesting_count', models.PositiveIntegerField(default=0)),
                ('confusing_count', models.PositiveIntegerField(default=0)),
                ('total_reactions', models.PositiveIntegerField(default=0)),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('post', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='reaction_summary', to='api.blogpost')),
            ],
            options={
                'ordering': ['-total_reactions'],
            },
        ),
    ]

