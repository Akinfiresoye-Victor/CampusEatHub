from django.http import JsonResponse
from .models import Product, CafeteriaData, StudentData
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model

# Correct cross-app way to reference the User model
User = get_user_model()


def get_all_products(request):
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "Method not allowed"}, status=405)

    try:
        # Only show available products on the public browse page
        products = Product.objects.select_related('seller').filter(is_available=True)

        data = []
        for product in products:
            seller = product.seller

            if product.seller_type == 'student_vendor':
                student_profile = seller.student_data.first()
                seller_full_name = student_profile.full_name if student_profile else None

            elif product.seller_type == 'cafeteria':
                cafeteria_profile = seller.cafeteriadata_set.first()
                seller_full_name = cafeteria_profile.owner_name if cafeteria_profile else None

            else:
                seller_full_name = None

            image_url = request.build_absolute_uri(product.image.url) if product.image else None

            data.append({
                'id': product.pk,
                'name': product.name,
                'price': str(product.price),
                'image_url': image_url,
                'is_available': product.is_available,
                'seller_type': product.seller_type,
                'seller_id': seller.id,
                'seller_full_name': seller_full_name,
            })

        return JsonResponse({'success': True, 'products': data}, status=200)

    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': 'Error retrieving data'}, status=500)


def get_single_product(request, product_id):
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "Method not allowed"}, status=405)

    try:
        product = Product.objects.get(pk=product_id)
        seller = product.seller

        if product.seller_type == 'student_vendor':
            student_profile = seller.student_data.first()
            seller_full_name = student_profile.full_name if student_profile else None

        elif product.seller_type == 'cafeteria':
            cafeteria_profile = seller.cafeteriadata_set.first()
            seller_full_name = cafeteria_profile.owner_name if cafeteria_profile else None

        else:
            seller_full_name = None

        image_url = request.build_absolute_uri(product.image.url) if product.image else None

        data = {
            'id': product.pk,
            'name': product.name,
            'price': str(product.price),          # FIX: was product.price — not serializable
            'image_url': image_url,
            'is_available': product.is_available,
            'seller_type': product.seller_type,
            'seller_id': seller.id,               # added per spec
            'seller_full_name': seller_full_name, # added per spec
            'created_at': product.created_at.isoformat()  # FIX: was product.created_at — not serializable
        }

        return JsonResponse({'success': True, 'product': data}, status=200)

    except Product.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Product not found'}, status=404)
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': 'Error retrieving data'}, status=500)


def get_all_cafeterias(request):
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "Method not allowed"}, status=405)

    try:
        # FIX: query Users with role='cafeteria', not CafeteriaData directly
        # This ensures the ID we return is the User.pk, which is what
        # get_cafeteria() expects when called as /api/cafeterias/<id>/menu/
        cafeteria_users = User.objects.filter(role='cafeteria')

        data = []
        for user in cafeteria_users:
            profile = CafeteriaData.objects.filter(cafeteria=user).first()

            logo_url = None
            if profile and profile.company_logo:
                logo_url = request.build_absolute_uri(profile.company_logo.url)

            data.append({
                'id': user.pk,                                          # User ID — correct for menu lookup
                'owner_name': profile.owner_name if profile else None,  # person's name
                'business_name': profile.buisness_name if profile else None,
                'logo': logo_url,
            })

        return JsonResponse({'success': True, 'cafeterias': data}, status=200)

    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': 'Error retrieving data'}, status=500)


def get_cafeteria(request, caf_id):
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "Method not allowed"}, status=405)

    try:
        caf_user = User.objects.get(pk=caf_id)
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Cafeteria not found'}, status=404)

    if getattr(caf_user, 'role', None) != 'cafeteria':
        return JsonResponse({'success': False, 'error': 'Cafeteria not found'}, status=404)

    try:
        # FIX: was filter(user=caf_user) — 'user' field doesn't exist, it's 'cafeteria'
        caf_profile = CafeteriaData.objects.filter(cafeteria=caf_user).first()
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': 'Error retrieving cafeteria data'}, status=500)

    products = Product.objects.filter(seller=caf_user)

    product_list = []
    for product in products:
        # FIX: was product.image.url — relative URL, needs build_absolute_uri
        image_url = request.build_absolute_uri(product.image.url) if product.image else None
        product_list.append({
            'id': product.pk,
            'name': product.name,
            'price': str(product.price),
            'image_url': image_url,
            'is_available': product.is_available,
            'seller_type': product.seller_type,
        })

    logo_url = None
    if caf_profile and caf_profile.company_logo:
        logo_url = request.build_absolute_uri(caf_profile.company_logo.url)

    return JsonResponse({
        'success': True,
        'cafeteria': {
            'id': caf_user.pk,
            'business_name': caf_profile.buisness_name if caf_profile else None,
            'owner_name': caf_profile.owner_name if caf_profile else None,
            'logo': logo_url,
        },
        'products': product_list
    }, status=200)