# pasmenpasara/celery.py
import os
from celery import Celery  # ✅ import from the celery package

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pasmenpasara.settings')

app = Celery('pasmenpasara')

# Load settings with CELERY_ prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Automatically discover tasks.py in all installed apps
app.autodiscover_tasks()
