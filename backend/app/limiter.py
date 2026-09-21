from slowapi import Limiter

def get_client_ip(request):
    if not request:
        return "127.0.0.1"
    try:
        if hasattr(request, "headers") and request.headers:
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                return forwarded.split(",")[0].strip()
            real_ip = request.headers.get("x-real-ip")
            if real_ip:
                return real_ip.strip()
        client = getattr(request, "client", None)
        if client and getattr(client, "host", None):
            return client.host
    except Exception:
        pass
    return "127.0.0.1"

limiter = Limiter(key_func=get_client_ip)
