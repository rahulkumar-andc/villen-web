# backend/api/utils/container_security.py
"""
Container runtime security utilities for the Villen Web platform.
Provides security monitoring and hardening for containerized deployments.
"""

import os
import logging
import subprocess
import json
from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger('django.security')


class ContainerSecurity:
    """
    Container security monitoring and hardening utilities.
    """

    def __init__(self):
        self.container_id = self._get_container_id()
        self.security_events = []

    def _get_container_id(self):
        """Get current container ID from cgroup or environment."""
        try:
            # Try to get from cgroup
            with open('/proc/1/cgroup', 'r') as f:
                for line in f:
                    if 'docker' in line or 'containerd' in line:
                        return line.split('/')[-1].strip()
        except:
            pass

        # Fallback to environment variable
        return os.environ.get('CONTAINER_ID', 'unknown')

    def perform_security_check(self):
        """
        Perform comprehensive container security checks.
        Returns dict with security status and recommendations.
        """
        checks = {
            'container_id': self.container_id,
            'timestamp': timezone.now().isoformat(),
            'checks': {},
            'recommendations': []
        }

        # Run individual security checks
        checks['checks']['running_as_root'] = self._check_running_as_root()
        checks['checks']['capabilities'] = self._check_capabilities()
        checks['checks']['file_permissions'] = self._check_file_permissions()
        checks['checks']['network_security'] = self._check_network_security()
        checks['checks']['memory_limits'] = self._check_memory_limits()
        checks['checks']['security_modules'] = self._check_security_modules()

        # Generate recommendations
        checks['recommendations'] = self._generate_recommendations(checks['checks'])

        # Log security status
        self._log_security_status(checks)

        return checks

    def _check_running_as_root(self):
        """Check if container is running as root user."""
        current_uid = os.getuid()
        is_root = current_uid == 0

        return {
            'status': 'FAIL' if is_root else 'PASS',
            'current_uid': current_uid,
            'is_root': is_root,
            'severity': 'HIGH' if is_root else 'LOW'
        }

    def _check_capabilities(self):
        """Check Linux capabilities of the container."""
        try:
            result = subprocess.run(
                ['capsh', '--print'],
                capture_output=True,
                text=True,
                timeout=5
            )

            capabilities = []
            for line in result.stdout.split('\n'):
                if 'Bounding set' in line:
                    caps = line.split('=')[1].strip() if '=' in line else ''
                    capabilities = [cap.strip() for cap in caps.split(',') if cap.strip()]

            dangerous_caps = ['CAP_SYS_ADMIN', 'CAP_NET_RAW', 'CAP_SYS_PTRACE']
            found_dangerous = [cap for cap in dangerous_caps if cap in capabilities]

            return {
                'status': 'FAIL' if found_dangerous else 'PASS',
                'capabilities': capabilities,
                'dangerous_caps': found_dangerous,
                'severity': 'HIGH' if found_dangerous else 'LOW'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'error': str(e),
                'severity': 'MEDIUM'
            }

    def _check_file_permissions(self):
        """Check file permissions in sensitive directories."""
        sensitive_paths = ['/etc/passwd', '/etc/shadow', '/app/settings.py']
        issues = []

        for path in sensitive_paths:
            if os.path.exists(path):
                stat_info = os.stat(path)
                mode = oct(stat_info.st_mode)[-3:]

                # Check if world-readable
                if int(mode, 8) & 0o007:
                    issues.append({
                        'path': path,
                        'permissions': mode,
                        'issue': 'World-readable file'
                    })

        return {
            'status': 'FAIL' if issues else 'PASS',
            'issues': issues,
            'severity': 'MEDIUM' if issues else 'LOW'
        }

    def _check_network_security(self):
        """Check network security configuration."""
        try:
            # Check listening ports
            result = subprocess.run(
                ['netstat', '-tln'],
                capture_output=True,
                text=True,
                timeout=5
            )

            listening_ports = []
            for line in result.stdout.split('\n')[2:]:  # Skip headers
                if line.strip():
                    parts = line.split()
                    if len(parts) >= 4:
                        local_addr = parts[3]
                        if ':' in local_addr:
                            port = local_addr.split(':')[-1]
                            listening_ports.append(port)

            # Check for sensitive ports
            sensitive_ports = ['22', '23', '3389']  # SSH, Telnet, RDP
            exposed_sensitive = [port for port in sensitive_ports if port in listening_ports]

            return {
                'status': 'FAIL' if exposed_sensitive else 'PASS',
                'listening_ports': listening_ports,
                'exposed_sensitive': exposed_sensitive,
                'severity': 'HIGH' if exposed_sensitive else 'LOW'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'error': str(e),
                'severity': 'MEDIUM'
            }

    def _check_memory_limits(self):
        """Check memory limits and usage."""
        try:
            # Check cgroup memory limits
            with open('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'r') as f:
                limit_bytes = int(f.read().strip())

            with open('/sys/fs/cgroup/memory/memory.usage_in_bytes', 'r') as f:
                usage_bytes = int(f.read().strip())

            limit_mb = limit_bytes / (1024 * 1024)
            usage_mb = usage_bytes / (1024 * 1024)
            usage_percent = (usage_bytes / limit_bytes) * 100 if limit_bytes > 0 else 0

            # Check if memory usage is too high
            high_usage = usage_percent > 90

            return {
                'status': 'WARN' if high_usage else 'PASS',
                'limit_mb': round(limit_mb, 2),
                'usage_mb': round(usage_mb, 2),
                'usage_percent': round(usage_percent, 2),
                'high_usage': high_usage,
                'severity': 'MEDIUM' if high_usage else 'LOW'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'error': str(e),
                'severity': 'LOW'
            }

    def _check_security_modules(self):
        """Check if security modules are loaded."""
        security_modules = ['apparmor', 'selinux', 'seccomp']
        loaded_modules = {}

        for module in security_modules:
            try:
                # Check if module is loaded
                result = subprocess.run(
                    ['lsmod'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                loaded = module in result.stdout

                loaded_modules[module] = loaded
            except:
                loaded_modules[module] = False

        # Check AppArmor status
        apparmor_enabled = False
        try:
            with open('/sys/kernel/security/apparmor/current_profile', 'r') as f:
                profile = f.read().strip()
                apparmor_enabled = profile != 'unconfined'
        except:
            pass

        loaded_modules['apparmor_enabled'] = apparmor_enabled

        return {
            'status': 'PASS',  # Informational only
            'modules': loaded_modules,
            'severity': 'LOW'
        }

    def _generate_recommendations(self, checks):
        """Generate security recommendations based on check results."""
        recommendations = []

        if checks.get('running_as_root', {}).get('status') == 'FAIL':
            recommendations.append({
                'priority': 'HIGH',
                'category': 'User Permissions',
                'recommendation': 'Run container as non-root user',
                'action': 'Add USER directive to Dockerfile and create appuser'
            })

        if checks.get('capabilities', {}).get('status') == 'FAIL':
            dangerous_caps = checks['capabilities'].get('dangerous_caps', [])
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Linux Capabilities',
                'recommendation': f'Remove dangerous capabilities: {", ".join(dangerous_caps)}',
                'action': 'Use --cap-drop in docker run or docker-compose'
            })

        if checks.get('file_permissions', {}).get('status') == 'FAIL':
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'File Permissions',
                'recommendation': 'Fix world-readable sensitive files',
                'action': 'Set proper file permissions in Dockerfile'
            })

        if checks.get('network_security', {}).get('status') == 'FAIL':
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Network Security',
                'recommendation': 'Do not expose sensitive ports',
                'action': 'Remove sensitive port exposures from Dockerfile'
            })

        if checks.get('memory_limits', {}).get('status') == 'WARN':
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Resource Limits',
                'recommendation': 'Monitor memory usage and set appropriate limits',
                'action': 'Configure memory limits in docker-compose.yml'
            })

        return recommendations

    def _log_security_status(self, checks):
        """Log container security status."""
        failed_checks = [k for k, v in checks['checks'].items() if v.get('status') == 'FAIL']
        warnings = [k for k, v in checks['checks'].items() if v.get('status') == 'WARN']

        if failed_checks or warnings:
            logger.warning(
                f"Container security issues detected: {len(failed_checks)} failures, {len(warnings)} warnings",
                extra={
                    'container_id': self.container_id,
                    'failed_checks': failed_checks,
                    'warnings': warnings,
                    'recommendations_count': len(checks['recommendations'])
                }
            )

    def get_security_report(self):
        """Get comprehensive security report."""
        cache_key = f"container_security:{self.container_id}"
        cached_report = cache.get(cache_key)

        if cached_report:
            return cached_report

        report = self.perform_security_check()
        cache.set(cache_key, report, 3600)  # Cache for 1 hour

        return report


# Global container security instance
container_security = ContainerSecurity()