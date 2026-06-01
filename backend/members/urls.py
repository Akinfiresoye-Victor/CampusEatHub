from django.urls import path
from . import views




urlpatterns = [
    path('login_user/', views.login_user, name='login'),
    path('logout_user/', views.logout_user, name='logout'),
    path('register_student/', views.register_student, name='register-student'),
    path('register_cafeteria/', views.register_cafeteria, name='register-cafeteria'),
]
