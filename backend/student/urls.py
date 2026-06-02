from django.urls import path
from . import views





urlpatterns = [
    path('get_student_data/', views.get_student_data)
]
