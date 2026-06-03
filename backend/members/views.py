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
from shop.utils import check_role_guard


@csrf_exempt
def login_user(request):
    if request.user.is_authenticated:
        return JsonResponse({'success': True, 'message': 'You are already logged in'}, status=200)

    if request.method != "POST":
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)

        # Accept either 'username' or 'email' as the key from the frontend
        # Cafeteria users only have email, so the frontend might send 'email' instead of 'username'
        login_identifier = data.get('username') or data.get('email')
        password = data.get('password')

        # Validate both fields exist before doing anything else
        if not login_identifier:
            return JsonResponse({'success': False, 'error': 'Username or email is required'}, status=400)
        if not password:
            return JsonResponse({'success': False, 'error': 'Password is required'}, status=400)

        # Resolve the identifier to a username string that authenticate() can use
        if "@" in login_identifier:
            try:
                user_obj = User.objects.get(email=login_identifier)
                username_to_auth = user_obj.username
            except User.DoesNotExist:
                # Email not found — let authenticate() fail gracefully with wrong credentials
                return JsonResponse({'success': False, 'error': 'Invalid email or password'}, status=400)
        else:
            username_to_auth = login_identifier

        user = authenticate(request, username=username_to_auth, password=password)

        if user is not None:
            login(request, user)

            
            if request.user.role == 'student':
                return JsonResponse({
                    'success': True,
                    'role': request.user.role,
                    'message': f'Welcome back, {user.username}!'
                }, status=200)
            elif request.user.role == 'cafeteria':
                return JsonResponse({
                    'success': True,
                    'role': request.user.role,
                    'message': f'Welcome back, {user.email}!'
                }, status=200)
            else:
                return JsonResponse({
                    'success': True,
                    'role': request.user.role,
                    'message': f'Welcome back, {user.username}!'
                }, status=200)
        else:
            return JsonResponse({
                'success': False,
                'error': 'Invalid username/email or password'
            }, status=400)

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON body'}, status=400)
    except Exception as e:
        print(f"Login error: {e}")
        return JsonResponse({'success': False, 'error': 'Something went wrong'}, status=500)


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
                request.user.role='student'
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
                request.user.role='cafeteria'
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

    auth_error = check_role_guard(request)  # No required_role — just checks if logged in
    if auth_error:
        return auth_error

    user = request.user

    data = {
        "id": user.id,
        "username": user.username,
        "role": request.user.role,
        "email": user.email,
    }

    if request.user.role == "student":
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

    elif request.user.role == "cafeteria":
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