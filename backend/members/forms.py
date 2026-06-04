from .models import User
from django import forms
from django.contrib.auth import get_user_model
from django.forms import ModelForm
from django.core.exceptions import ValidationError


User=get_user_model()



class StudentSignUpForm(ModelForm):
    full_name=forms.CharField(max_length=20, widget=forms.TextInput(
        attrs={'class':'form-control', 'placeholder': 'e.g Omoyeni Samuel'}))
    matric_number=forms.CharField(max_length=20, widget=forms.TextInput(
        attrs={'class':'form-control', 'placeholder': 'e.g EU240102-4159'}))
    class Meta:
        model=User
        fields=('username', 'email', 'password', 'password2')
    username=forms.CharField(max_length=20, widget=forms.TextInput(
        attrs={'class':'form-control', 'placeholder':'Username'}), label='', help_text='')
    
    password=forms.CharField(max_length=50, widget=forms.PasswordInput(
        attrs={'class': 'form-control', 'placeholder': 'Enter Password'}), help_text='', label='')
    
    password2=forms.CharField(max_length=50, widget=forms.PasswordInput(
        attrs={'class': 'form-control', 'placeholder': 'Confirm Password'}), help_text='', label='')





class CafeteriaSignUpForm(ModelForm):
    business_name=forms.CharField(max_length=50, widget=forms.TextInput(
        attrs={'class':'form-control', 'placeholder': 'e.g Dominos Pizza'}))
    phone_number=forms.CharField(max_length=12, widget=forms.TextInput(
        attrs={'class':'form-control', 'placeholder': 'e.g 08012345678'}))
    owner_name=forms.CharField(max_length=50, widget=forms.TextInput(
        attrs={'class':'form-control', 'placeholder': 'e.g John Doe'}))
    class Meta:
        model=User
        fields=('email', 'password', 'password2',)

    password=forms.CharField(max_length=50, widget=forms.PasswordInput(
        attrs={'class': 'form-control', 'placeholder': 'Enter Password'}), help_text='', label='')
    
    password2=forms.CharField(max_length=50, widget=forms.PasswordInput(
        attrs={'class': 'form-control', 'placeholder': 'Confirm Password'}), help_text='', label='')
    
    email=forms.EmailField(max_length=75, widget=forms.EmailInput(
        attrs={'class':'form-control', 'placeholder': 'Enter Personal Email'}), help_text='', label='')

    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get('email')
        if email:
            self.instance.username = email
        return cleaned_data