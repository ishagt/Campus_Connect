from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    """
    Custom User model matching report specifications
    Table: User
    Fields: user_id (auto), user_name, password, role, email, date_joined
    """
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    )
    
    # Report fields
    user_name = models.CharField(max_length=150, unique=True)  # matches report
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    email = models.EmailField(unique=True)
    date_joined = models.DateTimeField(default=timezone.now)
    
    # Additional fields from report
    bio = models.TextField(blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    
    # Fix reverse accessor conflicts
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='campus_connect_user_groups',
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='campus_connect_user_permissions',
        blank=True,
    )
    
    def __str__(self):
        return self.user_name

class Profile(models.Model):
    """
    Profile table matching report
    Table: Profile
    Fields: profile_id (PK), bio, user_id (FK)
    """
    profile_id = models.AutoField(primary_key=True)  # Explicit profile_id per report
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.user.user_name}'s Profile"

class Post(models.Model):
    """
    Post table matching report
    Table: Post
    Fields: post_id (PK), content_text, author_id (FK)
    """
    post_id = models.AutoField(primary_key=True)  # Explicit post_id per report
    content_text = models.TextField()  # named as per report
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Post by {self.author.user_name}"

class Comment(models.Model):
    """
    Comment table matching report
    Table: Comment
    Fields: comment_id (PK), content_text, post_id (FK), author_id (FK)
    """
    comment_id = models.AutoField(primary_key=True)  # Explicit comment_id per report
    content_text = models.TextField()  # named as per report
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Comment by {self.author.user_name}"

class Announcement(models.Model):
    """
    Announcement model for campus updates
    """
    CATEGORY_CHOICES = (
        ('Announcements', 'Announcement'),
        ('Events', 'Event'),
    )
    title = models.CharField(max_length=200)
    sender = models.CharField(max_length=100, default='Campus Admin')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='Announcements')
    description = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='announcements', null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title

class Assignment(models.Model):
    title = models.CharField(max_length=200)
    course = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)  # NEW
    year = models.IntegerField(blank=True, null=True)  # NEW
    section = models.CharField(max_length=10, blank=True, null=True)  # NEW
    description = models.TextField(blank=True, null=True)
    due_date = models.DateTimeField()
    file = models.FileField(upload_to='assignments/', blank=True, null=True)  # NEW
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignments', null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title