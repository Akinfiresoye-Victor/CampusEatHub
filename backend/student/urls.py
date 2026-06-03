from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.get_vendor_products),                       # GET, POST
    path('my_products/', views.all_products),
    path('products/<int:product_id>/', views.manage_vendor_product),    # PUT, PATCH, DELETE
    path('orders/', views.vendor_orders),                               # GET
    path('orders/<int:order_id>/status/', views.vendor_order_status),   # PATCH
    path('cart/', views.manage_student_cart),                           # GET, POST, DELETE (clear)
    path('cart/<int:cart_id>/', views.manage_student_cart),             # PUT, DELETE (single item)
]