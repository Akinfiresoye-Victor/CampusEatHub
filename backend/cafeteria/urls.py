from django.urls import path
from . import views





urlpatterns = [
    path('get_cafeteria_data/', views.get_cafeteria_data)
]