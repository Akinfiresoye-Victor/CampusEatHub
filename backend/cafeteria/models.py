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

