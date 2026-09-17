from rest_framework.throttling import SimpleRateThrottle


class AuthRateThrottle(SimpleRateThrottle):
    """
    Tight throttle for auth endpoints (login / register).
    Scope 'auth' maps to 5 requests per minute.
    """
    scope = "auth"

    def get_cache_key(self, request, view):
        # Identify by IP for anonymous users, by user id for logged-in.
        ident = request.user.pk if request.user and request.user.is_authenticated else self.get_ident(request)
        if not ident:
            return None
        return self.cache_format % {
            "scope": self.scope,
            "ident": ident,
        }
