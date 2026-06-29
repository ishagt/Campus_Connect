// ============================================
// PROFILE MANAGEMENT - FIXED
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

function renderUserProfile() {
    // Get user from localStorage
    let user = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!user) {
        // If no user in localStorage, try to fetch from server
        fetch('/api/get-profile/')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    user = data.user;
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    updateProfileUI(user);
                }
            })
            .catch(() => {
                // Fallback to default
                user = {
                    name: 'User',
                    username: 'user',
                    department: 'Computer Science',
                    bio: 'Welcome to my profile!'
                };
                updateProfileUI(user);
            });
    } else {
        updateProfileUI(user);
    }
}

function updateProfileUI(user) {
    // Update name
    const nameElement = document.getElementById('profileName');
    if (nameElement) {
        nameElement.textContent = user.name || 'User';
    }
    
    // Update username
    const usernameElement = document.getElementById('profileUsername');
    if (usernameElement) {
        usernameElement.textContent = `@${user.username || 'user'}`;
    }
    
    // Update department
    const deptElement = document.getElementById('profileDept');
    if (deptElement) {
        deptElement.textContent = user.department || 'No department';
    }
    
    // Update bio
    const bioElement = document.getElementById('profileBio');
    if (bioElement) {
        bioElement.textContent = user.bio || "Welcome to my profile! Click 'Edit Profile' to update your campus bio details.";
    }
    
    // Update avatar
    const avatar = document.getElementById('profileAvatar');
    if (avatar && user.name) {
        avatar.textContent = user.name.charAt(0).toUpperCase();
    }
}

function openEditProfileModal() {
    const user = JSON.parse(localStorage.getItem('currentUser')) || {};
    
    document.getElementById('editName').value = user.name || '';
    document.getElementById('editDept').value = user.department || '';
    document.getElementById('editBio').value = user.bio || '';

    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function saveUserProfile() {
    const name = document.getElementById('editName').value.trim();
    const department = document.getElementById('editDept').value.trim();
    const bio = document.getElementById('editBio').value.trim();

    if (!name) {
        alert("Name field cannot be left blank.");
        return;
    }

    // Send to server
    fetch('/api/update-profile/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({
            name: name,
            department: department,
            bio: bio
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Update localStorage
            let user = JSON.parse(localStorage.getItem('currentUser')) || {};
            user.name = name;
            user.department = department;
            user.bio = bio;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Update UI
            updateProfileUI(user);
            closeEditProfileModal();
            showNotification('Profile updated successfully!');
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    renderUserProfile();
});