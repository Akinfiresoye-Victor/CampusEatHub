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
import uuid


@csrf_exempt
def login_user(request):
    if request.user.is_authenticated:
        return JsonResponse({'success': True, 'message': 'Youre already logged in '}, status=200)
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

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
                    return JsonResponse({'success': True, 'message': f'Welcome back, {request.user.username}!'}, status=200)
                elif request.user.role == 'cafeteria':
                    #TODO adjust the message
                    return JsonResponse({'success': True, 'message': f'Welcome back, {request.user.email}!'}, status=200)
                else:
                    return JsonResponse({'success': True, 'message': f'Welcome back, {user.username}!'})
            else:
                print('Wrong password')
                return JsonResponse({'success': False, 'error': 'Invalid username/email or password. Please try again.'}, status=400)
        else:
            return JsonResponse({'success': True,'form_fields': ['username', 'password']}, status=200)
        
    except Exception as e:
        # It's always helpful to print the actual error to your console while building!
        print(f"Login error: {e}")
        return JsonResponse({'success':False,'error': "Something went wrong"}, status=500)



@csrf_exempt
def logout_user(request):
    if request.user.is_authenticated:
        logout(request)
        return JsonResponse({'success': True, 'message': 'You have successfully logged out. See you soon!'}, status=200)
    else:
        return JsonResponse({'success': False, 'message': 'Please sign in to perform that action.'}, status=401)



@csrf_exempt
def register_student(request):
    if request.user.is_authenticated:
        return JsonResponse({'success': True, 'message': 'Youre already loggid in '}, status=200)
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

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
                
                print('registered')
                login(request, user)
                return JsonResponse({'success': True, 'role':'student', 'username':request.user.username}, status=200)
            else:
                print('Form Errors' ,form.errors)
                return JsonResponse({'success': False, 'error': form.errors}, status=400)
        else:
            return JsonResponse({'success': True,'form_fields': ['username', 'email', 'password', 'password2']}, status=200)
    except Exception as e:
        print(e)
        return JsonResponse({'success':False,'error': 'Something went wrong'}, status=500)
    





@csrf_exempt
def register_cafeteria(request):
    if request.user.is_authenticated:
        return JsonResponse({'success': True, 'message': 'Youre already loggid in '}, status=200)
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    try:
        if request.method == 'POST':
            data = json.loads(request.body)
            form = CafeteriaSignUpForm(data)
            if form.is_valid():
                cleaned=form.cleaned_data
                user = form.save(commit=False)
                user.username=uuid.uuid4()
                user.role='cafeteria'
                user.save()
                buisness_name=cleaned['business_name']
                CafeteriaData.objects.create(
                    cafeteria=user,
                    buisness_name=buisness_name,
                    owner_name=cleaned['owner_name'],
                    phone_number=cleaned['phone_number'],
                )
                print('registered')
                login(request, user)
                return JsonResponse({'success': True, 'role': 'cafeteria', 'username': buisness_name }, status=200)
            else:
                print(form.errors)
                return JsonResponse({'success': False, 'error': form.errors}, status=400)
        else:
            return JsonResponse({'success': True,'form_fields': ['username', 'email', 'password', 'password2']}, status=200)
    except Exception as e:
        print(e)
        return JsonResponse({'success':False,'error': 'Something went wrong'}, status=500)


def me(request):
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "Method not allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "error": "Not logged in"}, status=401)

    user = request.user

    # Base data every role gets
    data = {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "email": user.email,
    }

    if user.role == "student":
        try:
            profile = StudentData.objects.get(student=user)
            data["full_name"] = profile.full_name
            data["matric_number"] = profile.matric_number
            data["brand_name"] = profile.brand_name
            data["pic_url"] = request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None
        except StudentData.DoesNotExist:
            data["full_name"] = None
            data["matric_number"] = None
            data["brand_name"] = None
            data["pic_url"] = None

    elif user.role == "cafeteria":
        try:
            profile = CafeteriaData.objects.get(cafeteria=user)
            data["cafeteria_name"] = profile.buisness_name
            data["owner_name"] = profile.owner_name
            data["phone_number"] = profile.phone_number
            data["pic_url"] = request.build_absolute_uri(profile.company_logo.url) if profile.company_logo else None
        except CafeteriaData.DoesNotExist:
            data["cafeteria_name"] = None
            data["owner_name"] = None
            data["phone_number"] = None
            data["pic_url"] = None

    return JsonResponse({"success": True, "data": data}, status=200)
