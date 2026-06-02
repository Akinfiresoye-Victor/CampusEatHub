from django.urls import path
from . import views





urlpatterns = [
    path('products/', views.get_all_products),
    path('products/<int:product_id>/', views.get_single_product),
    path('cafeterias/', views.get_all_cafeterias),
    path('cafeterias/<int:caf_id>/menu/', views.get_cafeteria),

]