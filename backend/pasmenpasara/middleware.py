import json
import logging
from django.utils.deprecation import MiddlewareMixin
from inventory.models import ActivityLog

logger = logging.getLogger(__name__)

class ActivityLogMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        # Only log successful modifications (2xx status) for POST, PATCH, DELETE
        if request.method in ['POST', 'PATCH', 'DELETE'] and 200 <= response.status_code < 300:
            user = None
            if hasattr(request, 'user') and request.user.is_authenticated:
                user = request.user
            else:
                # Try to authenticate via JWT manually if not set
                try:
                    from rest_framework_simplejwt.authentication import JWTAuthentication
                    auth = JWTAuthentication()
                    # Debugging headers
                    # auth_header = request.META.get('HTTP_AUTHORIZATION')
                    # print(f"DEBUG: Auth Header: {auth_header}", flush=True)
                    
                    auth_result = auth.authenticate(request)
                    if auth_result:
                        user = auth_result[0]
                        # print(f"DEBUG: Auth Success: {user.username}", flush=True)
                except Exception as e:
                    print(f"DEBUG: Middleware Auth Failed: {e}", flush=True)
                    pass

            endpoint = request.path
            action = request.method
            ip_address = self.get_client_ip(request)
            
            details = {}
            if request.method in ['POST', 'PATCH']:
                try:
                    # Attempt to read body if possible, or use POST data
                    if request.POST:
                        details = dict(request.POST)
                    elif request.body:
                        # Warning: request.body might be consumed already. 
                        # Django doesn't cache it by default unless configured.
                        # If this fails, we can't do much.
                        details = json.loads(request.body.decode('utf-8'))
                except Exception:
                    # details = {"info": "Could not parse request body or body already consumed"}
                    pass

            try:
                ActivityLog.objects.create(
                    user=user,
                    action=action,
                    endpoint=endpoint,
                    details=details,
                    ip_address=ip_address
                )
            except Exception as e:
                logger.error(f"Failed to create ActivityLog: {e}")

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
