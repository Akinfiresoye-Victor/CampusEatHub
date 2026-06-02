from django.contrib import admin
from members.models import User
from student.models import StudentData
from cafeteria.models import CafeteriaData
from shop.models import Product, Order, OrderItem, Cart, CartItem


# Register your models here.
admin.site.register([User, StudentData, CafeteriaData,Product, Order, OrderItem, Cart, CartItem ])