from django.shortcuts import render
from .models import CafeteriaData
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from shop.utils import check_role_guard




def get_cafeteria_data(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    
    auth_error= check_role_guard(request, required_role='cafeteria')
    if auth_error:
        return auth_error
    
    try:
        caf_data=CafeteriaData.objects.get(cafeteria=request.user)
        pic_url= caf_data.company_logo.url if caf_data.company_logo else None
        user_data={
            "id": caf_data.pk,
            "cafeteria_name": caf_data.buisness_name,
            "owner_name": caf_data.owner_name,
            "phone_number": caf_data.phone_number,
            "pic_url": pic_url
        }
        return JsonResponse(user_data, status=200)
    except CafeteriaData.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Cafeteria data not found'}, status=404)
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': 'Server error retriving data'}, status=500)