# showpur_main/settings/prod.py
"""
Production settings - for live deployment
"""

from .base import *  # noqa: F401, F403
from .base import env, BASE_DIR
import os

DEBUG = False

# ✅ Must be set in environment variables
# use an empty list as default to satisfy env.list type expectations
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[])

# Database - Production (RDS, Neon, etc.)
DATABASES = {
    'default': env.db('DATABASE_URL'),
}

# Security settings for production
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# CORS for production
# use an empty list as default to satisfy env.list type expectations
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])

# Email backend (SMTP for production)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')

# Static files (production - S3)
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# AWS S3 Configuration
AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = env('AWS_S3_REGION_NAME', default='ap-south-1')
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'

# Django 4.2+ unified storage config (replaces STATICFILES_STORAGE / DEFAULT_FILE_STORAGE)
STORAGES = {
    'default': {
        'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
        'OPTIONS': {'location': 'media'},
    },
    'staticfiles': {
        'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
        'OPTIONS': {'location': 'static'},
    },
}

MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'

# Logging for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/showpur/error.log',
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 5,
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'ERROR',
    },
}