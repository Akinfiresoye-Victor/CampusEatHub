from django.db import models
from django.conf import settings
from cafeteria.models import CafeteriaData
from student.models import StudentData





DELIVERY_TYPE=[
    ('pickup', 'Pickup'),
    ('delivery', 'Delivery')
]


PRODUCT_STATUS=[
    ('pending', 'Pending'),
    ('processing', 'Processing'),
    ('ready', 'Ready'),
    ('delivered', 'Delivered'),
    ('cancelled', 'Cancelled')
]

SELLER_TYPE=[
    ('cafeteria', 'cafeteria'),
    ('student_vendor', 'student_vendor'),
]


class Product(models.Model):
    seller = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    name=models.CharField(max_length=50, null=False, blank=False)
    price=models.DecimalField(max_digits=10, decimal_places=2)
    image= models.ImageField(upload_to='products/', blank=True, null=True)
    is_available=models.BooleanField(default=True)
    seller_type=models.CharField(choices=SELLER_TYPE, default='student_vendor', null=False, blank=False)
    created_at=models.DateField(auto_now_add=True)


class Cart(models.Model):
    student=models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_cart')
    seller=models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name='seller_in_question')
    updated_at=models.DateTimeField(auto_now=True)


class CartItem(models.Model):
    cart=models.ForeignKey(Cart, on_delete=models.CASCADE)
    product=models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity=models.PositiveIntegerField(default=1)



class Order(models.Model):
    buyer=models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders_as_buyers')
    seller=models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders_as_seller')
    total_ammount=models.DecimalField(max_digits=10, decimal_places=2)
    delivery_type=models.CharField(choices=DELIVERY_TYPE, blank=False, null=False)
    delivery_fee=models.DecimalField(max_digits=10, decimal_places=2)
    status=models.CharField(choices=PRODUCT_STATUS, default='pending')
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)


class OrderItem(models.Model):
    order=models.ForeignKey(Order, on_delete=models.CASCADE)
    product=models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity=models.PositiveIntegerField(default=1)
    price_at_time=models.DecimalField(max_digits=10, decimal_places=2)

