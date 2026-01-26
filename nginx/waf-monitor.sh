#!/bin/bash
# nginx-waf-monitor.sh - WAF Monitoring and Health Check Script
# This script monitors nginx WAF status, security events, and performance metrics

set -e

# Configuration
NGINX_CONTAINER="villen-nginx-waf"
LOG_DIR="/var/log/nginx"
SECURITY_LOG="${LOG_DIR}/security_events.log"
ACCESS_LOG="${LOG_DIR}/access.log"
ERROR_LOG="${LOG_DIR}/error.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running or not accessible"
        exit 1
    fi
}

# Check nginx container status
check_nginx_status() {
    log "Checking nginx WAF container status..."

    if ! docker ps | grep -q "$NGINX_CONTAINER"; then
        error "Nginx WAF container '$NGINX_CONTAINER' is not running"
        return 1
    fi

    local status=$(docker inspect --format='{{.State.Status}}' "$NGINX_CONTAINER" 2>/dev/null)
    if [ "$status" != "running" ]; then
        error "Nginx WAF container is in status: $status"
        return 1
    fi

    success "Nginx WAF container is running"
    return 0
}

# Check nginx configuration
check_nginx_config() {
    log "Checking nginx configuration..."

    if ! docker exec "$NGINX_CONTAINER" nginx -t >/dev/null 2>&1; then
        error "Nginx configuration test failed"
        return 1
    fi

    success "Nginx configuration is valid"
    return 0
}

# Monitor security events
monitor_security_events() {
    log "Monitoring security events..."

    local time_window="1 hour ago"
    local security_events=$(docker exec "$NGINX_CONTAINER" sh -c "find $LOG_DIR -name '*.log' -newermt '$time_window' -exec grep -l 'threat\|attack\|block\|deny' {} \; 2>/dev/null | wc -l")

    if [ "$security_events" -gt 0 ]; then
        warning "Found $security_events log files with security events in the last hour"

        # Show recent security events
        docker exec "$NGINX_CONTAINER" sh -c "find $LOG_DIR -name '*.log' -exec grep -h 'threat\|attack\|block\|deny' {} \; 2>/dev/null | tail -10"
    else
        success "No security events detected in the last hour"
    fi
}

# Check rate limiting status
check_rate_limits() {
    log "Checking rate limiting status..."

    # Check for rate limit violations in logs
    local rate_limit_hits=$(docker exec "$NGINX_CONTAINER" sh -c "grep -c 'limiting requests' $ACCESS_LOG 2>/dev/null || echo '0'")

    if [ "$rate_limit_hits" -gt 0 ]; then
        warning "Rate limiting triggered $rate_limit_hits times"
    else
        success "No rate limiting violations detected"
    fi
}

# Monitor performance metrics
monitor_performance() {
    log "Monitoring performance metrics..."

    # Check response times
    local slow_requests=$(docker exec "$NGINX_CONTAINER" sh -c "awk '{if (\$NF > 1) print \$0}' $ACCESS_LOG 2>/dev/null | wc -l")

    if [ "$slow_requests" -gt 0 ]; then
        warning "Found $slow_requests slow requests (>1 second)"
    fi

    # Check error rates
    local error_count=$(docker exec "$NGINX_CONTAINER" sh -c "grep -c ' 4[0-9][0-9] ' $ACCESS_LOG 2>/dev/null || echo '0'")
    local total_requests=$(docker exec "$NGINX_CONTAINER" sh -c "wc -l < $ACCESS_LOG 2>/dev/null || echo '1'")

    if [ "$total_requests" -gt 0 ]; then
        local error_rate=$((error_count * 100 / total_requests))
        if [ "$error_rate" -gt 5 ]; then
            warning "High error rate: ${error_rate}% (${error_count}/${total_requests})"
        else
            success "Error rate: ${error_rate}% (${error_count}/${total_requests})"
        fi
    fi
}

# Check SSL/TLS status
check_ssl_status() {
    log "Checking SSL/TLS status..."

    # Check if SSL certificates exist
    if ! docker exec "$NGINX_CONTAINER" sh -c "test -f /etc/nginx/ssl/cert.pem && test -f /etc/nginx/ssl/key.pem"; then
        warning "SSL certificates not found in container"
        return 1
    fi

    # Check certificate expiration
    local cert_expiry=$(docker exec "$NGINX_CONTAINER" sh -c "openssl x509 -in /etc/nginx/ssl/cert.pem -noout -enddate 2>/dev/null | cut -d= -f2")
    local cert_epoch=$(date -d "$cert_expiry" +%s 2>/dev/null)
    local now_epoch=$(date +%s)
    local days_left=$(( (cert_epoch - now_epoch) / 86400 ))

    if [ "$days_left" -lt 30 ]; then
        warning "SSL certificate expires in $days_left days"
    else
        success "SSL certificate expires in $days_left days"
    fi
}

# Check WAF rules status
check_waf_rules() {
    log "Checking WAF rules status..."

    # Verify WAF configuration files exist
    local waf_files=("waf-rules.conf" "api-waf-rules.conf" "security-monitoring.conf" "rate-limiting.conf" "security-headers.conf")

    for file in "${waf_files[@]}"; do
        if ! docker exec "$NGINX_CONTAINER" sh -c "test -f /etc/nginx/$file"; then
            error "WAF configuration file missing: $file"
            return 1
        fi
    done

    success "All WAF configuration files present"
}

# Generate security report
generate_report() {
    log "Generating security report..."

    local report_file="/tmp/waf-security-report-$(date +%Y%m%d-%H%M%S).txt"

    {
        echo "=== Nginx WAF Security Report ==="
        echo "Generated: $(date)"
        echo ""

        echo "=== Container Status ==="
        docker ps --filter "name=$NGINX_CONTAINER" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""

        echo "=== Recent Security Events ==="
        docker exec "$NGINX_CONTAINER" sh -c "find $LOG_DIR -name '*.log' -exec grep -h 'threat\|attack\|block\|deny' {} \; 2>/dev/null | tail -20" 2>/dev/null || echo "No recent security events"
        echo ""

        echo "=== Rate Limiting Status ==="
        docker exec "$NGINX_CONTAINER" sh -c "grep -c 'limiting requests' $ACCESS_LOG 2>/dev/null || echo '0'" 2>/dev/null
        echo "rate limit violations in access log"
        echo ""

        echo "=== Error Statistics ==="
        docker exec "$NGINX_CONTAINER" sh -c "awk '{print \$9}' $ACCESS_LOG 2>/dev/null | grep '^4' | sort | uniq -c | sort -nr" 2>/dev/null || echo "No 4xx errors found"
        echo ""

        echo "=== Performance Metrics ==="
        docker exec "$NGINX_CONTAINER" sh -c "awk '{sum+=\$NF; count++} END {if (count>0) print \"Average response time:\", sum/count, \"seconds\"}' $ACCESS_LOG 2>/dev/null" 2>/dev/null || echo "Unable to calculate average response time"
        echo ""

    } > "$report_file"

    success "Security report generated: $report_file"
}

# Main monitoring function
main() {
    log "Starting Nginx WAF monitoring..."

    check_docker

    local checks_passed=0
    local total_checks=0

    # Run all checks
    ((total_checks++))
    if check_nginx_status; then
        ((checks_passed++))
    fi

    ((total_checks++))
    if check_nginx_config; then
        ((checks_passed++))
    fi

    ((total_checks++))
    if check_waf_rules; then
        ((checks_passed++))
    fi

    check_ssl_status
    monitor_security_events
    check_rate_limits
    monitor_performance

    # Generate report if requested
    if [ "$1" = "--report" ]; then
        generate_report
    fi

    echo ""
    log "Monitoring complete: $checks_passed/$total_checks checks passed"

    if [ "$checks_passed" -eq "$total_checks" ]; then
        success "All critical checks passed"
        exit 0
    else
        error "Some checks failed"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"