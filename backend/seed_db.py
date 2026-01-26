
import os
from dotenv import load_dotenv
import django

load_dotenv()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web.settings')
django.setup()

from api.models import Project, Note, BlogCategory, BlogPost
from django.contrib.auth.models import User
from api.models import UserProfile, Role

def seed():
    print("🌱 Seeding database...")

    # 1. Projects
    projects_data = [
        {
            "title": "Villen Music Player",
            "category": "DESKTOP APP",
            "status": "Active",
            "tagline": "High-performance, cross-platform audio engineering.",
            "link": None,
        },
        {
            "title": "Django Web Platforms",
            "category": "WEB DEV",
            "status": "Active",
            "tagline": "Scalable backend architecture for modern web apps.",
            "link": "https://github.com/rahulkumar-andc/web",
        },
        {
            "title": "DDoS Simulation Tool",
            "category": "NETWORK SEC",
            "status": "Research",
            "tagline": "Analyzing network stress patterns and traffic behavior.",
            "link": "https://github.com/rahulkumar-andc/ddos",
        },
        {
            "title": "VillenOSINT",
            "category": "OSINT TOOLS",
            "status": "Coming Soon",
            "tagline": "Automated intelligence gathering for the ethical researcher.",
            "link": None,
        },
        {
            "title": "Web Security Research",
            "category": "INFOSEC",
            "status": "Research",
            "tagline": "Documenting the art of offensive reconnaissance.",
            "link": None,
        },
        {
            "title": "College Portal",
            "category": "WEB APP",
            "status": "Active",
            "tagline": "Streamlining administrative workflows with robust automation.",
            "link": "https://github.com/villenbhai/college_portal",
        },
    ]

    for p in projects_data:
        Project.objects.get_or_create(title=p['title'], defaults=p)
    print(f"✅ Created {len(projects_data)} projects")

    # 2. Notes
    notes_data = [
        {"title": "System Initialization", "body": "Core systems coming online. Secure handshake protocols verified."},
        {"title": "Anomaly Detected", "body": "Unusual traffic pattern on port 443. investigating origin... nothing malicious found, just noise."},
        {"title": "Deployment Log", "body": "Vercel deployment successful. Backend responding with < 50ms latency."},
    ]
    for n in notes_data:
        Note.objects.get_or_create(title=n['title'], defaults=n)
    print(f"✅ Created {len(notes_data)} notes")

    # 3. Blog Categories
    categories = [
        {"name": "Security", "slug": "security", "color": "#ef4444"},
        {"name": "Dev", "slug": "dev", "color": "#00d4ff"},
        {"name": "Life", "slug": "life", "color": "#10b981"},
        {"name": "Notes", "slug": "notes", "color": "#f59e0b"},
    ]
    for c in categories:
        BlogCategory.objects.get_or_create(slug=c['slug'], defaults=c)
    print(f"✅ Created {len(categories)} blog categories")

    # 4. Roles & Users
    roles_data = [
        {'name': 'Super Admin', 'level': 1, 'type': 'SYSTEM'},
        {'name': 'Admin', 'level': 2, 'type': 'SYSTEM'},
        {'name': 'Monitor', 'level': 3, 'type': 'SYSTEM'},
        {'name': 'Premium User', 'level': 5, 'type': 'USER'},
        {'name': 'Normal User', 'level': 6, 'type': 'USER'},
    ]
    
    for r in roles_data:
        Role.objects.get_or_create(name=r['name'], defaults={
            'level': r['level'], 
            'role_type': r['type']
        })
    print("✅ Created Roles")

    # Define Users
    users = [
        {'user': 'villenadmin', 'email': 'villensec@gmail.com', 'pass': 'Vilen@123Queen@9693', 'role': 'Super Admin'},
        {'user': 'villenmanager', 'email': 'villensec@gmail.com', 'pass': 'Vilen@123Queen@9693', 'role': 'Admin'},
        {'user': 'villenmod', 'email': 'villensec@gmail.com', 'pass': 'Vilen@123Queen@9693', 'role': 'Monitor'},
        {'user': 'villensubscriber', 'email': 'villensec@gmail.com', 'pass': 'Vilen@123Queen@9693', 'role': 'Premium User'},
    ]

    for u_data in users:
        curr_user = None
        if not User.objects.filter(username=u_data['user']).exists():
            if u_data['role'] == 'Super Admin':
                curr_user = User.objects.create_superuser(u_data['user'], u_data['email'], u_data['pass'])
                print(f"✅ Created Superuser: {u_data['user']}")
            else:
                curr_user = User.objects.create_user(u_data['user'], u_data['email'], u_data['pass'])
                print(f"✅ Created user: {u_data['user']}")
        else:
            curr_user = User.objects.get(username=u_data['user'])
            # Ensure admin is superuser
            if u_data['role'] == 'Super Admin' and (not curr_user.is_superuser or not curr_user.is_staff):
                curr_user.is_superuser = True
                curr_user.is_staff = True
                curr_user.save()
                print(f"✅ Promoted {u_data['user']} to Superuser")

        # Assign Role Profile if missing
        if hasattr(curr_user, 'profile') is False:
             role = Role.objects.get(name=u_data['role'])
             UserProfile.objects.create(user=curr_user, role=role, is_verified=True)
             print(f"✅ Linked profile for {u_data['user']}")


if __name__ == '__main__':
    seed()
