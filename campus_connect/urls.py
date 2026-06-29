from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    # CORE VIEWS
    path('', views.login_view, name='home'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('profile/', views.profile_view, name='profile'),
    path('logout/', views.logout_view, name='logout'),
    
    # AUTHENTICATION API
    path('api/register/', views.register_api, name='register_api'),
    path('api/login/', views.login_api, name='login_api'),
    
    # PROFILE API
    path('api/update-profile/', views.update_profile_api, name='update_profile'),
    path('api/get-profile/', views.get_profile_api, name='get_profile'),
    
    # POSTS API
    path('api/posts/', views.get_posts_api, name='get_posts'),
    path('api/add-post/', views.add_post_api, name='add_post'),
    
    # ASSIGNMENTS API
    path('api/assignments/', views.get_assignments_api, name='get_assignments'),
    path('api/add-assignment/', views.add_assignment_api, name='add_assignment'),
    
    # ANNOUNCEMENTS API
    path('api/announcements/', views.get_announcements_api, name='get_announcements'),
    path('api/add-announcement/', views.add_announcement_api, name='add_announcement'),
]