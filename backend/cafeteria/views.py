from django.shortcuts import render
from .models import CafeteriaData
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from shop.utils import check_role_guard
from django.core.exceptions import ObjectDoesNotExist
from shop.models import Product
import json
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from shop.models import Order, OrderItem
from django.db.models import Sum, Count
from django.utils import timezone
from decimal import Decimal
User = get_user_model()




#api endpoint for getting the menu of a particular cafeteria and also handling the creation of new menu
def get_cafeteria_menu(request):
    auth_error = check_role_guard(request, required_role='cafeteria')
    if auth_error:
        return auth_error


    if request.method == "GET":
        try:
            products = Product.objects.filter(seller=request.user)
            data = []
            for product in products:
                image_url = request.build_absolute_uri(product.image.url) if product.image else None
                data.append({
                    'id': product.pk,
                    'name': product.name,
                    'price': str(product.price),
                    'image_url': image_url,
                    'is_available': product.is_available,
                })
            return JsonResponse({'success': True, 'products': data}, status=200)  # FIX: was False

        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': 'Error retrieving data'}, status=500)

    elif request.method == 'POST':
        try:
            name = request.POST.get('name')
            price = request.POST.get('price')
            image = request.FILES.get('image')  # optional, can be None

            # Validate required fields before touching the DB
            if not name or not price:
                return JsonResponse({'success': False, 'error': 'name and price are required'}, status=400)

            product = Product.objects.create(
                seller=request.user,
                name=name,
                price=price,         
                image=image,         
                seller_type='cafeteria',
            )

            image_url = request.build_absolute_uri(product.image.url) if product.image else None

            return JsonResponse({
                'success': True,
                'product': {
                    'id': product.pk,
                    'name': product.name,
                    'price': str(product.price),
                    'image_url': image_url,
                    'is_available': product.is_available,
                    'seller_type': product.seller_type,
                }
            }, status=201)  # 201 = Created, not 200

        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': 'Error creating product'}, status=500)

    else:
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)




# API endpoint for updating menu, deleting a menu, and for toggling the available badge
def manage_cafeteria_product(request, product_id):
    auth_error = check_role_guard(request, required_role='cafeteria')
    if auth_error:
        return auth_error


    # Shared lookup — all three methods need this same check
    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Product not found'}, status=404)

    # Ownership check — a cafeteria cannot touch another cafeteria's product
    if product.seller != request.user:
        return JsonResponse({'success': False, 'error': 'Forbidden'}, status=403)


    if request.method == 'PUT':
        try:
            name = request.POST.get('name')
            price = request.POST.get('price')
            image = request.FILES.get('image')  # None if partner didn't send a new image

            if not name or not price:
                return JsonResponse({'success': False, 'error': 'name and price are required'}, status=400)

            product.name = name
            product.price = price
            # Only overwrite image if a new one was actually uploaded
            # If we did product.image = image when image is None, we'd wipe the existing image
            if image:
                product.image = image

            product.save()

            image_url = request.build_absolute_uri(product.image.url) if product.image else None

            return JsonResponse({
                'success': True,
                'product': {
                    'id': product.pk,
                    'name': product.name,
                    'price': str(product.price),
                    'image_url': image_url,
                    'is_available': product.is_available,
                    'seller_type': product.seller_type,
                }
            }, status=200)

        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': 'Error updating product'}, status=500)

    #used for partial update meaning to update little records instead of all of them(POST)
    elif request.method == 'PATCH':
        try:
            # Flip the boolean — if True it becomes False, if False it becomes True
            product.is_available = not product.is_available
            product.save()

            image_url = request.build_absolute_uri(product.image.url) if product.image else None

            return JsonResponse({
                'success': True,
                'product': {
                    'id': product.pk,
                    'name': product.name,
                    'price': str(product.price),
                    'image_url': image_url,
                    'is_available': product.is_available,  # frontend reads this to update the toggle
                    'seller_type': product.seller_type,
                }
            }, status=200)

        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': 'Error toggling availability'}, status=500)


    elif request.method == 'DELETE':
        try:
            product.delete()
            return JsonResponse({'success': True, 'message': 'Product deleted'}, status=200)

        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': 'Error deleting product'}, status=500)

    else:
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)



def cafeteria_status(request):
    auth_error = check_role_guard(request, required_role='cafeteria')
    if auth_error:
        return auth_error

    if request.method == 'GET':
        status_value = getattr(request.user, 'busyness_status', 'quiet')
        return JsonResponse({'success': True, 'data': {'busyness_status': status_value}}, status=200)

    if request.method == 'PATCH':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON body'}, status=400)

        busyness_status = data.get('busyness_status')
        if busyness_status not in ['quiet', 'moderate', 'busy']:
            return JsonResponse({'success': False, 'error': 'Invalid busyness_status'}, status=400)

        request.user.busyness_status = busyness_status
        request.user.save(update_fields=['busyness_status'])
        return JsonResponse({'success': True, 'data': {'busyness_status': busyness_status}}, status=200)

    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


# API endpoint that query and get all the orders goten from students
def cafeteria_orders(request):
    auth_error = check_role_guard(request, required_role='cafeteria')
    if auth_error:
        return auth_error


    if request.method == 'GET':
        try:
            # Start with all orders belonging to this cafeteria, newest first
            orders = Order.objects.filter(seller=request.user).order_by('-created_at')

            # Optional status filter — only applies if ?status=processing is in the URL
            # request.GET is the query params dict e.g. /api/cafeteria/orders/?status=pending
            status_filter = request.GET.get('status')
            if status_filter:
                orders = orders.filter(status=status_filter)

            data = []
            for order in orders:
                # Get the buyer's full name from StudentData
                # The buyer is always a student, so we go through student_data
                buyer_profile = order.buyer.student_data.first()
                buyer_full_name = buyer_profile.full_name if buyer_profile else None

                # Get all items that belong to this order
                order_items = OrderItem.objects.filter(order=order)
                items_list = []
                for item in order_items:
                    items_list.append({
                        'product_name': item.product.name,
                        'quantity': item.quantity,
                        'price_at_time': str(item.price_at_time),  # Decimal → string
                    })

                data.append({
                    'id': order.pk,
                    'buyer_full_name': buyer_full_name,
                    'delivery_type': order.delivery_type,
                    'total_amount': str(order.total_ammount),  # note: typo in your model — two m's
                    'status': order.status,
                    'created_at': order.created_at.isoformat(),  # DateTimeField → string
                    'items': items_list,
                })

            return JsonResponse({'success': True, 'orders': data}, status=200)

        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': 'Error retrieving orders'}, status=500)

    else:
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


# API endpoint that checkes and update the status of a meal
def cafeteria_order_status(request, order_id):
    auth_error = check_role_guard(request, required_role='cafeteria')
    if auth_error:
        return auth_error


    if request.method == 'PATCH':
        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Order not found'}, status=404)

        # Ownership check — a cafeteria can only update their own orders
        if order.seller != request.user:
            return JsonResponse({'success': False, 'error': 'Forbidden'}, status=403)

        # PATCH sends JSON in the body, not form data
        # so we can't use request.POST — we read raw bytes and parse them
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON body'}, status=400)

        new_status = body.get('status')
        if not new_status:
            return JsonResponse({'success': False, 'error': '"status" field is required'}, status=400)

        # Transition map — each key is a current status,
        # its value is a list of statuses it is ALLOWED to move to
        allowed_transitions = {
            'pending':    ['processing', 'cancelled'],
            'processing': ['ready', 'delivered'],
            'ready':      ['delivered'],
            'delivered':  [],
            'cancelled':  [],
        }

        current_status = order.status
        allowed_next = allowed_transitions.get(current_status, [])

        if new_status not in allowed_next:
            # Give a clear message so the frontend knows exactly what's valid
            if allowed_next:
                valid = ', '.join(allowed_next)
                message = f"Cannot move from '{current_status}' to '{new_status}'. Allowed: {valid}."
            else:
                message = f"Order is '{current_status}' and cannot be changed further."
            return JsonResponse({'success': False, 'error': message}, status=400)

        try:
            order.status = new_status
            order.save()

            return JsonResponse({
                'success': True,
                'order': {
                    'id': order.pk,
                    'status': order.status,
                    'updated_at': order.updated_at.isoformat(),
                }
            }, status=200)

        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': 'Error updating order status'}, status=500)

    else:
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


# Stats endpoint for cafeteria dashboard
def cafeteria_stats(request):
    if request.method != 'GET':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)
    
    auth_error = check_role_guard(request, required_role='cafeteria')
    if auth_error:
        return auth_error
    
    try:
        today = timezone.now().date()
        
        # Total orders for this cafeteria
        total_orders = Order.objects.filter(seller=request.user).count()
        
        # Revenue today (only delivered orders)
        revenue_today = Order.objects.filter(
            seller=request.user,
            status='delivered',
            created_at__date=today
        ).aggregate(total=Sum('total_ammount'))['total'] or Decimal('0.00')
        
        # Active menu items count
        menu_items_count = Product.objects.filter(
            seller=request.user,
            seller_type='cafeteria',
            is_available=True
        ).count()
        
        # Pending orders count (pending or processing status)
        pending_orders_count = Order.objects.filter(
            seller=request.user,
            status__in=['pending', 'processing']
        ).count()
        
        return JsonResponse({
            'success': True,
            'stats': {
                'total_orders': total_orders,
                'revenue_today': str(revenue_today),
                'menu_items_count': menu_items_count,
                'pending_orders_count': pending_orders_count,
            }
        }, status=200)
    
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': 'Error retrieving stats'}, status=500)


# Top selling items endpoint for cafeteria dashboard
def cafeteria_top_items(request):
    if request.method != 'GET':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)
    
    auth_error = check_role_guard(request, required_role='cafeteria')
    if auth_error:
        return auth_error
    
    try:
        # Get top 5 items by quantity sold from delivered orders only
        top_items = (
            OrderItem.objects
            .filter(order__seller=request.user, order__status='delivered')
            .values('product__name')
            .annotate(total_sold=Sum('quantity'))
            .order_by('-total_sold')[:5]
        )
        
        data = [
            {'product_name': item['product__name'], 'total_sold': item['total_sold']}
            for item in top_items
        ]
        
        return JsonResponse({
            'success': True,
            'top_items': data
        }, status=200)
    
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': 'Error retrieving top items'}, status=500)