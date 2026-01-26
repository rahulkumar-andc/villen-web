# backend/api/utils/security_monitoring.py
"""
Security monitoring utilities for detecting and alerting on security events.
"""

import logging
import json
from datetime import datetime, timedelta
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger('django.security')


class SecurityMonitor:
    """
    Monitor for security events and anomalies.
    """

    # Security event types
    FAILED_LOGIN = 'failed_login'
    SUSPICIOUS_IP = 'suspicious_ip'
    API_KEY_ABUSE = 'api_key_abuse'
    RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded'
    UNUSUAL_TRAFFIC = 'unusual_traffic'
    CSRF_ATTEMPT = 'csrf_attempt'
    SQL_INJECTION_ATTEMPT = 'sql_injection_attempt'
    XSS_ATTEMPT = 'xss_attempt'

    def __init__(self):
        self.cache_timeout = 3600  # 1 hour

    def log_security_event(self, event_type, details, severity='medium'):
        """
        Log a security event with structured data.
        """
        event_data = {
            'timestamp': timezone.now().isoformat(),
            'event_type': event_type,
            'severity': severity,
            'details': details,
            'correlation_id': getattr(details, 'correlation_id', 'unknown'),
        }

        # Log to security logger
        logger.warning(
            f"Security event: {event_type}",
            extra=event_data
        )

        # Store in cache for analysis
        self._store_event(event_data)

        # Check for alerts
        self._check_alerts(event_type, details)

    def _store_event(self, event_data):
        """Store security event in cache for analysis."""
        cache_key = f"security_events:{timezone.now().date()}"
        events = cache.get(cache_key, [])
        events.append(event_data)

        # Keep only last 1000 events per day
        if len(events) > 1000:
            events = events[-1000:]

        cache.set(cache_key, events, self.cache_timeout)

    def _check_alerts(self, event_type, details):
        """Check if event should trigger an alert."""
        alert_rules = {
            self.FAILED_LOGIN: self._check_failed_login_alert,
            self.SUSPICIOUS_IP: self._check_suspicious_ip_alert,
            self.API_KEY_ABUSE: self._check_api_key_abuse_alert,
            self.RATE_LIMIT_EXCEEDED: self._check_rate_limit_alert,
        }

        check_func = alert_rules.get(event_type)
        if check_func:
            check_func(details)

    def _check_failed_login_alert(self, details):
        """Check for brute force login attempts."""
        ip = details.get('ip')
        username = details.get('username')

        if not ip or not username:
            return

        # Count failed attempts in last hour
        cache_key = f"failed_logins:{ip}:{username}"
        attempts = cache.get(cache_key, 0) + 1
        cache.set(cache_key, attempts, 3600)  # 1 hour

        if attempts >= 5:
            self.log_security_event(
                'brute_force_attempt',
                {
                    'ip': ip,
                    'username': username,
                    'attempts': attempts,
                    'action': 'account_locked'
                },
                severity='high'
            )

    def _check_suspicious_ip_alert(self, details):
        """Check for suspicious IP behavior."""
        ip = details.get('ip')
        if not ip:
            return

        # Count suspicious activities from this IP
        cache_key = f"suspicious_ip:{ip}"
        activities = cache.get(cache_key, 0) + 1
        cache.set(cache_key, activities, 3600)

        if activities >= 10:
            self.log_security_event(
                'suspicious_ip_blocked',
                {
                    'ip': ip,
                    'activities': activities,
                    'action': 'ip_blocked'
                },
                severity='high'
            )

    def _check_api_key_abuse_alert(self, details):
        """Check for API key abuse."""
        api_key_id = details.get('api_key_id')
        if not api_key_id:
            return

        # Count API key violations
        cache_key = f"api_key_abuse:{api_key_id}"
        violations = cache.get(cache_key, 0) + 1
        cache.set(cache_key, violations, 3600)

        if violations >= 50:
            self.log_security_event(
                'api_key_suspended',
                {
                    'api_key_id': api_key_id,
                    'violations': violations,
                    'action': 'api_key_suspended'
                },
                severity='high'
            )

    def _check_rate_limit_alert(self, details):
        """Check for excessive rate limit violations."""
        ip = details.get('ip')
        if not ip:
            return

        # Count rate limit violations
        cache_key = f"rate_limit_violations:{ip}"
        violations = cache.get(cache_key, 0) + 1
        cache.set(cache_key, violations, 3600)

        if violations >= 20:
            self.log_security_event(
                'rate_limit_block',
                {
                    'ip': ip,
                    'violations': violations,
                    'action': 'ip_blocked'
                },
                severity='medium'
            )

    def get_security_report(self, days=7):
        """Generate a security report for the specified number of days."""
        report = {
            'period': f"{days} days",
            'generated_at': timezone.now().isoformat(),
            'events': {},
            'alerts': [],
            'recommendations': []
        }

        # Collect events from cache
        for i in range(days):
            date = (timezone.now() - timedelta(days=i)).date()
            cache_key = f"security_events:{date}"
            events = cache.get(cache_key, [])

            for event in events:
                event_type = event.get('event_type', 'unknown')
                if event_type not in report['events']:
                    report['events'][event_type] = 0
                report['events'][event_type] += 1

        # Generate recommendations based on events
        report['recommendations'] = self._generate_recommendations(report['events'])

        return report

    def _generate_recommendations(self, events):
        """Generate security recommendations based on event patterns."""
        recommendations = []

        if events.get(self.FAILED_LOGIN, 0) > 50:
            recommendations.append({
                'priority': 'high',
                'issue': 'High number of failed login attempts',
                'recommendation': 'Implement stricter password policies and account lockout'
            })

        if events.get(self.RATE_LIMIT_EXCEEDED, 0) > 100:
            recommendations.append({
                'priority': 'medium',
                'issue': 'Frequent rate limit violations',
                'recommendation': 'Review rate limiting policies and consider increasing limits'
            })

        if events.get(self.SUSPICIOUS_IP, 0) > 20:
            recommendations.append({
                'priority': 'high',
                'issue': 'Multiple suspicious IP addresses detected',
                'recommendation': 'Implement IP whitelisting or enhanced monitoring'
            })

        if events.get(self.API_KEY_ABUSE, 0) > 10:
            recommendations.append({
                'priority': 'medium',
                'issue': 'API key abuse detected',
                'recommendation': 'Review API key scopes and implement stricter validation'
            })

        return recommendations


# Global security monitor instance
security_monitor = SecurityMonitor()