from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm
from typing import cast
from django.contrib.auth import get_user_model
User = get_user_model()
import json
from django.views.decorators.csrf import csrf_exempt
from .forms import StudentSignUpForm, CafeteriaSignUpForm
from student.models import StudentData
from cafeteria.models import CafeteriaData  


@csrf_exempt
def login_user(request):
    if request.user.is_authenticated:
        return JsonResponse({'redirect': 'landing'})
    
    try:
        if request.method == "POST":
            data = json.loads(request.body)
            
            # 1. Grab whatever the user typed in the identifier box (could be username OR email)
            login_identifier = data.get('username')  
            password = data.get('password')
            
            # 2. Check if they typed an email address
            if "@" in login_identifier:
                try:
                    # Look up the user by email, and get their actual username string
                    user_obj = User.objects.get(email=login_identifier)
                    username_to_auth = user_obj.username
                except User.DoesNotExist:
                    # If the email isn't in the database, pass the raw input 
                    # so authenticate() handles the failure gracefully
                    username_to_auth = login_identifier
            else:
                # If there's no "@", assume they typed a standard username
                username_to_auth = login_identifier
            
            # 3. Authenticate using the resolved username string
            user = authenticate(request, username=username_to_auth, password=password)
            
            if user is not None:
                login(request, user)
                
                # Use user.role instead of request.user.role here (it's safer immediately after login)
                if request.user.role == 'student':
                    return JsonResponse({'success': True, 'message': f'Welcome back, {request.user.username}!', 'redirect': 'student:dashboard'})
                elif request.user.role == 'cafeteria':
                    #TODO adjust the message
                    return JsonResponse({'success': True, 'message': f'Welcome back, {request.user.email}!', 'redirect': 'caf:dashboard'})
                else:
                    return JsonResponse({'success': True, 'message': f'Welcome back, {user.username}!', 'redirect': 'error'})
            else:
                return JsonResponse({'success': False, 'message': 'Invalid username/email or password. Please try again.'})
        else:
            return JsonResponse({'form_fields': ['username', 'password']})
        
    except Exception as e:
        # It's always helpful to print the actual error to your console while building!
        print(f"Login error: {e}")
        return JsonResponse({'error': "Something went wrong"})



@csrf_exempt
def logout_user(request):
    if request.user.is_authenticated:
        logout(request)
        return JsonResponse({'success': True, 'message': 'You have successfully logged out. See you soon!'})
    else:
        return JsonResponse({'success': False, 'message': 'Please sign in to perform that action.'})



@csrf_exempt
def register_student(request):
    if request.user.is_authenticated:
        return JsonResponse({'redirect': 'landing'})
    try:
        if request.method == 'POST':
            data = json.loads(request.body)
            form = StudentSignUpForm(data)
            if form.is_valid():
                cleaned=form.cleaned_data
                user = form.save(commit=False)
                user.role='student'
                user.save()
                StudentData.objects.create(
                    student=user,
                    full_name=cleaned['full_name'],
                    matric_number=cleaned['matric_number'],
                )
                

                login(request, user)
                return JsonResponse({'success': True, 'role':'student', 'username':request.user.username})
            else:
                return JsonResponse({'success': False, 'errors': form.errors})
        else:
            return JsonResponse({'form_fields': ['username', 'email', 'password', 'password2']})
    except Exception as e:
        print(e)
        return JsonResponse({'error': 'Something went wrong'})
    





@csrf_exempt
def register_cafeteria(request):
    if request.user.is_authenticated:
        return JsonResponse({'redirect': 'landing'})
    try:
        if request.method == 'POST':
            data = json.loads(request.body)
            form = CafeteriaSignUpForm(data)
            if form.is_valid():
                cleaned=form.cleaned_data
                user = form.save(commit=False)
                user.role='cafeteria'
                user.save()
                buisness_name=cleaned['buisness_name']
                CafeteriaData.objects.create(
                    cafeteria=user,
                    buisness_name=buisness_name,
                    owner_name=cleaned['owner_name'],
                    phone_number=cleaned['phone_number'],
                )
                login(request, user)
                return JsonResponse({'success': True, 'role': 'cafeteria', 'username': buisness_name })
            else:
                return JsonResponse({'success': False, 'errors': form.errors})
        else:
            return JsonResponse({'form_fields': ['username', 'email', 'password', 'password2']})
    except Exception as e:
        print(e)
        return JsonResponse({'error': 'Something went wrong'})