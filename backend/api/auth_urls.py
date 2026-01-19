from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import auth_views

urlpatterns = [
    # OTP Registration Flow
    path('send-otp/', auth_views.send_otp, name='send_otp'),
    path('verify-otp/', auth_views.verify_otp, name='verify_otp'),
    path('register/', auth_views.register, name='register'),
    
    # Login
    path('login/', auth_views.login, name='login'),
    
    # JWT Refresh
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Forgot Password Flow
    path('forgot-password/', auth_views.forgot_password, name='forgot_password'),
    path('verify-reset-otp/', auth_views.verify_reset_otp, name='verify_reset_otp'),
    path('reset-password/', auth_views.reset_password, name='reset_password'),
    
    # Logout
    path('logout/', auth_views.logout, name='logout'),
]


