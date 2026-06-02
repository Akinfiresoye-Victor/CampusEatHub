from django.contrib import admin
from members.models import User
from student.models import StudentData
from cafeteria.models import CafeteriaData



# Register your models here.
admin.site.register([User, StudentData, CafeteriaData])