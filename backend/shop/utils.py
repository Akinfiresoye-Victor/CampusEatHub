from django.http import JsonResponse

def check_role_guard(request, required_role=None):
    """
    Reusable helper to authenticate users and verify system roles.
    Returns a JsonResponse to block execution, or None to allow access.
    """
    # 1. Enforce authentication
    if not request.user.is_authenticated:
        return JsonResponse(
            {"detail": "Authentication Credentials were not provided."}, 
            status=401
        )
        
    # 2. Enforce role checking if a role restriction was specified
    if required_role is not None:
        # Using getattr safely reads the field if you extended the User model
        user_role = getattr(request.user, 'role', None)
        
        if user_role != required_role:
            return JsonResponse(
                {"detail": "You do not have permission to access this resource."}, 
                status=403
            )
            
    # 3. Everything passed, allow the view to proceed
    return None
