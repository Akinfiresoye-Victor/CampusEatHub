from django.urls import path
from . import views




urlpatterns = [
    path('login_user/', views.login_user),
    path('logout_user/', views.logout_user),
    path('register_student/', views.register_student),
    path('register_cafeteria/', views.register_cafeteria),
    path('me/', views.me, name='me'),
]
