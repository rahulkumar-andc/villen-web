# Security-Hardened Backend Dockerfile for Django application
FROM python:3.11-slim

# Security: Add metadata
LABEL maintainer="security@villen.me" \
      version="2.0" \
      security.scan="enabled"

# Security: Create non-root user early
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Security: Set restrictive environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app \
    DJANGO_SETTINGS_MODULE=web.settings \
    # Security settings
    PYTHONHASHSEED=random \
    PYTHONMALLOC=malloc \
    PYTHONTRACEMALLOC=0

# Security: Install minimal system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    postgresql-client \
    libpq-dev \
    gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*

# Security: Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/media /app/static /etc/villen \
    && chown -R appuser:appuser /app \
    && chmod 755 /app \
    && chmod 700 /app/logs

# Security: Copy requirements first for better caching
COPY --chown=appuser:appuser requirements.txt .

# Security: Install Python dependencies as non-root user
USER appuser
RUN pip install --user --upgrade pip setuptools wheel && \
    pip install --user -r requirements.txt && \
    pip cache purge

# Security: Copy application code with proper ownership
USER root
COPY --chown=appuser:appuser . .

# Security: Remove unnecessary files and permissions
RUN find /app -type f -name "*.pyc" -delete && \
    find /app -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true && \
    chmod 644 /app/manage.py && \
    chmod 755 /app/entrypoint.sh 2>/dev/null || true

# Security: Switch to non-root user
USER appuser

# Security: Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Security: Expose only necessary port
EXPOSE 8000

# Security: Use exec form for CMD
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
