#!/usr/bin/env python
"""
Test script for API key authentication and security features.
Run this script to verify that the security implementations are working correctly.
"""

import requests
import json
import sys
import os

# Configuration
BASE_URL = 'http://127.0.0.1:8000'
API_KEY = '187331af69f4b2317ea6ef79ddde50bdd044281ba9eb4d2ed583cba2819c82d7'  # From our test generation

def test_health_check():
    """Test basic health check endpoint."""
    print("🩺 Testing health check endpoint...")
    try:
        response = requests.get(f'{BASE_URL}/api/health/')
        print(f"✅ Health check: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_rss_feed_no_auth():
    """Test RSS feed without authentication."""
    print("📰 Testing RSS feed without authentication...")
    try:
        response = requests.get(f'{BASE_URL}/api/feeds/rss/')
        print(f"✅ RSS feed (no auth): {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ RSS feed (no auth) failed: {e}")
        return False

def test_rss_feed_with_api_key():
    """Test RSS feed with API key authentication."""
    print("🔑 Testing RSS feed with API key...")
    try:
        headers = {'X-API-Key': API_KEY}
        response = requests.get(f'{BASE_URL}/api/feeds/rss/', headers=headers)
        print(f"✅ RSS feed (API key): {response.status_code}")

        # Check for API key name header
        if 'X-API-Key-Name' in response.headers:
            print(f"✅ API key name header present: {response.headers['X-API-Key-Name']}")
        else:
            print("⚠️  API key name header missing")

        return response.status_code == 200
    except Exception as e:
        print(f"❌ RSS feed (API key) failed: {e}")
        return False

def test_security_headers():
    """Test security headers on responses."""
    print("🔒 Testing security headers...")
    try:
        response = requests.get(f'{BASE_URL}/api/health/')
        headers = response.headers

        security_headers = [
            'X-Frame-Options',
            'X-Content-Type-Options',
            'X-XSS-Protection',
            'Content-Security-Policy',
            'X-Correlation-ID',
        ]

        present_headers = []
        missing_headers = []

        for header in security_headers:
            if header in headers:
                present_headers.append(header)
            else:
                missing_headers.append(header)

        if present_headers:
            print(f"✅ Security headers present: {', '.join(present_headers)}")
        if missing_headers:
            print(f"⚠️  Security headers missing: {', '.join(missing_headers)}")

        return len(present_headers) > 0
    except Exception as e:
        print(f"❌ Security headers test failed: {e}")
        return False

def test_api_versioning():
    """Test API versioning with Accept header."""
    print("📋 Testing API versioning...")
    try:
        headers = {'Accept': 'application/vnd.villen.v1+json'}
        response = requests.get(f'{BASE_URL}/api/health/', headers=headers)
        print(f"✅ API versioning: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ API versioning failed: {e}")
        return False

def test_invalid_api_key():
    """Test with invalid API key."""
    print("🚫 Testing invalid API key...")
    try:
        headers = {'X-API-Key': 'invalid-key-12345'}
        response = requests.get(f'{BASE_URL}/api/feeds/rss/', headers=headers)
        print(f"✅ Invalid API key rejected: {response.status_code}")
        return response.status_code in [401, 403]
    except Exception as e:
        print(f"❌ Invalid API key test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("🚀 Starting Security Implementation Tests")
    print("=" * 50)

    tests = [
        test_health_check,
        test_rss_feed_no_auth,
        test_rss_feed_with_api_key,
        test_security_headers,
        test_api_versioning,
        test_invalid_api_key,
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1
        print()

    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All security tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above.")
        return 1

if __name__ == '__main__':
    sys.exit(main())