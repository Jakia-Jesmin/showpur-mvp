# showpur/settings.py

from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv() 

# This defines BASE_DIR
BASE_DIR = Path(__file__).resolve().parent.parent 

# Media files (for user-uploaded content)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Quick-start development settings - unsuitable for production
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-@1nj+!3#o+s*h*ceqp^*&!hd6*)$p7xyu76(obvs_&&823mal5')  
DEBUG = os.getenv('DEBUG', 'False') == 'True' 

ALLOWED_HOSTS = ["*"]


# -------------------------------------------------------------------
# 1. APPLICATION DEFINITION (INSTALLED_APPS)
# -------------------------------------------------------------------

INSTALLED_APPS = [
    # Django Core Apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-Party API/Utility Apps
    'corsheaders', 
    'rest_framework',
    'django_filters',
    'rest_framework_simplejwt', 
    'djoser',
    
    # Your Custom App
    'core',
]

# -------------------------------------------------------------------
# 2. MIDDLEWARE (ORDER IS CRITICAL)
# -------------------------------------------------------------------

MIDDLEWARE = [
    # CORS Middleware MUST be first
    'corsheaders.middleware.CorsMiddleware', 
    'whitenoise.middleware.WhiteNoiseMiddleware', 
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    
    # Django Authentication
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'showpur.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'showpur.wsgi.application'


# Database
DB_NAME = os.getenv('DB_NAME', BASE_DIR / 'db.sqlite3') 

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': DB_NAME, 
    }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
# 1. Base URL for static assets (browser endpoint)
STATIC_URL = 'static/'

# It should point to C:\showpur-mvp\staticfiles
STATIC_ROOT = BASE_DIR / 'staticfiles'

# This points to C:\showpur-mvp\static
STATICFILES_DIRS = [
    BASE_DIR / 'static'
]

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Corrected Whitenoise Storage Backend
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# -------------------------------------------------------------------
# 3. CUSTOM SETTINGS (CORS, DRF, JWT, DJOSER)
# -------------------------------------------------------------------

# CORS Settings
CORS_ALLOW_ALL_ORIGINS = True 

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization', # Critical for Bearer token
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Django REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # CRITICAL: Ensures DRF reads the JWT Bearer token
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication', 
    ),
    
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
    ),

    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ),
}

# JWT Settings (Simple JWT)
SIMPLE_JWT = { 
    # REFINEMENT: Increased Access Token lifetime for easier debugging
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60), 
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True, 
    'AUTH_HEADER_TYPES': ('Bearer',), 
    # CRITICAL: Use the custom token serializer to pass User ID during login
    'TOKEN_OBTAIN_PAIR_SERIALIZER': 'core.token_serializers.MyTokenObtainPairSerializer',
}

# DJOSER Settings (NEW/REFINED BLOCK)
DJOSER = {
    # Specify the token type (JWT) for the backend
    'TOKEN_MODEL': None, 
    
    # Use standard Djoser endpoints with our custom serializers
    'SERIALIZERS': {
        'user_create': 'core.serializers.UserCreateSerializer', # Assumes custom serializer in core app
        'user': 'core.serializers.CustomUserSerializer',             # Assumes custom serializer in core app
         'current_user': 'core.serializers.CustomUserSerializer',
    },
    
    # Settings for email links (if you implement email confirmation later)
    'PASSWORD_RESET_CONFIRM_URL': '#/password/reset/confirm/{uid}/{token}',
    'USERNAME_RESET_CONFIRM_URL': '#/username/reset/confirm/{uid}/{token}',
    'ACTIVATION_URL': '#/activate/{uid}/{token}',
    'SEND_ACTIVATION_EMAIL': False,
    
    # Required for Djoser to work with Simple JWT/DRF
    'PERMISSIONS': {
        'user_list': ['rest_framework.permissions.IsAdminUser'],
    }
}

DEBUG = True





