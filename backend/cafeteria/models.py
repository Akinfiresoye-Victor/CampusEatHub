from django.db import models
from members.models import User
from django.utils import timezone
# Create your models here.


class CafeteriaData(models.Model):
    cafeteria=models.ForeignKey(User, on_delete=models.CASCADE)
    buisness_name=models.CharField(max_length=60, blank=False, null=False)
    owner_name=models.CharField(max_length=30, blank=False, null=False)
    phone_number=models.CharField(max_length=12,blank=False, null=False)
    company_logo=models.ImageField(upload_to='logos/',default=None, blank=True, null=True)
    def __str__(self):
        return f'{self.owner_name} - {self.buisness_name}'


class CafeteriaProduct(models.Model):
    cafeteria=models.ForeignKey(CafeteriaData, on_delete=models.CASCADE)
    product=models.CharField(max_length=50, blank=False, null=False)
    is_available=models.BooleanField(default=True)
    price=models.DecimalField(max_digits=15, blank=False, null=False, decimal_places=2)
    image=models.ImageField(blank=False, null=False)
    created_at=models.DateTimeField(default=timezone.now)
    def __str__(self):
        return f'{self.product} - {self.cafeteria.buisness_name}'
