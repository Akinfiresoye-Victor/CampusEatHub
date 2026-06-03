from django.urls import path
from . import views
from shop.ai_features import meal_budget_recommendation



urlpatterns = [
    path('vendor/menu/',                        views.get_vendor_products),
    path('vendor/menu/<int:product_id>/',       views.manage_vendor_product),
    path('vendor/orders/',                      views.vendor_orders),
    path('vendor/orders/<int:order_id>/status/', views.vendor_order_status),
    path('products/',                           views.all_products),
    path('cart/',                               views.manage_student_cart),
    path('cart/<int:cart_id>/',                 views.manage_student_cart),
    path('orders/checkout/',                    views.student_checkout),
    path('orders/spending/',                    views.student_spending),
    path('orders/',                             views.student_orders_list),
    path('orders/<int:order_id>/',              views.student_order_detail),
    path('ai/meal_recommender/', meal_budget_recommendation)
]