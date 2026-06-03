from django.shortcuts import render
from .models import StudentData
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from shop.utils import check_role_guard
from shop.models import Product, Order, OrderItem, Cart, CartItem
import json












"""STUDENT VENDOR API"""
@csrf_exempt
def get_vendor_products(request):
    auth_error = check_role_guard(request, required_role='student')
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
            return JsonResponse({'success': True, 'products': data}, status=200)

        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': 'Error retrieving data'}, status=500)

    elif request.method == 'POST':
        try:
            # FIX: was json.loads(request.body) — can't mix JSON body with request.FILES
            # Partner must send this as multipart/form-data (FormData in JS)
            # Text fields → request.POST, file → request.FILES
            name = request.POST.get('name')
            price = request.POST.get('price')
            image = request.FILES.get('image')

            if not name or not price:
                return JsonResponse({'success': False, 'error': 'name and price are required'}, status=400)

            product = Product.objects.create(
                seller=request.user,
                name=name,
                price=price,
                image=image,
                seller_type='student_vendor',  # FIX: was 'student' — not a valid choice
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
            }, status=201)

        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': 'Error creating product'}, status=500)

    else:
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)
    
@csrf_exempt
def all_products(request):
    auth_error = check_role_guard(request, required_role='student')
    if auth_error:
        return auth_error

    if request.method == "GET":
        try:
            products = Product.objects.all()
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
            return JsonResponse({'success': True, 'products': data}, status=200)

        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': 'Error retrieving data'}, status=500)

    else:
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def manage_vendor_product(request, product_id):
    auth_error = check_role_guard(request, required_role='student')
    if auth_error:
        return auth_error

    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Product not found'}, status=404)

    if product.seller != request.user:
        return JsonResponse({'success': False, 'error': 'Forbidden'}, status=403)

    if request.method == 'PUT':
        try:
            # FIX: was json.loads(request.body) — same conflict as above
            # Partner sends multipart/form-data here too because of the image
            name = request.POST.get('name')
            price = request.POST.get('price')
            image = request.FILES.get('image')

            if not name or not price:
                return JsonResponse({'success': False, 'error': 'name and price are required'}, status=400)

            product.name = name
            product.price = price
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

    elif request.method == 'PATCH':
        try:
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
                    'is_available': product.is_available,
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


@csrf_exempt
def vendor_orders(request):
    auth_error = check_role_guard(request, required_role='student')
    if auth_error:
        return auth_error

    if request.method == 'GET':
        try:
            orders = Order.objects.filter(seller=request.user).order_by('-created_at')

            # FIX: was json.loads(request.body) — GET requests have no body
            # Status filter comes from the URL query string: ?status=pending
            # request.GET is the query params dict, completely separate from request.body
            status_filter = request.GET.get('status')
            if status_filter:
                orders = orders.filter(status=status_filter)

            # FIX: variable was named 'data' above too — second assignment was silently
            # overwriting the parsed body. Renamed loop list to 'orders_list'
            orders_list = []
            for order in orders:
                buyer_profile = order.buyer.student_data.first()
                buyer_full_name = buyer_profile.full_name if buyer_profile else None

                # FIX: added select_related('product') — without it Django hits the DB
                # once per item just to get item.product.name (N+1 query problem)
                order_items = OrderItem.objects.filter(order=order).select_related('product')
                items_list = []
                for item in order_items:
                    items_list.append({
                        'product_name': item.product.name,
                        'quantity': item.quantity,
                        'price_at_time': str(item.price_at_time),
                    })

                orders_list.append({
                    'id': order.pk,
                    'buyer_full_name': buyer_full_name,
                    'delivery_type': order.delivery_type,
                    'total_amount': str(order.total_ammount),
                    'status': order.status,
                    'created_at': order.created_at.isoformat(),
                    'items': items_list,
                })

            return JsonResponse({'success': True, 'orders': orders_list}, status=200)

        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': 'Error retrieving orders'}, status=500)

    else:
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def vendor_order_status(request, order_id):
    auth_error = check_role_guard(request, required_role='student')
    if auth_error:
        return auth_error

    if request.method == 'PATCH':
        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Order not found'}, status=404)

        if order.seller != request.user:
            return JsonResponse({'success': False, 'error': 'Forbidden'}, status=403)

        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON body'}, status=400)

        new_status = body.get('status')
        if not new_status:
            return JsonResponse({'success': False, 'error': '"status" field is required'}, status=400)

        allowed_transitions = {
            'pending':    ['processing', 'cancelled'],
            'processing': ['ready', 'delivered'],
            'ready':      [],
            'delivered':  [],
            'cancelled':  [],
        }

        current_status = order.status
        allowed_next = allowed_transitions.get(current_status, [])

        if new_status not in allowed_next:
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


"""STUDENT SIDE"""

# FIX: removed @csrf_exempt — _build_cart_data is a helper, not a view
# Decorating it does absolutely nothing, it just looks wrong
def _build_cart_data(cart, request):
    all_items = CartItem.objects.filter(cart=cart).select_related('product')
    cart_items = []
    cart_total = 0

    for item in all_items:
        image_url = request.build_absolute_uri(item.product.image.url) if item.product.image else None
        subtotal = item.product.price * item.quantity
        cart_total += subtotal
        cart_items.append({
            'cart_item_id': item.pk,
            'product_id': item.product.pk,
            'product_name': item.product.name,
            'image_url': image_url,
            'price': str(item.product.price),
            'quantity': item.quantity,
            'subtotal': str(subtotal),
        })

    seller_info = None
    if cart.seller:
        seller_info = {
            'seller_id': cart.seller.pk,
            'seller_type': cart.seller.role,
        }

    return {
        'cart_items': cart_items,
        'cart_total': str(cart_total),
        'seller_info': seller_info,
    }


@csrf_exempt
def manage_student_cart(request, cart_id=None):
    auth_error = check_role_guard(request, required_role='student')
    if auth_error:
        return auth_error

    if request.method == "GET":
        try:
            cart, created = Cart.objects.get_or_create(student=request.user)
            return JsonResponse({'success': True, **_build_cart_data(cart, request)}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': 'An error occurred'}, status=500)

    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            quantity = data.get('quantity', 1)

            try:
                quantity = int(quantity)
                if quantity < 1:
                    return JsonResponse({'success': False, 'error': 'Quantity must be at least 1'}, status=400)
            except (ValueError, TypeError):
                return JsonResponse({'success': False, 'error': 'Invalid quantity'}, status=400)

            try:
                product = Product.objects.get(pk=cart_id)
            except Product.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Product not found'}, status=404)

            if not product.is_available:
                return JsonResponse({'success': False, 'error': 'This item is not currently available'}, status=400)

            cart, created = Cart.objects.get_or_create(student=request.user)

            if cart.seller is not None:
                if product.seller.id != cart.seller.id:
                    locked_seller = cart.seller
                    if locked_seller.role == 'cafeteria':
                        profile = locked_seller.cafeteriadata_set.first()
                        seller_name = profile.buisness_name if profile else 'another seller'
                    else:
                        profile = locked_seller.student_data.first()
                        seller_name = profile.full_name if profile else 'another seller'

                    return JsonResponse({
                        'success': False,
                        'error': f'Your cart already has items from {seller_name}. Clear your cart first to order from a different seller.'
                    }, status=400)
            else:
                cart.seller = product.seller
                cart.save()

            cart_item, item_created = CartItem.objects.get_or_create(cart=cart, product=product)
            if item_created:
                cart_item.quantity = quantity
            else:
                cart_item.quantity += quantity
            cart_item.save()

            return JsonResponse({
                'success': True,
                'message': 'Item added to cart',
                **_build_cart_data(cart, request)
            }, status=200)

        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': 'Something went wrong'}, status=500)

    elif request.method == "PUT":
        try:
            cart_to_be_updated = CartItem.objects.get(pk=cart_id)

            if cart_to_be_updated.cart.student != request.user:
                return JsonResponse({'success': False, 'error': 'Forbidden Request'}, status=403)

            data = json.loads(request.body)
            quantity = data.get('quantity')
            if not quantity and quantity != 0:
                return JsonResponse({'success': False, 'error': 'quantity is required'}, status=400)

            try:
                quantity = int(quantity)
                if quantity < 0:
                    return JsonResponse({'success': False, 'error': 'Quantity cannot be negative'}, status=400)
            except (ValueError, TypeError):
                return JsonResponse({'success': False, 'error': 'Invalid quantity'}, status=400)

            cart = cart_to_be_updated.cart

            if quantity == 0:
                cart_to_be_updated.delete()
                if not CartItem.objects.filter(cart=cart).exists():
                    cart.seller = None
                    cart.save()
                return JsonResponse({'success': True, 'message': 'Item removed from cart', 'cart_items': [], 'cart_total': '0'}, status=200)

            cart_to_be_updated.quantity = quantity
            cart_to_be_updated.save()

            return JsonResponse({'success': True, **_build_cart_data(cart, request)}, status=200)

        except CartItem.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Cart item not found'}, status=404)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': 'Something went wrong'}, status=500)

    elif request.method == "DELETE":
        try:
            if cart_id:
                cart_item = CartItem.objects.get(pk=cart_id)

                if cart_item.cart.student != request.user:
                    return JsonResponse({'success': False, 'error': 'Forbidden Request'}, status=403)

                cart = cart_item.cart
                cart_item.delete()

                if not CartItem.objects.filter(cart=cart).exists():
                    cart.seller = None
                    cart.save()

                return JsonResponse({'success': True, 'message': 'Item removed successfully'}, status=200)
            else:
                cart = Cart.objects.get(student=request.user)
                CartItem.objects.filter(cart=cart).delete()
                cart.seller = None
                cart.save()
                return JsonResponse({'success': True, 'message': 'Cart cleared successfully'}, status=200)

        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': 'Something went wrong'}, status=500)

    else:
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)  # FIX: was success:True