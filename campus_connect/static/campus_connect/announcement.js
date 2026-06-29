// ============================================
// ANNOUNCEMENTS - Matching Report Specs
// ============================================

function fetchAnnouncementsFromServer() {
    fetch('/api/announcements/')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                localStorage.setItem('announcements', JSON.stringify(data.announcements));
                renderAnnouncements(data.announcements);
            } else {
                console.error('Error fetching announcements:', data.message);
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            // Fallback to localStorage
            const localAnn = JSON.parse(localStorage.getItem('announcements') || '[]');
            renderAnnouncements(localAnn);
        });
}

function renderAnnouncements(announcementsData) {
    const container = document.getElementById('announcementsContainer');
    if (!container) return;
    
    const data = announcementsData || JSON.parse(localStorage.getItem('announcements') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const isAdmin = currentUser.role === 'admin';
    
    if (!data || data.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #94a3b8; padding: 40px;">No announcements yet. Check back later!</p>`;
        return;
    }

    container.innerHTML = data.map((item) => {
        // Ensure item exists
        if (!item) return '';
        
        const category = item.category || 'Announcements';
        const isEvent = category === 'Events';
        
        return `
        <div class="announcement-card" data-id="${item.id || ''}">
            <div class="announcement-header">
                <div>
                    <span class="announcement-tag ${isEvent ? 'event-tag' : ''}">${category}</span>
                    <span class="announcement-date">${item.created_at || item.date || new Date().toLocaleDateString()}</span>
                </div>
                ${isAdmin ? `
                <div class="announcement-actions">
                    <button class="delete-btn" onclick="deleteAnnouncement(${item.id || 0})" title="Delete Announcement">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                ` : ''}
            </div>
            <h3 class="announcement-title">${item.title || 'Untitled'}</h3>
            <p class="announcement-sender">From: ${item.sender || 'Campus Admin'}</p>
            <p class="announcement-description">${item.description || 'No description provided.'}</p>
        </div>
        `;
    }).join('');
}

function saveAnnouncement() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.role !== 'admin') {
        alert('⚠️ Only admins can create announcements.');
        return;
    }
    
    const title = document.getElementById('announcementTitle').value.trim();
    const sender = document.getElementById('announcementSender').value.trim();
    const category = document.getElementById('announcementCategory').value;
    const description = document.getElementById('announcementDesc').value.trim();
    
    if (!title || !description) {
        alert('⚠️ Please fill in all required fields.');
        return;
    }
    
    fetch('/api/add-announcement/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({
            title: title,
            sender: sender || 'Campus Admin',
            category: category,
            description: description
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            closeAnnouncementModal();
            fetchAnnouncementsFromServer();
            showNotification('Announcement published successfully!');
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to publish announcement. Please try again.');
    });
}

function deleteAnnouncement(announcementId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.role !== 'admin') {
        alert('⚠️ Only admins can delete announcements.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    fetch(`/api/delete-announcement/${announcementId}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCsrfToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            fetchAnnouncementsFromServer();
            showNotification('Announcement deleted successfully!');
        } else {
            alert('Error: ' + data.message);
        }
    });
}

function filterAnnouncements(category, element) {
    // Update active filter
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.classList.remove('active-filter');
    });
    if (element) {
        element.classList.add('active-filter');
    }
    
    let annData = JSON.parse(localStorage.getItem('announcements') || '[]');
    let filtered;
    if (category === 'all') {
        filtered = annData;
    } else {
        filtered = annData.filter(item => item.category === category);
    }
    renderAnnouncements(filtered);
}

function openAnnouncementModal() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.role !== 'admin') {
        alert('⚠️ Only admins can create announcements.');
        return;
    }
    document.getElementById('announcementModalOverlay').style.display = 'flex';
}

function closeAnnouncementModal() {
    document.getElementById('announcementModalOverlay').style.display = 'none';
    document.getElementById('announcementTitle').value = '';
    document.getElementById('announcementSender').value = '';
    document.getElementById('announcementDesc').value = '';
}

// Initialize announcements on page load
document.addEventListener('DOMContentLoaded', function() {
    fetchAnnouncementsFromServer();
});