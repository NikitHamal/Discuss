import { 
    auth, 
    db 
} from './firebase-config.js';
import { 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { 
    doc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

// Initialize navbar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Navbar initialization started');
    
    // Get DOM elements (they might not exist on all pages)
    const authButtonsContainer = document.querySelector('.auth-buttons');
    const mobileAuthButtonsContainer = document.querySelector('.mobile-menu-buttons');
    
    // Only proceed if we have at least one of the containers
    if (authButtonsContainer || mobileAuthButtonsContainer) {
        // Show shimmer immediately before auth check
        showNavbarShimmer(authButtonsContainer, mobileAuthButtonsContainer);
        
        // Add shimmer styles
        addShimmerStyles();
        
        // Then initialize navbar functionality
        initNavbar(authButtonsContainer, mobileAuthButtonsContainer);
    } else {
        console.warn('Navbar containers not found on this page');
    }
});

/**
 * Initialize the navbar functionality
 */
function initNavbar(authButtonsContainer, mobileAuthButtonsContainer) {
    // Listen for auth state changes
    auth.onAuthStateChanged(async (user) => {
        try {
            console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
            
            if (user) {
                // User is signed in
                // Get user data from Firestore
                const userData = await getUserData(user.uid);
                
                // Update navbar with user profile
                updateNavbarWithUserProfile(userData, user, authButtonsContainer, mobileAuthButtonsContainer);
            } else {
                // User is not signed in
                showAuthButtons(authButtonsContainer, mobileAuthButtonsContainer);
            }
        } catch (error) {
            console.error('Error in navbar authentication:', error);
            // Show auth buttons as fallback
            showAuthButtons(authButtonsContainer, mobileAuthButtonsContainer);
        }
    });
}

/**
 * Get user data from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User data object
 */
async function getUserData(userId) {
    try {
        // Use compat version syntax
        const userDoc = await db.collection("users").doc(userId).get();
        
        if (userDoc.exists) {
            return { id: userId, ...userDoc.data() };
        } else {
            console.log('No user document found for:', userId);
            return null;
        }
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

/**
 * Update navbar with user profile
 * @param {Object} userData - User data from Firestore
 * @param {Object} user - Firebase auth user object
 */
function updateNavbarWithUserProfile(userData, user, authButtonsContainer, mobileAuthButtonsContainer) {
    if (!authButtonsContainer && !mobileAuthButtonsContainer) {
        console.warn('Navbar containers not found on this page');
        return;
    }

    if (authButtonsContainer) {
        // Clear any existing content
        authButtonsContainer.innerHTML = '';
        
        // Create user profile element
        const userProfileElement = createUserProfileElement(userData, user);
        
        // Add to navbar
        authButtonsContainer.appendChild(userProfileElement);
    }
    
    // Also update mobile menu if it exists
    if (mobileAuthButtonsContainer) {
        // Clear any existing content
        mobileAuthButtonsContainer.innerHTML = '';
        
        // Create mobile user profile element (slightly different styling)
        const mobileUserProfileElement = createUserProfileElement(userData, user, true);
        
        // Add to mobile menu
        mobileAuthButtonsContainer.appendChild(mobileUserProfileElement);
    }
}

/**
 * Create user profile element for navbar
 * @param {Object} userData - User data from Firestore
 * @param {Object} user - Firebase auth user object
 * @param {boolean} isMobile - Whether this is for mobile menu
 * @returns {HTMLElement} - User profile element
 */
function createUserProfileElement(userData, user, isMobile = false) {
    // Container for user profile
    const profileContainer = document.createElement('div');
    profileContainer.className = isMobile ? 'mobile-user-profile' : 'user-profile';
    profileContainer.style.display = 'flex';
    profileContainer.style.alignItems = 'center';
    profileContainer.style.gap = '0.75rem';
    
    // User avatar
    const avatar = document.createElement('img');
    avatar.className = 'user-avatar';
    
    // Prioritize photoURL from userData if available, then auth if available
    // This ensures consistency with the profile page avatar
    const photoURL = userData?.photoURL || userData?.avatarUrl || user.photoURL || 'img/default-profile.png';
    avatar.src = photoURL;
    avatar.alt = 'Profile Picture';
    avatar.style.width = isMobile ? '40px' : '36px';
    avatar.style.height = isMobile ? '40px' : '36px';
    avatar.style.borderRadius = '50%';
    avatar.style.objectFit = 'cover';
    
    // User name
    const userName = document.createElement('span');
    userName.className = 'user-name';
    userName.textContent = userData?.displayName || user.displayName || 'User';
    userName.style.fontSize = isMobile ? '1rem' : '0.9rem';
    userName.style.fontWeight = '500';
    
    // Add click event to go to profile
    profileContainer.style.cursor = 'pointer';
    profileContainer.addEventListener('click', () => {
        window.location.href = 'profile.html';
    });
    
    // Append elements
    profileContainer.appendChild(avatar);
    profileContainer.appendChild(userName);
    
    return profileContainer;
}

/**
 * Show auth buttons in navbar
 */
function showAuthButtons(authButtonsContainer, mobileAuthButtonsContainer) {
    if (authButtonsContainer) {
        authButtonsContainer.innerHTML = `
            <button class="login-btn" onclick="location.href='login.html'">Login</button>
            <button class="signup-btn" onclick="location.href='signup.html'">Sign Up</button>
        `;
    }
    
    if (mobileAuthButtonsContainer) {
        mobileAuthButtonsContainer.innerHTML = `
            <button class="login-btn" onclick="location.href='login.html'">Login</button>
            <button class="signup-btn" onclick="location.href='signup.html'">Sign Up</button>
        `;
    }
}

/**
 * Show shimmer loading effect in navbar
 */
function showNavbarShimmer(authButtonsContainer, mobileAuthButtonsContainer) {
    if (authButtonsContainer) {
        authButtonsContainer.innerHTML = `
            <div class="profile-shimmer-container">
                <div class="shimmer avatar-shimmer"></div>
                <div class="shimmer text-shimmer"></div>
            </div>
        `;
    }
    
    if (mobileAuthButtonsContainer) {
        mobileAuthButtonsContainer.innerHTML = `
            <div class="profile-shimmer-container">
                <div class="shimmer avatar-shimmer"></div>
                <div class="shimmer text-shimmer"></div>
            </div>
        `;
    }
}

// Add shimmer styles to the document if not already present
function addShimmerStyles() {
    if (!document.getElementById('navbar-shimmer-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'navbar-shimmer-styles';
        styleEl.textContent = `
            .profile-shimmer-container {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .avatar-shimmer {
                width: 36px;
                height: 36px;
                border-radius: 50%;
            }
            
            .text-shimmer {
                height: 16px;
                width: 80px;
                border-radius: 4px;
            }
            
            .shimmer {
                background: linear-gradient(90deg, 
                    rgba(var(--primary-rgb, 8, 126, 164), 0.07) 0%, 
                    rgba(var(--primary-rgb, 8, 126, 164), 0.15) 50%, 
                    rgba(var(--primary-rgb, 8, 126, 164), 0.07) 100%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                background-color: var(--background-light, #f0f2f5);
            }
            
            @keyframes shimmer {
                0% {
                    background-position: 200% 0;
                }
                100% {
                    background-position: -200% 0;
                }
            }
            
            .dark-mode .shimmer {
                background: linear-gradient(90deg, 
                    rgba(255, 255, 255, 0.05) 0%, 
                    rgba(255, 255, 255, 0.1) 50%, 
                    rgba(255, 255, 255, 0.05) 100%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                background-color: var(--background-light, #292929);
            }
        `;
        document.head.appendChild(styleEl);
    }
}

// Export needed functions
export { initNavbar }; 