from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .models import EmailOTP, UserProfile, Role


class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        # Check if user with this email already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(min_length=8, write_only=True)
    full_name = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_email(self, value):
        # Check if OTP was verified for this email
        otp_record = EmailOTP.objects.filter(email=value, is_verified=True).first()
        if not otp_record:
            raise serializers.ValidationError("Email not verified. Please verify OTP first.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def create(self, validated_data):
        # Get or create default "Normal User" role
        normal_role = Role.objects.filter(level=Role.NORMAL).first()

        # Create user
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            password=make_password(validated_data['password']),
            first_name=validated_data.get('full_name', '').split()[0] if validated_data.get('full_name') else '',
            last_name=' '.join(validated_data.get('full_name', '').split()[1:]) if validated_data.get('full_name') else '',
        )

        # Create UserProfile with default role
        UserProfile.objects.create(
            user=user,
            role=normal_role,
            is_verified=True
        )

        # Delete OTP record after successful registration
        EmailOTP.objects.filter(email=validated_data['email']).delete()

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']

    def get_role(self, obj):
        profile = getattr(obj, 'profile', None)
        if profile and profile.role:
            return {
                'name': profile.role.name,
                'level': profile.role.level
            }
        return None


# =============================================================================
# Forgot Password Serializers
# =============================================================================

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    # No validation - we always return generic response


class VerifyResetOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        
        # Check if OTP is verified for password reset
        otp_record = EmailOTP.objects.filter(
            email=data['email'],
            otp=data['otp'],
            purpose='password_reset',
            is_verified=True
        ).first()
        
        if not otp_record:
            raise serializers.ValidationError({"otp": "Invalid or unverified OTP."})
        
        return data

