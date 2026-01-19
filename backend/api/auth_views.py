from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

from .models import EmailOTP
from .email_service import generate_otp, get_otp_expiry, send_otp_email
from .auth_serializers import (
    SendOTPSerializer,
    VerifyOTPSerializer,
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ForgotPasswordSerializer,
    VerifyResetOTPSerializer,
    ResetPasswordSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    """
    Step 1: Send OTP to email.
    No user is created here.
    """
    serializer = SendOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    
    # Delete any existing OTP for this email
    EmailOTP.objects.filter(email=email).delete()

    # Generate and save new OTP
    otp = generate_otp()
    EmailOTP.objects.create(
        email=email,
        otp=otp,
        expiry_time=get_otp_expiry()
    )

    # Send OTP email
    email_sent = send_otp_email(email, otp)
    
    if email_sent:
        return Response({
            'message': 'OTP sent successfully. Check your email.',
            'email': email
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'Failed to send OTP. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    Step 2: Verify OTP.
    Still no user created.
    """
    serializer = VerifyOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    otp = serializer.validated_data['otp']

    # Find OTP record by email first (to track attempts even for wrong OTP)
    otp_record = EmailOTP.objects.filter(email=email, purpose='registration').first()

    if not otp_record:
        return Response({
            'error': 'No OTP request found for this email.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if locked due to too many attempts
    if otp_record.is_locked():
        otp_record.delete()
        return Response({
            'error': 'Too many failed attempts. Please request a new OTP.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)

    if otp_record.is_expired():
        otp_record.delete()
        return Response({
            'error': 'OTP expired. Please request a new one.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check OTP match
    if otp_record.otp != otp:
        otp_record.increment_attempts()
        remaining = EmailOTP.MAX_ATTEMPTS - otp_record.attempts
        return Response({
            'error': f'Invalid OTP. {remaining} attempts remaining.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Mark as verified
    otp_record.is_verified = True
    otp_record.save()

    return Response({
        'message': 'OTP verified successfully.',
        'verified': True,
        'email': email
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Step 3: Complete registration.
    User is created here after OTP verification.
    """
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)

    return Response({
        'message': 'Registration successful.',
        'user': UserSerializer(user).data,
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Login with email + password.
    Returns JWT tokens.
    """
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    password = serializer.validated_data['password']

    # Find user by email
    try:
        user_obj = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({
            'error': 'Invalid credentials.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    # Check if account is locked
    profile = getattr(user_obj, 'profile', None)
    if profile and profile.is_locked_out():
        from django.utils import timezone
        remaining = (profile.lockout_until - timezone.now()).seconds // 60
        return Response({
            'error': f'Account temporarily locked. Try again in {remaining} minutes.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)

    # Authenticate
    user = authenticate(username=user_obj.username, password=password)
    if not user:
        # Record failed attempt
        if profile:
            profile.record_failed_login()
            remaining = profile.MAX_LOGIN_ATTEMPTS - profile.failed_login_attempts
            if remaining > 0:
                return Response({
                    'error': f'Invalid credentials. {remaining} attempts remaining.'
                }, status=status.HTTP_401_UNAUTHORIZED)
            else:
                return Response({
                    'error': f'Account locked for {profile.LOCKOUT_DURATION_MINUTES} minutes.'
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        return Response({
            'error': 'Invalid credentials.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    # Successful login - reset failed attempts
    if profile:
        profile.reset_login_attempts()

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)

    return Response({
        'message': 'Login successful.',
        'user': UserSerializer(user).data,
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
    }, status=status.HTTP_200_OK)


# =============================================================================
# Forgot Password Flow
# =============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """
    Step 1: Request password reset OTP.
    Always returns generic response to prevent email enumeration.
    """
    serializer = ForgotPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    
    # Check if user exists (but don't reveal this in response)
    user_exists = User.objects.filter(email=email).exists()
    
    if user_exists:
        # Delete any existing password reset OTP for this email
        EmailOTP.objects.filter(email=email, purpose='password_reset').delete()

        # Generate and save new OTP
        otp = generate_otp()
        EmailOTP.objects.create(
            email=email,
            otp=otp,
            purpose='password_reset',
            expiry_time=get_otp_expiry()
        )

        # Send OTP email
        send_otp_email(email, otp)

    # Always return same response (security: prevent email enumeration)
    return Response({
        'message': 'If this email is registered, an OTP has been sent.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_otp(request):
    """
    Step 2: Verify password reset OTP.
    """
    serializer = VerifyResetOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    otp = serializer.validated_data['otp']

    # Find OTP record for password reset by email first
    otp_record = EmailOTP.objects.filter(
        email=email,
        purpose='password_reset'
    ).first()

    if not otp_record:
        return Response({
            'error': 'No password reset request found for this email.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if locked due to too many attempts
    if otp_record.is_locked():
        otp_record.delete()
        return Response({
            'error': 'Too many failed attempts. Please request a new OTP.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)

    if otp_record.is_expired():
        otp_record.delete()
        return Response({
            'error': 'OTP expired. Please request a new one.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check OTP match
    if otp_record.otp != otp:
        otp_record.increment_attempts()
        remaining = EmailOTP.MAX_ATTEMPTS - otp_record.attempts
        return Response({
            'error': f'Invalid OTP. {remaining} attempts remaining.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Mark as verified
    otp_record.is_verified = True
    otp_record.save()

    return Response({
        'message': 'OTP verified. You can now reset your password.',
        'verified': True,
        'email': email
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Step 3: Reset password after OTP verification.
    Invalidates all existing tokens for security.
    """
    serializer = ResetPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    new_password = serializer.validated_data['new_password']

    # Get user and update password
    try:
        user = User.objects.get(email=email)
        user.password = make_password(new_password)
        user.save()

        # Invalidate all existing tokens for this user
        try:
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
            tokens = OutstandingToken.objects.filter(user=user)
            for token in tokens:
                BlacklistedToken.objects.get_or_create(token=token)
        except Exception:
            pass  # Token blacklist may not have tokens yet

        # Delete OTP records for this email
        EmailOTP.objects.filter(email=email, purpose='password_reset').delete()

        return Response({
            'message': 'Password reset successful. All sessions have been logged out.'
        }, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)


# =============================================================================
# Logout (Token Blacklisting)
# =============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    """
    Logout by blacklisting the refresh token.
    """
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({
                'error': 'Refresh token required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response({
            'message': 'Logout successful.'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'error': 'Invalid token.'
        }, status=status.HTTP_400_BAD_REQUEST)


