from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    USER_TYPE_CHOICES=(
        ('student', 'student'),
        ('cafeteria', 'cafeteria')
    )
    role=models.CharField(max_length=15, choices=USER_TYPE_CHOICES, default='student')
    email=models.EmailField(unique=True, blank=True, null=True)
    busyness_status = models.CharField(max_length=10, default='quiet')

    def __str__(self):
        return f'{self.username} - {self.role}'