from django.db import models
from members.models import User
# Create your models here.



class StudentData(models.Model):
    student=models.ForeignKey(User, on_delete=models.CASCADE)
    full_name= models.CharField(max_length=50, blank=False, null=False)
    matric_number=models.CharField(max_length=12, blank=False, null=False)


