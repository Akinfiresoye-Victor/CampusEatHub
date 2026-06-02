from django.contrib import admin
from django.urls import path, include, re_path
from django.conf.urls.static import static
from django.conf import settings
from django.views.generic import TemplateView

urlpatterns = [
        path("admin/", admin.site.urls),
        path('members/', include('django.contrib.auth.urls')),
        # API endpoints with /api/ prefix so React can call them cleanly
        path('api/auth/', include('members.urls')),
        path('api/student/', include('student.urls')),
        path('api/cafeteria/', include('cafeteria.urls')),
        path('api/', include('shop.urls')),
        path('api/admin/', include('admin_panel.urls')),
    ]  + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)




admin.site.site_title="Developers Admin Page"
admin.site.site_header="MegaBiteAdministration Page"
admin.site.index_title= "Welcome To THe admin Area......"
