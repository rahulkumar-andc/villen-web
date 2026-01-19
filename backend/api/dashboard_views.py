from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import Role, UserProfile, AuditLog, ContactMessage
from .core_serializers import ContactSerializer
from .permissions import IsSuperAdmin, IsAdmin, IsMonitor, IsPremium

class SuperAdminDashboardView(APIView):
    """
    Level 1: System Overview & Admin Management.
    """
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        total_users = User.objects.count()
        admins = UserProfile.objects.filter(role__level__lte=2).count()
        recent_audit_logs = AuditLog.objects.all()[:10]
        
        # Admin list for management table
        admin_users = User.objects.filter(profile__role__level=2).values('id', 'username', 'email', 'profile__role__name')

        return Response({
            'stats': {
                'total_users': total_users,
                'total_admins': admins,
                'system_status': 'Healthy'
            },
            'recent_logs': [
                {'actor': log.actor.username if log.actor else 'System', 
                 'action': log.action, 
                 'time': log.created_at} for log in recent_audit_logs
            ],
            'admins': list(admin_users)
        })

class AdminDashboardView(APIView):
    """
    Level 2: Operations & User Management.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        total_users = User.objects.count()
        new_users = User.objects.order_by('-date_joined')[:5]
        premium_count = UserProfile.objects.filter(role__name='Premium User').count()
        
        return Response({
            'stats': {
                'total_users': total_users,
                'premium_users': premium_count,
            },
            'new_users': [
                {'username': u.username, 'email': u.email, 'joined': u.date_joined} 
                for u in new_users
            ]
        })

class MonitorDashboardView(APIView):
    """
    Level 3: Moderation.
    """
    permission_classes = [IsMonitor]

    def get(self, request):
        # Fetch unread contact messages as "Reports" for now
        reports = ContactMessage.objects.filter(is_read=False)[:20]
        serializer = ContactSerializer(reports, many=True)
        return Response({
            'pending_reports': serializer.data,
            'moderation_queue_count': reports.count()
        })

class PremiumDashboardView(APIView):
    """
    Level 5: Premium Features.
    """
    permission_classes = [IsPremium]

    def get(self, request):
        return Response({
            'message': "Welcome to the V.I.P. Lounge.",
            'exclusive_content': ['Zero-Day Exploit Database', 'Dark Web Scanner']
        })
