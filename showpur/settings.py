# showpur/settings.py

from pathlib import Path
from datetime import timedelta # <-- Needed for JWT settings

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-@1nj+!3#o+s*h*ceqp^*&!hd6*)$p7xyu76(obvs_&&823mal5'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []


# -------------------------------------------------------------------
# 1. APPLICATION DEFINITION (INSTALLED_APPS) - CONSOLIDATED
# -------------------------------------------------------------------

INSTALLED_APPS = [
    # Django Core Apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # 🛑 Your Custom App (CRITICAL for Admin Link) 🛑
    'core',
    
    # Third-Party API Apps
    'corsheaders',      
    'rest_framework',   
    'django_filters',   
    'rest_framework_simplejwt', 
]

# -------------------------------------------------------------------
# 2. MIDDLEWARE (ORDER IS CRITICAL) - CONSOLIDATED
# -------------------------------------------------------------------

MIDDLEWARE = [
    # CORS Middleware MUST be first
    'corsheaders.middleware.CorsMiddleware', 
    
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
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
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
STATIC_URL = 'static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# -------------------------------------------------------------------
# 3. CUSTOM SETTINGS (CORS, DRF, JWT, MEDIA) - CONSOLIDATED
# -------------------------------------------------------------------

# CORS Settings
# Using True for development simplicity. If you use CORS_ALLOWED_ORIGINS, 
# you MUST set CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_ALL_ORIGINS = True 

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization', # CRITICAL: Allows the Bearer token to be passed
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
}

# JWT Settings (for "Remember Me" and token lifespan)
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True, 
    'AUTH_HEADER_TYPES': ('Bearer',), 
    # 🛑 CRITICAL: Use the custom token serializer 🛑
    'TOKEN_OBTAIN_PAIR_SERIALIZER': 'core.token_serializers.MyTokenObtainPairSerializer',
}

# Media files (for user-uploaded content)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
