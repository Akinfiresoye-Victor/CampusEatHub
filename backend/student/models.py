from django.db import models
from members.models import User
from django.utils import timezone
# Create your models here.








class StudentData(models.Model):
    student=models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_data')
    full_name= models.CharField(max_length=50, blank=False, null=False)
    matric_number=models.CharField(max_length=13, blank=False, null=False)
    brand_name=models.CharField(max_length=50, blank=True, null=True, default=None)
    profile_picture=models.ImageField(upload_to='profile/',default=None, null=False, blank=False)
    def __str__(self):
        return f'{self.full_name} - {self.matric_number}'
