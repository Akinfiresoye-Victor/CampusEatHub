from django.shortcuts import render
from .models import StudentData
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from shop.utils import check_role_guard



def get_student_data(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    # Call the guard. For a student view, require the 'student' role.
    auth_error = check_role_guard(request, required_role='student')
    if auth_error:
        return auth_error  # Short-circuits the view and returns the 401 or 403

    try:
        student_data=StudentData.objects.get(student=request.user)
        pic_url = student_data.profile_picture.url if student_data.profile_picture else None
        user_data={
        "id":student_data.pk,
        "username":request.user.username,
        "full_name":student_data.full_name,
        "role":request.user.role,
        "matric_number":student_data.matric_number,
        "pic":pic_url,
        }
        return JsonResponse(user_data, status=200)
    except StudentData.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Student data not found'}, status=404)
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': 'Server error retriving data'}, status=500)