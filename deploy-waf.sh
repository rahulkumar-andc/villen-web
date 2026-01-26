#!/bin/bash
# deploy-waf.sh - WAF Deployment and Testing Script
# This script deploys the nginx WAF configuration and runs comprehensive tests

set -e

# Configuration
COMPOSE_FILE="docker-compose.yml"
NGINX_CONTAINER="villen-nginx-waf"
TEST_URL="http://localhost"
SSL_TEST_URL="https://localhost"

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

# Validate configuration files
validate_config() {
    log "Validating WAF configuration files..."

    local config_files=(
        "nginx/nginx.conf"
        "nginx/waf-rules.conf"
        "nginx/api-waf-rules.conf"
        "nginx/security-monitoring.conf"
        "nginx/ssl-config.conf"
        "nginx/upstream.conf"
        "nginx/rate-limiting.conf"
        "nginx/security-headers.conf"
    )

    for file in "${config_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "Configuration file missing: $file"
            return 1
        fi
        success "Found: $file"
    done

    success "All configuration files present"
}

# Backup existing configuration
backup_config() {
    log "Creating backup of existing configuration..."

    local backup_dir="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"

    # Backup docker-compose and nginx configs
    cp docker-compose.yml "$backup_dir/" 2>/dev/null || true
    cp nginx.conf "$backup_dir/" 2>/dev/null || true
    cp -r nginx/ "$backup_dir/" 2>/dev/null || true

    success "Backup created in: $backup_dir"
    echo "$backup_dir"
}

# Deploy WAF configuration
deploy_waf() {
    log "Deploying WAF configuration..."

    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose down || true

    # Start services with new configuration
    log "Starting services with WAF..."
    docker-compose up -d

    # Wait for services to be ready
    log "Waiting for services to start..."
    sleep 10

    success "WAF deployment initiated"
}

# Test basic connectivity
test_connectivity() {
    log "Testing basic connectivity..."

    # Wait for nginx to be ready
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s --max-time 5 "$TEST_URL" >/dev/null 2>&1; then
            success "Nginx is responding on port 80"
            return 0
        fi

        log "Waiting for nginx to respond (attempt $attempt/$max_attempts)..."
        sleep 2
        ((attempt++))
    done

    error "Nginx failed to respond on port 80"
    return 1
}

# Test SSL/TLS
test_ssl() {
    log "Testing SSL/TLS configuration..."

    # Test SSL certificate
    if curl -s --max-time 5 -k "$SSL_TEST_URL" >/dev/null 2>&1; then
        success "SSL endpoint is responding"

        # Check SSL certificate info
        local cert_info=$(curl -s -k -v "$SSL_TEST_URL" 2>&1 | grep "subject:" | head -1)
        log "SSL Certificate: $cert_info"
    else
        warning "SSL endpoint not responding (may be expected in development)"
    fi
}

# Test WAF functionality
test_waf() {
    log "Testing WAF functionality..."

    local test_cases=(
        "SQL Injection:/?id=1' OR '1'='1"
        "XSS:/?q=<script>alert(1)</script>"
        "Path Traversal:/../../../etc/passwd"
        "Command Injection:/?cmd=;cat /etc/passwd"
        "Directory Traversal:/admin/../etc/passwd"
    )

    local blocked=0
    local total=0

    for test_case in "${test_cases[@]}"; do
        local name=$(echo "$test_case" | cut -d: -f1)
        local url=$(echo "$test_case" | cut -d: -f2)

        ((total++))
        log "Testing $name..."

        local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$TEST_URL$url" 2>/dev/null || echo "000")

        if [ "$response" = "403" ]; then
            success "✓ $name blocked (403 Forbidden)"
            ((blocked++))
        elif [ "$response" = "429" ]; then
            success "✓ $name rate limited (429 Too Many Requests)"
            ((blocked++))
        else
            warning "⚠ $name returned $response (not blocked)"
        fi
    done

    success "WAF test complete: $blocked/$total attacks blocked"
}

# Test API endpoints
test_api() {
    log "Testing API endpoints..."

    # Test health endpoint
    if curl -s --max-time 5 "$TEST_URL/api/health/" >/dev/null 2>&1; then
        success "API health endpoint responding"
    else
        warning "API health endpoint not responding"
    fi

    # Test API with invalid auth
    local api_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$TEST_URL/api/admin/" 2>/dev/null || echo "000")

    if [ "$api_response" = "401" ]; then
        success "API authentication working (401 for unauthenticated request)"
    else
        log "API returned $api_response for unauthenticated request"
    fi
}

# Test security headers
test_security_headers() {
    log "Testing security headers..."

    local headers=$(curl -s -I --max-time 5 "$TEST_URL" 2>/dev/null | tr -d '\r')

    # Check for important security headers
    local security_headers=(
        "X-Frame-Options"
        "X-Content-Type-Options"
        "X-XSS-Protection"
        "Strict-Transport-Security"
        "Content-Security-Policy"
    )

    local found=0
    for header in "${security_headers[@]}"; do
        if echo "$headers" | grep -i "^$header:" >/dev/null; then
            success "✓ $header present"
            ((found++))
        else
            warning "⚠ $header missing"
        fi
    done

    success "Security headers check: $found/${#security_headers[@]} present"
}

# Test rate limiting
test_rate_limiting() {
    log "Testing rate limiting..."

    # Make multiple rapid requests
    local requests=20
    local blocked=0

    log "Making $requests rapid requests..."

    for i in $(seq 1 $requests); do
        local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "$TEST_URL" 2>/dev/null || echo "000")

        if [ "$response" = "429" ]; then
            ((blocked++))
        fi

        # Small delay to avoid overwhelming
        sleep 0.1
    done

    if [ "$blocked" -gt 0 ]; then
        success "✓ Rate limiting working: $blocked requests blocked"
    else
        warning "⚠ No rate limiting detected (may need more requests or different timing)"
    fi
}

# Run monitoring script
run_monitoring() {
    log "Running WAF monitoring..."

    if [ -x "./nginx/waf-monitor.sh" ]; then
        ./nginx/waf-monitor.sh
    else
        warning "Monitoring script not found or not executable"
    fi
}

# Generate deployment report
generate_deployment_report() {
    log "Generating deployment report..."

    local report_file="waf-deployment-report-$(date +%Y%m%d-%H%M%S).txt"

    {
        echo "=== WAF Deployment Report ==="
        echo "Generated: $(date)"
        echo ""

        echo "=== Services Status ==="
        docker-compose ps
        echo ""

        echo "=== Container Logs ==="
        echo "Nginx logs (last 20 lines):"
        docker-compose logs --tail=20 nginx 2>/dev/null || echo "No nginx logs available"
        echo ""

        echo "=== Configuration Validation ==="
        if docker exec "$NGINX_CONTAINER" nginx -t 2>/dev/null; then
            echo "✓ Nginx configuration is valid"
        else
            echo "✗ Nginx configuration has errors"
        fi
        echo ""

        echo "=== Security Test Results ==="
        echo "Run './nginx/waf-monitor.sh --report' for detailed security report"
        echo ""

    } > "$report_file"

    success "Deployment report generated: $report_file"
}

# Main deployment function
main() {
    log "Starting WAF deployment..."

    # Validate configuration
    if ! validate_config; then
        error "Configuration validation failed"
        exit 1
    fi

    # Create backup
    local backup_dir=$(backup_config)

    # Deploy WAF
    if ! deploy_waf; then
        error "WAF deployment failed"
        exit 1
    fi

    # Run tests
    local tests_passed=0
    local total_tests=0

    ((total_tests++))
    if test_connectivity; then
        ((tests_passed++))
    fi

    test_ssl
    test_waf
    test_api
    test_security_headers
    test_rate_limiting

    # Run monitoring
    run_monitoring

    # Generate report
    generate_deployment_report

    echo ""
    log "Deployment complete: $tests_passed/$total_tests critical tests passed"

    if [ "$tests_passed" -eq "$total_tests" ]; then
        success "WAF deployment successful!"
        echo ""
        log "Next steps:"
        echo "  1. Monitor logs: docker-compose logs -f nginx"
        echo "  2. Run monitoring: ./nginx/waf-monitor.sh"
        echo "  3. Check security: ./nginx/waf-monitor.sh --report"
        echo "  4. Backup location: $backup_dir"
    else
        warning "Some tests failed - check logs and configuration"
    fi
}

# Handle command line arguments
case "${1:-}" in
    "--test-only")
        log "Running tests only (no deployment)..."
        validate_config
        test_connectivity && test_ssl && test_waf && test_api && test_security_headers && test_rate_limiting
        run_monitoring
        ;;
    "--backup-only")
        backup_config
        ;;
    "--help"|"-h")
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --test-only    Run tests without deploying"
        echo "  --backup-only  Create backup only"
        echo "  --help         Show this help"
        echo ""
        echo "Normal usage (deploy and test): $0"
        ;;
    *)
        main "$@"
        ;;
esac