import {
    isUserLoggedIn,
    getCurrentUser,
    getUserData,
    signOut
} from './auth-service.js';

// DOM elements
let dashboardContent;
let loginContent;
let userAvatar;
let userDropdown;
let profileLink;
let settingsLink;
let signOutBtn;
let username;
let featuredPosts;
let userPosts;
let welcomeMessage;
let writeButton;

document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
    checkAuthState();
});

function initElements() {
    dashboardContent = document.getElementById('dashboard-content');
    loginContent = document.getElementById('login-content');
    userAvatar = document.getElementById('user-avatar');
    userDropdown = document.getElementById('user-dropdown');
    profileLink = document.getElementById('profile-link');
    settingsLink = document.getElementById('settings-link');
    signOutBtn = document.getElementById('sign-out-btn');
    username = document.getElementById('username');
    featuredPosts = document.getElementById('featured-posts');
    userPosts = document.getElementById('user-posts');
    welcomeMessage = document.getElementById('welcome-message');
    writeButton = document.getElementById('write-button');
}

function initEventListeners() {
    // Toggle user dropdown menu
    if (userAvatar) {
        userAvatar.addEventListener('click', () => {
            if (userDropdown) {
                userDropdown.classList.toggle('show');
            }
        });
    }

    // Handle sign out
    if (signOutBtn) {
        signOutBtn.addEventListener('click', handleSignOut);
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (userDropdown && userDropdown.classList.contains('show') && 
            !event.target.closest('.user-menu')) {
            userDropdown.classList.remove('show');
        }
    });

    // Write button click
    if (writeButton) {
        writeButton.addEventListener('click', () => {
            window.location.href = 'editor.html';
        });
    }
}

async function checkAuthState() {
    // Check if user is logged in
    const loggedIn = isUserLoggedIn();
    
    // Show loading indicator
    showLoadingState();
    
    if (loggedIn) {
        try {
            // Get user data
            const user = getCurrentUser();
            const userData = await getUserData();
            
            // Update UI for logged in user
            updateLoggedInUI(user, userData);
        } catch (error) {
            console.error('Error fetching user data:', error);
            // If there's an error, still show authenticated state but with minimal info
            updateLoggedInUI(getCurrentUser());
        }
    } else {
        // Update UI for guest/non-authenticated user
        updateGuestUI();
    }
    
    // Hide loading indicator
    hideLoadingState();
}

function updateLoggedInUI(user, userData = null) {
    // Show dashboard content, hide login content
    if (dashboardContent) dashboardContent.style.display = 'block';
    if (loginContent) loginContent.style.display = 'none';
    
    // Update user avatar
    if (userAvatar) {
        userAvatar.src = userData?.photoURL || user?.photoURL || 'img/default-profile.png';
        userAvatar.alt = userData?.displayName || user?.displayName || 'Profile';
    }
    
    // Update username
    if (username) {
        username.textContent = userData?.displayName || user?.displayName || 'User';
    }
    
    // Set profile link
    if (profileLink) {
        profileLink.href = `profile.html?uid=${user.uid}`;
    }
    
    // Welcome message
    if (welcomeMessage) {
        const hour = new Date().getHours();
        let greeting = "Good day";
        
        if (hour < 12) greeting = "Good morning";
        else if (hour < 18) greeting = "Good afternoon";
        else greeting = "Good evening";
        
        welcomeMessage.textContent = `${greeting}, ${userData?.displayName || user?.displayName || 'Writer'}!`;
    }
    
    // Load user posts
    loadUserPosts(userData);
    
    // Load featured posts
    loadFeaturedPosts();
}

function updateGuestUI() {
    // Show login content, hide dashboard content
    if (dashboardContent) dashboardContent.style.display = 'none';
    if (loginContent) loginContent.style.display = 'block';
    
    // Load featured posts for guests
    loadFeaturedPosts();
}

function loadUserPosts(userData) {
    if (!userPosts) return;
    
    // Clear existing posts
    userPosts.innerHTML = '';
    
    // Check if user has posts
    const posts = userData?.posts || [];
    
    if (posts.length === 0) {
        // Show empty state
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-posts';
        emptyState.innerHTML = `
            <i class="fas fa-pen-fancy"></i>
            <h3>You haven't written any posts yet</h3>
            <p>Start writing and share your thoughts with the world.</p>
            <button id="start-writing-btn" class="btn-primary">Start Writing</button>
        `;
        userPosts.appendChild(emptyState);
        
        // Add event listener to the new button
        const startWritingBtn = document.getElementById('start-writing-btn');
        if (startWritingBtn) {
            startWritingBtn.addEventListener('click', () => {
                window.location.href = 'editor.html';
            });
        }
        
        return;
    }
    
    // Sort posts by date (most recent first)
    const sortedPosts = [...posts].sort((a, b) => {
        const dateA = a.createdAt ? a.createdAt.seconds : 0;
        const dateB = b.createdAt ? b.createdAt.seconds : 0;
        return dateB - dateA;
    });
    
    // Display only the 3 most recent posts
    const recentPosts = sortedPosts.slice(0, 3);
    
    // Create post cards
    recentPosts.forEach(post => {
        const postCard = createPostCard(post);
        userPosts.appendChild(postCard);
    });
    
    // Add "View All" link if user has more than 3 posts
    if (posts.length > 3) {
        const viewAllLink = document.createElement('div');
        viewAllLink.className = 'view-all-link';
        viewAllLink.innerHTML = `<a href="profile.html">View all ${posts.length} posts</a>`;
        userPosts.appendChild(viewAllLink);
    }
}

function loadFeaturedPosts() {
    if (!featuredPosts) return;
    
    // Clear existing posts
    featuredPosts.innerHTML = '';
    
    // In a real implementation, you would fetch featured posts from Firestore
    // For now, we'll create some dummy featured posts
    const dummyFeaturedPosts = [
        {
            id: 'featured1',
            title: 'Getting Started with Storm Write',
            excerpt: 'Learn how to use Storm Write to create amazing content and connect with readers.',
            createdAt: { seconds: Date.now() / 1000 - 86400 }, // 1 day ago
            author: { name: 'Storm Write Team', photoURL: 'img/logo-small.png' },
            likes: 42,
            comments: [1, 2, 3, 4, 5],
            views: 128
        },
        {
            id: 'featured2',
            title: '10 Tips for Better Writing',
            excerpt: 'Improve your writing skills with these proven techniques from professional writers.',
            createdAt: { seconds: Date.now() / 1000 - 172800 }, // 2 days ago
            author: { name: 'Writing Expert', photoURL: 'img/default-profile.png' },
            likes: 38,
            comments: [1, 2, 3],
            views: 95
        },
        {
            id: 'featured3',
            title: 'The Future of Digital Publishing',
            excerpt: 'How technology is changing the way we create, share, and consume written content.',
            createdAt: { seconds: Date.now() / 1000 - 259200 }, // 3 days ago
            author: { name: 'Tech Insider', photoURL: 'img/default-profile.png' },
            likes: 31,
            comments: [1, 2],
            views: 87
        }
    ];
    
    // Create post cards
    dummyFeaturedPosts.forEach(post => {
        const postCard = createFeaturedPostCard(post);
        featuredPosts.appendChild(postCard);
    });
}

function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    
    // Format date
    const date = post.createdAt ? new Date(post.createdAt.seconds * 1000) : new Date();
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Create post HTML
    card.innerHTML = `
        <div class="post-header">
            <h3 class="post-title">${post.title}</h3>
            <span class="post-date">${formattedDate}</span>
        </div>
        <p class="post-excerpt">${post.excerpt || post.content?.substring(0, 150) || ''}${post.content?.length > 150 ? '...' : ''}</p>
        <div class="post-footer">
            <div class="post-stats">
                <span><i class="fas fa-heart"></i> ${post.likes || 0}</span>
                <span><i class="fas fa-comment"></i> ${post.comments?.length || 0}</span>
                <span><i class="fas fa-eye"></i> ${post.views || 0}</span>
            </div>
            <a href="post.html?id=${post.id}" class="read-more">Read More</a>
        </div>
    `;
    
    return card;
}

function createFeaturedPostCard(post) {
    const card = document.createElement('div');
    card.className = 'featured-post-card';
    
    // Format date
    const date = post.createdAt ? new Date(post.createdAt.seconds * 1000) : new Date();
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Create post HTML
    card.innerHTML = `
        <div class="post-header">
            <h3 class="post-title">${post.title}</h3>
            <div class="post-meta">
                <div class="post-author">
                    <img src="${post.author?.photoURL || 'img/default-profile.png'}" alt="${post.author?.name || 'Author'}">
                    <span>${post.author?.name || 'Anonymous'}</span>
                </div>
                <span class="post-date">${formattedDate}</span>
            </div>
        </div>
        <p class="post-excerpt">${post.excerpt || ''}</p>
        <div class="post-footer">
            <div class="post-stats">
                <span><i class="fas fa-heart"></i> ${post.likes || 0}</span>
                <span><i class="fas fa-comment"></i> ${post.comments?.length || 0}</span>
                <span><i class="fas fa-eye"></i> ${post.views || 0}</span>
            </div>
            <a href="post.html?id=${post.id}" class="read-more">Read More</a>
        </div>
    `;
    
    return card;
}

async function handleSignOut() {
    try {
        // Call signOut function from auth-service
        const result = await signOut();
        
        if (result.success) {
            // Update UI
            updateGuestUI();
            
            // Optionally redirect to home or login page
            // window.location.href = 'login.html';
        } else {
            console.error('Sign out failed:', result.error);
            alert('Failed to sign out. Please try again.');
        }
    } catch (error) {
        console.error('Error signing out:', error);
        alert('An error occurred while signing out.');
    }
}

function showLoadingState() {
    // Implement loading state UI (spinner, skeleton screens, etc.)
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
}

function hideLoadingState() {
    // Hide loading state UI
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
} 