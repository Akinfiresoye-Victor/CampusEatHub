from django.shortcuts import render
from .models import CafeteriaData
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from shop.utils import check_role_guard
