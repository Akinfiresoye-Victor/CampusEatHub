from django.db import models
from members.models import User
from django.utils import timezone
# Create your models here.




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




class StudentData(models.Model):
    student=models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_data')
    full_name= models.CharField(max_length=50, blank=False, null=False)
    matric_number=models.CharField(max_length=13, blank=False, null=False)
    brand_name=models.CharField(max_length=50, blank=True, null=True, default=None)
    profile_picture=models.ImageField(upload_to='profile/',default=None, null=False, blank=False)
    def __str__(self):
        return f'{self.full_name} - {self.matric_number}'



class StudentProduct(models.Model):
    student=models.ForeignKey(StudentData, on_delete=models.CASCADE, related_name='students_product')
    product_name=models.CharField(max_length=50, blank=False, null=False)
    price=models.DecimalField(max_digits=15, blank=False, null=False, decimal_places=2)
    image=models.ImageField(blank=False, null=False)
    is_available=models.BooleanField(default=True)
    created_at=models.DateTimeField(default=timezone.now)
    def __str__(self):
        return f'{self.student.full_name} - {self.product_name}'



class Cart(models.Model):
    student=models.OneToOneField(StudentData, on_delete=models.CASCADE, related_name='buyer')
    seller=models.ForeignKey(User, on_delete=models.CASCADE, related_name='seller')
    updated_at=models.DateTimeField(default=timezone.now)


class CartItems(models.Model):
    cart= models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='my_cart')
    product=models.ForeignKey(StudentProduct, on_delete=models.CASCADE, related_name='my_product')
    quantity=models.PositiveIntegerField(default=1, blank=False, null=False)


class Order(models.Model):
    buyer=models.ForeignKey(User, on_delete=models.CASCADE, related_name='buyer_order')
    seller=models.ForeignKey(User, on_delete=models.CASCADE, related_name='seller_order')
    total_amount=models.DecimalField(max_digits=15, decimal_places=2, blank=False, null=False)
    delivery_type=models.CharField(choices=DELIVERY_TYPE, default='pickup', blank=False, null=False)
    delivery_fee=models.DecimalField(max_digits=5, decimal_places=2, blank=False, null=False)
    status=models.CharField(choices=PRODUCT_STATUS, default='pending', blank=False, null=False)
    created_at=models.DateTimeField(default=timezone.now)
    updated_at=models.DateTimeField(default=timezone.now)

class OrderItem(models.Model):
    order=models.ForeignKey(Order, on_delete=models.CASCADE)
    product=models.ForeignKey(StudentProduct, on_delete=models.CASCADE)
    quantity=models.PositiveIntegerField(default=1, blank=False, null=False)
    price_at_time=models.DecimalField(max_digits=15, decimal_places=2,blank=False, null=False)
    
