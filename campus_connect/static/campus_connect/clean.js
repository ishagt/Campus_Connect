// ============================================
// CAMPUS CONNECT - MAIN JAVASCRIPT
// Matching Report Specifications
// ============================================

// Store posts from server
let posts = [];
let tasks = JSON.parse(localStorage.getItem('ncit_perfect_tasks')) || [
    { title: 'Linear Algebra Midterm Study', course: 'MATH 220', desc: 'Review chapters 4-7.', date: 'Tomorrow' }
];

// ============================================
// CSRF TOKEN HELPER
// ============================================

function getCsrfToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, 'csrftoken'.length + 1) === ('csrftoken=')) {
                cookieValue = decodeURIComponent(cookie.substring('csrftoken'.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    const userRole = user ? user.role : "student";

    // Show/hide teacher/admin buttons
    if (userRole !== 'teacher' && userRole !== 'admin') {
        const btn = document.getElementById('teacherBtnSlot');
        if(btn) btn.style.display = 'none';
        const annBtn = document.getElementById('announcementTeacherBtnSlot');
        if(annBtn && userRole !== 'admin') annBtn.style.display = 'none';
    } else {
        const annBtn = document.getElementById('announcementTeacherBtnSlot');
        if(annBtn && userRole === 'admin') annBtn.style.display = 'block';
    }

    // Fetch posts from server
    fetchPostsFromServer();
    renderTasks();
    fetchAnnouncementsFromServer();
}

// ============================================
// POSTS - FEED (Matching Report: Home Feed)
// ============================================

function fetchPostsFromServer() {
    fetch('/api/posts/')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                posts = data.posts;
                renderFeed();
            } else {
                console.error('Error fetching posts:', data.message);
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            // Load from localStorage as fallback
            const localPosts = JSON.parse(localStorage.getItem('campus_posts')) || [];
            posts = localPosts;
            renderFeed();
        });
}

function renderFeed() {
    const feedContainer = document.getElementById('feedList');
    if (!feedContainer) return;

    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};

    if (!posts || posts.length === 0) {
        feedContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #94a3b8;">
                <i class="fas fa-newspaper" style="font-size: 48px; margin-bottom: 15px;"></i>
                <p>No posts yet. Be the first to share something!</p>
            </div>
        `;
        return;
    }

    feedContainer.innerHTML = posts.map((post, index) => {
        const isAuthor = post.author_email && post.author_email === currentUser.email;
        const isAdmin = currentUser.role === 'admin';

        const deleteButtonHtml = (isAuthor || isAdmin)
            ? `<button class="delete-announcement-btn" onclick="deletePost(${post.post_id})" style="position: absolute; top: 16px; right: 16px;">
                   <i class="far fa-trash-can"></i> Delete
               </button>`
            : '';

        return `
            <div class="feed-card" style="position: relative; margin-bottom: 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                ${deleteButtonHtml}
                <div class="feed-header" style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
                    <div class="user-avatar-small" style="background: #e0f2fe; color: #0369a1; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                        ${post.author ? post.author.charAt(0) : 'U'}
                    </div>
                    <div class="feed-user-info">
                        <h4 style="margin: 0; font-size: 14px; color: #1e293b;">${post.author} <span style="font-size: 12px; color: #64748b; font-weight: 400;">@${post.author_username || 'user'} • ${post.created_at}</span></h4>
                    </div>
                </div>
                <div class="feed-content" style="font-size: 14px; color: #334155; line-height: 1.5; margin-bottom: 12px;">${post.content_text}</div>
                
                <div class="feed-actions" style="display: flex; gap: 16px; font-size: 13px; color: #64748b;">
                    <span onclick="toggleLike(${index})" style="cursor:pointer; display: flex; align-items: center; gap: 4px;">
                        <i class="far fa-heart"></i> Like (${post.likes || 0})
                    </span>
                    <span onclick="toggleCommentBox(${index})" style="cursor:pointer; display: flex; align-items: center; gap: 4px;">
                        <i class="far fa-comment"></i> Comment (${post.comments_count || 0})
                    </span>
                </div>

                ${post.showComments ? `
                    <div class="comment-section" style="margin-top: 12px;">
                        <input type="text" class="comment-input-${index}" placeholder="Write a comment..." onkeydown="handleComment(event, ${index})" style="width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px;">
                    </div>
                ` : ''}

                ${post.comments && post.comments.length ? `
                    <div class="comment-display-area" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9;">
                        ${post.showAllComments ? 
                            post.comments.map(c => `<div class="comment-item" style="font-size: 13px; margin-bottom: 4px;"><b>${c.author}:</b> ${c.content_text}</div>`).join('') 
                            : `<div class="comment-preview" style="font-size: 13px; margin-bottom: 4px;"><b>${post.comments[post.comments.length - 1].author}:</b> ${post.comments[post.comments.length - 1].content_text}</div>`
                        }
                        
                        <small onclick="fetchComments(${post.post_id}, ${index})" style="cursor:pointer; color: #0369a1; font-weight: 600; display: inline-block; margin-top: 4px;">
                            ${post.showAllComments ? 'Hide comments' : `View all ${post.comments.length} comments`}
                        </small>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// ============================================
// COMMENTS (Matching Report: Comment on Post)
// ============================================

function fetchComments(postId, index) {
    fetch(`/api/comments/${postId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                posts[index].comments = data.comments;
                posts[index].showAllComments = !posts[index].showAllComments;
                renderFeed();
            }
        });
}

function handleComment(event, index) {
    if (event.key === 'Enter') {
        const input = document.querySelector(`.comment-input-${index}`);
        const commentText = input.value.trim();
        if (commentText !== "") {
            const postId = posts[index].post_id;
            
            fetch(`/api/add-comment/${postId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ content: commentText })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    input.value = '';
                    fetchPostsFromServer(); // Refresh feed
                } else {
                    alert('Error: ' + data.message);
                }
            });
        }
    }
}

function toggleCommentBox(index) {
    posts[index].showComments = !posts[index].showComments;
    renderFeed();
}

function toggleLike(index) {
    // This is a simplified like - in production, you'd use a like API
    const post = posts[index];
    if (typeof post.likes !== 'number') post.likes = 0;
    post.likes += 1;
    localStorage.setItem('campus_posts', JSON.stringify(posts));
    renderFeed();
}

// ============================================
// CREATE POST (Matching Report: Create Post)
// ============================================

function addNewPost() {
    const text = document.getElementById('postInput').value.trim();
    if (!text) {
        alert("Please write something before posting.");
        return;
    }

    fetch('/api/add-post/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({ content: text })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            document.getElementById('postInput').value = '';
            fetchPostsFromServer();
            showNotification('Post published successfully!');
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error posting:', error);
        alert('Failed to publish post. Please try again.');
    });
}

// ============================================
// DELETE POST (Matching Report: Admin Actions)
// ============================================

function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    fetch(`/api/delete-post/${postId}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCsrfToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            fetchPostsFromServer();
            showNotification('Post deleted successfully!');
        } else {
            alert('Error: ' + data.message);
        }
    });
}

// ============================================
// ASSIGNMENTS
// ============================================

function renderTasks() {
    const container = document.getElementById('assignmentList');
    if(!container) return;
    container.innerHTML = tasks.map(task => `
        <div class="assignment-card">
            <div class="status-dot"></div>
            <div class="card-info">
                <h3>${task.title}</h3>
                <div class="card-meta"><span>${task.course}</span> <span class="badge-high">HIGH</span></div>
                <p class="card-desc">${task.desc}</p>
                <div class="card-time"><i class="far fa-clock"></i> ${task.date}</div>
            </div>
        </div>
    `).join('');
}

function openModal() { document.getElementById('modalOverlay').style.display = 'flex'; }
function closeModal() { document.getElementById('modalOverlay').style.display = 'none'; }

function saveTask() {
    const title = document.getElementById('taskTitle').value;
    const course = document.getElementById('taskCourse').value;
    const desc = document.getElementById('taskDesc').value;
    if(!title || !course) return alert("Title and Course are required");
    tasks.unshift({ title, course, desc, date: 'May 15' });
    localStorage.setItem('ncit_perfect_tasks', JSON.stringify(tasks));
    closeModal();
    renderTasks();
}
// ============================================
// ASSIGNMENTS WITH FILE UPLOAD
// ============================================

function openModal() { 
    document.getElementById('modalOverlay').style.display = 'flex'; 
}

function closeModal() { 
    document.getElementById('modalOverlay').style.display = 'none';
    // Reset form
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskCourse').value = '';
    document.getElementById('taskDepartment').value = '';
    document.getElementById('taskYear').value = '';
    document.getElementById('taskSection').value = '';
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskDueDate').value = '';
    document.getElementById('taskFile').value = '';
}

function saveTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const course = document.getElementById('taskCourse').value.trim();
    const department = document.getElementById('taskDepartment').value.trim();
    const year = document.getElementById('taskYear').value;
    const section = document.getElementById('taskSection').value.trim();
    const description = document.getElementById('taskDesc').value.trim();
    const dueDate = document.getElementById('taskDueDate').value;
    const fileInput = document.getElementById('taskFile');
    
    if (!title || !course) {
        alert("Title and Course are required");
        return;
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('course', course);
    formData.append('department', department || '');
    formData.append('year', year || '');
    formData.append('section', section || '');
    formData.append('description', description || '');
    formData.append('due_date', dueDate || new Date().toISOString());
    
    if (fileInput.files.length > 0) {
        formData.append('file', fileInput.files[0]);
    }
    
    fetch('/api/add-assignment/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCsrfToken()
        },
        body: formData  // Don't set Content-Type, browser will set it with boundary
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            closeModal();
            // Add to local tasks list
            tasks.unshift({
                title: title,
                course: course,
                department: department,
                year: year,
                section: section,
                desc: description,
                date: dueDate || 'May 15',
                file: data.assignment?.file_url || null
            });
            localStorage.setItem('ncit_perfect_tasks', JSON.stringify(tasks));
            renderTasks();
            showNotification('Assignment created successfully!');
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error creating assignment:', error);
        alert('Failed to create assignment. Please try again.');
    });
}

function renderTasks() {
    const container = document.getElementById('assignmentList');
    if(!container) return;
    
    if (tasks.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #94a3b8; padding: 40px;">No assignments yet.</p>`;
        return;
    }
    
    container.innerHTML = tasks.map(task => `
        <div class="assignment-card">
            <div class="status-dot"></div>
            <div class="card-info">
                <h3>${task.title}</h3>
                <div class="card-meta">
                    <span>${task.course}</span>
                    ${task.department ? `<span>${task.department}</span>` : ''}
                    ${task.year ? `<span>Year ${task.year}</span>` : ''}
                    ${task.section ? `<span>Section ${task.section}</span>` : ''}
                    <span class="badge-high">HIGH</span>
                </div>
                <p class="card-desc">${task.desc || 'No description'}</p>
                <div class="card-time"><i class="far fa-clock"></i> ${task.date}</div>
                ${task.file ? `<a href="${task.file}" target="_blank" style="color: #6b21a8; text-decoration: none;"><i class="fas fa-paperclip"></i> View Attachment</a>` : ''}
            </div>
        </div>
    `).join('');
}

// ============================================
// VIEW SWITCHING
// ============================================

function switchView(viewId, element) {
    document.querySelectorAll('.menu a').forEach(link => link.classList.remove('active'));
    if (element) element.classList.add('active');
    document.querySelectorAll('.dashboard-view').forEach(view => view.classList.remove('active-view'));
    const view = document.getElementById(viewId);
    if (view) view.classList.add('active-view');
}

// ============================================
// NOTIFICATION HELPER
// ============================================

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    init();
});
// ============================================
// ASSIGNMENT FUNCTIONS - FIXED
// ============================================

function openModal() { 
    const modal = document.getElementById('modalOverlay');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal() { 
    const modal = document.getElementById('modalOverlay');
    if (modal) {
        modal.style.display = 'none';
        // Reset form
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskCourse').value = '';
        document.getElementById('taskDepartment').value = '';
        document.getElementById('taskYear').value = '';
        document.getElementById('taskSection').value = '';
        document.getElementById('taskDesc').value = '';
        document.getElementById('taskDueDate').value = '';
    }
}

function saveTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const course = document.getElementById('taskCourse').value.trim();
    const department = document.getElementById('taskDepartment').value.trim();
    const year = document.getElementById('taskYear').value;
    const section = document.getElementById('taskSection').value.trim();
    const description = document.getElementById('taskDesc').value.trim();
    const dueDate = document.getElementById('taskDueDate').value;
    
    if (!title || !course) {
        alert("Title and Course are required");
        return;
    }
    
    // Send to server
    fetch('/api/add-assignment/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({
            title: title,
            course: course,
            department: department || '',
            year: year || '',
            section: section || '',
            description: description || '',
            due_date: dueDate || ''
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            closeModal();
            showNotification('Assignment created successfully!');
            // Refresh assignments
            fetchAssignmentsFromServer();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error creating assignment:', error);
        alert('Failed to create assignment. Please try again.');
    });
}

function fetchAssignmentsFromServer() {
    fetch('/api/assignments/')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                renderAssignments(data.assignments);
            }
        })
        .catch(error => console.error('Error fetching assignments:', error));
}

function renderAssignments(assignments) {
    const container = document.getElementById('assignmentList');
    if (!container) return;
    
    if (!assignments || assignments.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #94a3b8; padding: 40px;">No assignments yet.</p>`;
        return;
    }
    
    container.innerHTML = assignments.map(task => `
        <div class="assignment-card">
            <div class="status-dot"></div>
            <div class="card-info">
                <h3>${task.title}</h3>
                <div class="card-meta">
                    <span>${task.course || 'No course'}</span>
                    ${task.department ? `<span>${task.department}</span>` : ''}
                    ${task.year ? `<span>Year ${task.year}</span>` : ''}
                    ${task.section ? `<span>Section ${task.section}</span>` : ''}
                </div>
                <p class="card-desc">${task.description || 'No description'}</p>
                <div class="card-time"><i class="far fa-clock"></i> Due: ${task.due_date || 'No date'}</div>
                <div style="font-size: 12px; color: #64748b;">Created by: ${task.created_by || 'Teacher'}</div>
            </div>
        </div>
    `).join('');
}

// Initialize assignments on page load
document.addEventListener('DOMContentLoaded', function() {
    fetchAssignmentsFromServer();
});