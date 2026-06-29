from django.contrib import admin
from .models import User, Profile, Post, Comment, Announcement, Assignment

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('user_name', 'email', 'role', 'date_joined')
    list_filter = ('role', 'date_joined')
    search_fields = ('user_name', 'email', 'first_name')
    ordering = ('-date_joined',)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('profile_id', 'user', 'bio')
    search_fields = ('user__user_name',)

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('post_id', 'author', 'content_text', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('content_text', 'author__user_name')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('comment_id', 'author', 'post', 'content_text', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('content_text', 'author__user_name')

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'sender', 'created_at')
    list_filter = ('category', 'created_at')
    search_fields = ('title', 'description')

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'due_date', 'created_at')
    list_filter = ('course', 'due_date')
    search_fields = ('title', 'course')