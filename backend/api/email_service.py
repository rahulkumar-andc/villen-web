import random
import string
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone


def generate_otp(length=6):
    """Generate a random numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))


def get_otp_expiry(minutes=10):
    """Get OTP expiry time (default 10 minutes)."""
    return timezone.now() + timedelta(minutes=minutes)


def send_otp_email(email, otp):
    """
    Send OTP to user's email.
    Uses Django's send_mail which will use EMAIL_BACKEND from settings.
    """
    subject = "🔐 Shadow Layer - Email Verification OTP"
    message = f"""
Your verification code is: {otp}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

— Shadow Layer Security
"""
    
    html_message = f"""
    <div style="font-family: 'Courier New', monospace; background: #0a0a0a; color: #00ff9d; padding: 30px; border-radius: 10px;">
        <h2 style="color: #fff;">🔐 Shadow Layer</h2>
        <p>Your verification code is:</p>
        <h1 style="font-size: 48px; letter-spacing: 10px; color: #00ff9d;">{otp}</h1>
        <p style="color: #888;">This code will expire in 10 minutes.</p>
        <hr style="border-color: #333;">
        <small style="color: #555;">If you didn't request this, please ignore this email.</small>
    </div>
    """
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Email send error: {e}")
        return False
