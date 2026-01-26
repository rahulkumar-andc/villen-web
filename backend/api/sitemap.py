from django.http import HttpResponse
from django.urls import reverse
from django.contrib.sites.models import Site
from django.utils import timezone
from datetime import datetime
import xml.etree.ElementTree as ET


def generate_sitemap(request):
    """Generate XML sitemap for SEO."""
    site = Site.objects.get_current()
    domain = f"https://{site.domain}"
    
    # Static pages
    static_urls = [
        {'loc': domain, 'changefreq': 'weekly', 'priority': '1.0'},
        {'loc': f"{domain}/home", 'changefreq': 'weekly', 'priority': '0.9'},
        {'loc': f"{domain}/about", 'changefreq': 'monthly', 'priority': '0.8'},
        {'loc': f"{domain}/projects", 'changefreq': 'monthly', 'priority': '0.8'},
        {'loc': f"{domain}/notes", 'changefreq': 'weekly', 'priority': '0.7'},
        {'loc': f"{domain}/contact", 'changefreq': 'monthly', 'priority': '0.6'},
        {'loc': f"{domain}/blog", 'changefreq': 'daily', 'priority': '0.9'},
        {'loc': f"{domain}/blog/home", 'changefreq': 'daily', 'priority': '0.9'},
        {'loc': f"{domain}/login", 'changefreq': 'monthly', 'priority': '0.5'},
        {'loc': f"{domain}/register", 'changefreq': 'monthly', 'priority': '0.5'},
    ]
    
    # Blog posts
    try:
        from .models import BlogPost
        blog_posts = BlogPost.objects.filter(is_public=True)
        for post in blog_posts:
            static_urls.append({
                'loc': f"{domain}/blog/post/{post.slug}",
                'lastmod': post.updated_at.strftime('%Y-%m-%d'),
                'changefreq': 'monthly',
                'priority': '0.7'
            })
    except:
        pass
    
    # Projects
    try:
        from .models import Project
        projects = Project.objects.filter(is_public=True)
        for project in projects:
            static_urls.append({
                'loc': f"{domain}/projects#{project.id}",
                'lastmod': project.created_at.strftime('%Y-%m-%d'),
                'changefreq': 'monthly',
                'priority': '0.6'
            })
    except:
        pass
    
    # Generate XML
    urlset = ET.Element('urlset', xmlns='http://www.sitemaps.org/schemas/sitemap/0.9')
    
    for url_info in static_urls:
        url = ET.SubElement(urlset, 'url')
        loc = ET.SubElement(url, 'loc')
        loc.text = url_info['loc']
        
        if 'lastmod' in url_info:
            lastmod = ET.SubElement(url, 'lastmod')
            lastmod.text = url_info['lastmod']
        
        changefreq = ET.SubElement(url, 'changefreq')
        changefreq.text = url_info['changefreq']
        
        priority = ET.SubElement(url, 'priority')
        priority.text = url_info['priority']
    
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += ET.tostring(urlset, encoding='unicode')
    
    return HttpResponse(xml_content, content_type='application/xml')

