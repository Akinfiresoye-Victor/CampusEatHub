from django.urls import path
from . import views
from shop.ai_features import order_analytics


urlpatterns = [
    path('menu/', views.get_cafeteria_menu),
    path('menu/<int:product_id>/', views.manage_cafeteria_product),
    path('menu/<int:product_id>/toggle/', views.manage_cafeteria_product),
    path('status/', views.cafeteria_status),
    path('orders/', views.cafeteria_orders),
    path('orders/<int:order_id>/status/', views.cafeteria_order_status),
    path('stats/', views.cafeteria_stats),
    path('top-items/', views.cafeteria_top_items),
    path('ai/assistant/', order_analytics)
]

