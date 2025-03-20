document.addEventListener('DOMContentLoaded', function() {
    // Filter tab functionality
    const tabs = document.querySelectorAll('.notification-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Filter notifications
            const filterType = tab.dataset.filter;
            filterNotifications('type', filterType);
        });
    });
    
    // Filter button functionality
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Filter notifications
            const filterTime = btn.dataset.filter;
            if (filterTime === 'unread') {
                filterNotifications('read', 'unread');
            } else if (filterTime === 'all') {
                showAllNotifications();
            } else {
                filterNotifications('time', filterTime);
            }
        });
    });
    
    // Mark as read functionality
    document.querySelectorAll('.mark-read').forEach(action => {
        action.addEventListener('click', (e) => {
            const notificationItem = action.closest('.notification-item');
            notificationItem.classList.remove('unread');
            updateUnreadCount();
        });
    });
    
    // Mark all as read
    const markAllReadBtn = document.getElementById('markAllRead');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            document.querySelectorAll('.notification-item.unread').forEach(item => {
                item.classList.remove('unread');
            });
            updateUnreadCount();
        });
    }
    
    // Apply dark mode from settings
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark' || (savedTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Listen for system theme changes if auto is selected
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        if (savedTheme === 'auto') {
            if (event.matches) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }
    });
    
    // Filter notifications by type or time
    function filterNotifications(filterBy, value) {
        const notifications = document.querySelectorAll('.notification-item');
        let visibleCount = 0;
        
        notifications.forEach(notification => {
            if (filterBy === 'type') {
                if (value === 'all' || notification.dataset.type === value) {
                    notification.style.display = 'flex';
                    visibleCount++;
                } else {
                    notification.style.display = 'none';
                }
            } else if (filterBy === 'time') {
                if (notification.dataset.time === value) {
                    notification.style.display = 'flex';
                    visibleCount++;
                } else {
                    notification.style.display = 'none';
                }
            } else if (filterBy === 'read') {
                if (notification.classList.contains('unread')) {
                    notification.style.display = 'flex';
                    visibleCount++;
                } else {
                    notification.style.display = 'none';
                }
            }
        });
        
        // Show empty state if no notifications match the filter
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            if (visibleCount === 0) {
                emptyState.style.display = 'block';
            } else {
                emptyState.style.display = 'none';
            }
        }
    }
    
    // Show all notifications
    function showAllNotifications() {
        const notifications = document.querySelectorAll('.notification-item');
        notifications.forEach(notification => {
            notification.style.display = 'flex';
        });
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }
    
    // Update unread count
    function updateUnreadCount() {
        const unreadCount = document.querySelectorAll('.notification-item.unread').length;
        const unreadCountElement = document.getElementById('unreadCount');
        if (unreadCountElement) {
            unreadCountElement.textContent = unreadCount;
        }
    }
    
    // Initial unread count
    updateUnreadCount();
}); 