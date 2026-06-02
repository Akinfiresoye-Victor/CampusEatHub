from django.urls import path
from . import views





urlpatterns = [
    path('cafeteria/menu/', views.get_cafeteria_menu),
    path('cafeteria/menu/<int:product_id>/', views.manage_cafeteria_product),
    path('cafeteria/menu/<int:product_id>/toggle/', views.manage_cafeteria_product),
    path('orders/', views.cafeteria_orders),
    path('orders/<int:order_id>/status/', views.cafeteria_order_status),
]