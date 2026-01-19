from django.urls import path
from .dashboard_views import (
    SuperAdminDashboardView, 
    AdminDashboardView, 
    MonitorDashboardView, 
    PremiumDashboardView
)

urlpatterns = [
    path('super/', SuperAdminDashboardView.as_view(), name='dashboard-super'),
    path('admin/', AdminDashboardView.as_view(), name='dashboard-admin'),
    path('monitor/', MonitorDashboardView.as_view(), name='dashboard-monitor'),
    path('premium/', PremiumDashboardView.as_view(), name='dashboard-premium'),
]
