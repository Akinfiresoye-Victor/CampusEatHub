from django.db import models
from members.models import User
# Create your models here.


class CafeteriaData(models.Model):
    cafeteria=models.ForeignKey(User, on_delete=models.CASCADE)
    buisness_name=models.CharField(max_length=60, blank=False, null=False)
    owner_name=models.CharField(max_length=30, blank=False, null=False)
    phone_number=models.CharField(max_length=12,blank=False, null=False)


