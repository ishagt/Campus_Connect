from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
import json
from datetime import datetime
from .models import User, Profile, Post, Comment, Announcement, Assignment

# ============================================
# CORE VIEWS
# ============================================

def login_view(request):
    """
    Displays login/registration page
    """
    if request.user.is_authenticated:
        return redirect('dashboard')
    return render(request, 'login.html')

@login_required
def dashboard_view(request):
    """
    Home Feed/Dashboard
    """
    user = request.user
    posts = Post.objects.all().order_by('-created_at')
    announcements = Announcement.objects.all().order_by('-created_at')[:5]
    
    context = {
        'user': user,
        'posts': posts,
        'announcements': announcements,
    }
    return render(request, 'home.html', context)

@login_required
def profile_view(request):
    """
    Profile Management
    """
    user = request.user
    user_posts = Post.objects.filter(author=user).order_by('-created_at')
    
    context = {
        'user': user,
        'profile': user.profile if hasattr(user, 'profile') else None,
        'posts': user_posts,
    }
    return render(request, 'profile.html', context)

def logout_view(request):
    """
    Logout - Properly clears session
    """
    logout(request)
    request.session.flush()
    return redirect('/')

# ============================================
# AUTHENTICATION API
# ============================================

@csrf_exempt
def register_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('email')
            password = data.get('pass')
            fullname = data.get('name')
            role = data.get('role', 'student')
            
            if not username or not password or not fullname:
                return JsonResponse({
                    'status': 'error',
                    'message': 'All fields are required'
                })
            
            if User.objects.filter(username=username).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'User already exists'
                })
            
            user = User.objects.create_user(
                username=username,
                user_name=username,
                password=password,
                first_name=fullname,
                email=username,
                role=role
            )
            
            Profile.objects.create(user=user, bio='')
            login(request, user)
            
            return JsonResponse({
                'status': 'success',
                'message': 'Account created successfully',
                'user': {
                    'name': user.first_name,
                    'email': user.email,
                    'role': user.role,
                    'username': user.user_name
                }
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'Registration failed: {str(e)}'
            })
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

@csrf_exempt
def login_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('email')
            password = data.get('pass')
            
            user = authenticate(request, username=username, password=password)
            
            if user is not None:
                login(request, user)
                return JsonResponse({
                    'status': 'success',
                    'user': {
                        'name': user.first_name,
                        'email': user.email,
                        'role': user.role,
                        'id': user.id,
                        'username': user.user_name
                    }
                })
            else:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid credentials'
                })
                
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'Login failed: {str(e)}'
            })
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

# ============================================
# PROFILE API - FIXED
# ============================================

@csrf_exempt
@login_required
def update_profile_api(request):
    if request.method == 'POST':
        try:
            # Handle both JSON and form data
            if request.content_type and 'application/json' in request.content_type:
                data = json.loads(request.body)
            else:
                data = request.POST
            
            user = request.user
            # Get or create profile
            profile, created = Profile.objects.get_or_create(user=user)
            
            # Update user fields
            if 'name' in data and data['name']:
                user.first_name = data['name']
                user.save()
            
            if 'department' in data:
                user.department = data['department']
                user.save()
            
            if 'bio' in data:
                profile.bio = data['bio']
                profile.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Profile updated successfully',
                'user': {
                    'name': user.first_name,
                    'department': user.department,
                    'bio': profile.bio
                }
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            })
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request'})

@login_required
def get_profile_api(request):
    """
    Get current user profile data
    """
    try:
        user = request.user
        profile = user.profile if hasattr(user, 'profile') else None
        
        return JsonResponse({
            'status': 'success',
            'user': {
                'name': user.first_name,
                'email': user.email,
                'role': user.role,
                'username': user.user_name,
                'department': user.department or '',
                'bio': profile.bio if profile else ''
            }
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })

# ============================================
# ASSIGNMENT API - FIXED
# ============================================

@csrf_exempt
@login_required
def add_assignment_api(request):
    if request.method == 'POST':
        # Check if user is teacher or admin
        if request.user.role not in ['teacher', 'admin']:
            return JsonResponse({
                'status': 'error',
                'message': 'Only teachers and admins can create assignments'
            }, status=403)
        
        try:
            # Handle JSON data
            if request.content_type and 'application/json' in request.content_type:
                data = json.loads(request.body)
            else:
                data = request.POST
            
            title = data.get('title', '').strip()
            course = data.get('course', '').strip()
            department = data.get('department', '').strip()
            year = data.get('year', '')
            section = data.get('section', '').strip()
            description = data.get('description', '').strip()
            due_date = data.get('due_date', '')
            
            if not title:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Title is required'
                })
            
            # Handle due date
            if due_date:
                try:
                    due_date_obj = datetime.fromisoformat(due_date)
                except:
                    due_date_obj = datetime.now()
            else:
                due_date_obj = datetime.now()
            
            assignment = Assignment.objects.create(
                title=title,
                course=course,
                department=department,
                year=int(year) if year else None,
                section=section,
                description=description,
                due_date=due_date_obj,
                created_by=request.user
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Assignment created successfully',
                'assignment': {
                    'id': assignment.id,
                    'title': assignment.title,
                    'course': assignment.course,
                    'department': assignment.department,
                    'year': assignment.year,
                    'section': assignment.section,
                    'description': assignment.description,
                    'due_date': assignment.due_date.strftime('%Y-%m-%d %H:%M')
                }
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'Error creating assignment: {str(e)}'
            })
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

@login_required
def get_assignments_api(request):
    """
    Get all assignments
    """
    try:
        assignments = Assignment.objects.all().order_by('-created_at')
        assignment_list = []
        for ass in assignments:
            assignment_list.append({
                'id': ass.id,
                'title': ass.title,
                'course': ass.course,
                'department': ass.department,
                'year': ass.year,
                'section': ass.section,
                'description': ass.description,
                'due_date': ass.due_date.strftime('%Y-%m-%d %H:%M'),
                'created_by': ass.created_by.first_name if ass.created_by else 'Teacher'
            })
        
        return JsonResponse({
            'status': 'success',
            'assignments': assignment_list
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error fetching assignments: {str(e)}'
        })

# ============================================
# POSTS API
# ============================================

@csrf_exempt
@login_required
def add_post_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            content = data.get('content', '').strip()
            
            if not content:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Post content cannot be empty'
                })
            
            post = Post.objects.create(
                content_text=content,
                author=request.user
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Post created successfully',
                'post': {
                    'post_id': post.post_id,
                    'content_text': post.content_text,
                    'author': request.user.first_name,
                    'created_at': post.created_at.strftime('%Y-%m-%d %H:%M')
                }
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'Error creating post: {str(e)}'
            })
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request'})

@login_required
def get_posts_api(request):
    if request.method == 'GET':
        try:
            posts = Post.objects.all().order_by('-created_at')
            post_list = []
            for post in posts:
                post_list.append({
                    'post_id': post.post_id,
                    'author': post.author.first_name,
                    'author_username': post.author.user_name,
                    'content_text': post.content_text,
                    'created_at': post.created_at.strftime('%Y-%m-%d %H:%M'),
                    'comments_count': post.comments.count()
                })
            
            return JsonResponse({
                'status': 'success',
                'posts': post_list
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'Error fetching posts: {str(e)}'
            })
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request'})

# ============================================
# ANNOUNCEMENTS API
# ============================================

@csrf_exempt
@login_required
def add_announcement_api(request):
    if request.method == 'POST':
        if request.user.role != 'admin':
            return JsonResponse({
                'status': 'error',
                'message': 'Only admins can create announcements'
            }, status=403)
        
        try:
            data = json.loads(request.body)
            title = data.get('title', '').strip()
            description = data.get('description', '').strip()
            category = data.get('category', 'Announcements')
            sender = data.get('sender', 'Campus Admin')
            
            if not title or not description:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Title and description are required'
                })
            
            announcement = Announcement.objects.create(
                title=title,
                description=description,
                category=category,
                sender=sender,
                created_by=request.user
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Announcement created successfully',
                'announcement': {
                    'id': announcement.id,
                    'title': announcement.title,
                    'description': announcement.description,
                    'category': announcement.category,
                    'sender': announcement.sender,
                    'created_at': announcement.created_at.strftime('%Y-%m-%d %H:%M')
                }
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'Error creating announcement: {str(e)}'
            })
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request'})

@login_required
def get_announcements_api(request):
    if request.method == 'GET':
        try:
            announcements = Announcement.objects.all().order_by('-created_at')
            announcement_list = []
            for ann in announcements:
                announcement_list.append({
                    'id': ann.id,
                    'title': ann.title,
                    'description': ann.description,
                    'category': ann.category,
                    'sender': ann.sender,
                    'created_at': ann.created_at.strftime('%Y-%m-%d %H:%M'),
                    'created_by': ann.created_by.first_name if ann.created_by else 'Admin'
                })
            
            return JsonResponse({
                'status': 'success',
                'announcements': announcement_list
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'Error fetching announcements: {str(e)}'
            })
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request'})