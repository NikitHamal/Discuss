// Import Firebase services
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
// Import navbar functionality
import { initNavbar } from './navbar.js';

// DOM Elements
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const voteBtns = document.querySelectorAll('.vote-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const createPostForm = document.querySelector('.create-post');
const postInput = document.querySelector('.post-input input');
const postBtn = document.querySelector('.post-btn');
const categoryTags = document.querySelectorAll('.category-tag');

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user.uid);
        document.body.classList.add('user-logged-in');
    } else {
        // User is signed out
        console.log('User is signed out');
        document.body.classList.remove('user-logged-in');
    }
});

// Initialize the navbar on all pages
document.addEventListener('DOMContentLoaded', function() {
    // Apply settings from localStorage
    applyThemeSettings();
    applyFontSettings();
    applyAnimationsSettings();
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('open');
            // Toggle between menu and close icons
            const icon = this.querySelector('i');
            if (icon) {
                if (icon.textContent === 'menu') {
                    icon.textContent = 'close';
                    // Prevent scrolling on body when menu is open
                    document.body.style.overflow = 'hidden';
                } else {
                    icon.textContent = 'menu';
                    // Allow scrolling again
                    document.body.style.overflow = '';
                }
            }
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (mobileMenu && mobileMenu.classList.contains('open') && 
            !mobileMenu.contains(event.target) && 
            !mobileMenuToggle.contains(event.target)) {
            mobileMenu.classList.remove('open');
            
            // Reset icon and allow scrolling
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                icon.textContent = 'menu';
            }
            document.body.style.overflow = '';
        }
    });
    
    // Add active class to current page link in navbar
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.main-nav a, .mobile-menu-nav a');
    
    navLinks.forEach(link => {
        // Extract the href attribute and compare with current page
        const linkPage = link.getAttribute('href');
        
        if (linkPage === currentPage || 
            (currentPage === '' && linkPage === 'index.html') ||
            (currentPage === '/' && linkPage === 'index.html')) {
            link.classList.add('active');
        } else if (link.classList.contains('active')) {
            link.classList.remove('active');
        }
    });
});

// Apply theme settings
function applyThemeSettings() {
    try {
        // Apply theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        // Remove all theme classes first
        document.body.classList.remove('theme-philosophical', 'theme-science', 'theme-nature', 'theme-cyberpunk', 'theme-minimal');
        
        // If it's a special theme, add the class
        if (savedTheme.startsWith('theme-')) {
            document.body.classList.add(savedTheme);
        }
        
        // Apply dark mode
        const isDarkMode = localStorage.getItem('darkMode') === 'enabled' || 
                           savedTheme === 'dark' || 
                           (savedTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            
            // Apply dark mode to header/navbar
            const header = document.querySelector('.header');
            if (header) {
                header.classList.add('dark-mode');
            }
            
            // Apply to mobile menu if it exists
            if (mobileMenu) {
                mobileMenu.classList.add('dark-mode');
            }
        } else {
            document.body.classList.remove('dark-mode');
            
            // Remove dark mode from header/navbar
            const header = document.querySelector('.header');
            if (header) {
                header.classList.remove('dark-mode');
            }
            
            // Remove from mobile menu if it exists
            if (mobileMenu) {
                mobileMenu.classList.remove('dark-mode');
            }
        }
        
        // Listen for system theme changes if auto is selected
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            const currentTheme = localStorage.getItem('theme') || 'light';
            
            if (currentTheme === 'auto') {
                const systemDarkMode = event.matches;
                
                if (systemDarkMode) {
                    document.body.classList.add('dark-mode');
                    
                    // Apply dark mode to header/navbar
                    const header = document.querySelector('.header');
                    if (header) {
                        header.classList.add('dark-mode');
                    }
                    
                    // Apply to mobile menu if it exists
                    if (mobileMenu) {
                        mobileMenu.classList.add('dark-mode');
                    }
                    
                    localStorage.setItem('darkMode', 'enabled');
                } else {
                    document.body.classList.remove('dark-mode');
                    
                    // Remove dark mode from header/navbar
                    const header = document.querySelector('.header');
                    if (header) {
                        header.classList.remove('dark-mode');
                    }
                    
                    // Remove from mobile menu if it exists
                    if (mobileMenu) {
                        mobileMenu.classList.remove('dark-mode');
                    }
                    
                    localStorage.setItem('darkMode', 'disabled');
                }
            }
        });
    } catch (error) {
        console.error('Error applying theme settings:', error);
    }
}

// Apply font settings
function applyFontSettings() {
    try {
        // Apply font family if saved
        const savedFont = localStorage.getItem('fontFamily') || 'Poppins';
        document.documentElement.style.setProperty('--font-family', `'${savedFont}', sans-serif`);
        
        // Apply font size if saved
        const savedFontSize = localStorage.getItem('fontSize') || '16';
        document.documentElement.style.setProperty('--base-font-size', `${savedFontSize}px`);
    } catch (error) {
        console.log('Error applying font settings:', error);
    }
}

// Apply animations settings
function applyAnimationsSettings() {
    // Apply reduce animations if enabled
    if (localStorage.getItem('reduceAnimations') === 'true') {
        document.documentElement.classList.add('reduce-animations');
    } else {
        document.documentElement.classList.remove('reduce-animations');
    }
}

// Handle voting
if (voteBtns.length) {
    voteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Get the parent post item and vote count element
            const postItem = btn.closest('.post-item');
            const voteCount = postItem.querySelector('.vote-count');
            
            // Check if user already voted (for demo purposes)
            const hasVoted = btn.classList.contains('voted');
            const isUpvote = btn.classList.contains('upvote');
            const currentVotes = parseInt(voteCount.textContent);
            
            // Remove voted class from both buttons
            postItem.querySelectorAll('.vote-btn').forEach(voteBtn => {
                voteBtn.classList.remove('voted');
            });
            
            if (hasVoted) {
                // Undo vote
                voteCount.textContent = isUpvote ? currentVotes - 1 : currentVotes + 1;
            } else {
                // Add vote
                btn.classList.add('voted');
                
                // Check if opposite vote button was previously active
                const oppositeBtn = postItem.querySelector(isUpvote ? '.downvote' : '.upvote');
                const wasOppositeVoted = oppositeBtn.classList.contains('voted');
                
                if (wasOppositeVoted) {
                    // Change vote from opposite to this direction
                    voteCount.textContent = isUpvote ? currentVotes + 2 : currentVotes - 2;
                } else {
                    // New vote
                    voteCount.textContent = isUpvote ? currentVotes + 1 : currentVotes - 1;
                }
            }
            
            // Add color styling to voted button
            if (btn.classList.contains('voted')) {
                btn.style.color = btn.classList.contains('upvote') ? 'var(--success-color)' : 'var(--danger-color)';
            } else {
                btn.style.color = '';
            }
        });
    });
}

// Handle filter buttons
if (filterBtns.length) {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all filter buttons
            filterBtns.forEach(filterBtn => {
                filterBtn.classList.remove('active');
            });
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Here you would typically fetch or filter posts based on selection
            console.log(`Posts filtered by: ${btn.textContent.trim()}`);
        });
    });
}

// Handle category tags
if (categoryTags.length) {
    categoryTags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all tags
            categoryTags.forEach(categoryTag => {
                categoryTag.classList.remove('active');
            });
            
            // Add active class to clicked tag
            tag.classList.add('active');
            
            // Here you would typically fetch posts for the selected category
            console.log(`Category selected: ${tag.textContent.trim()}`);
        });
    });
}

// Handle create post form
if (createPostForm && postInput && postBtn) {
    createPostForm.addEventListener('submit', (e) => {
        e.preventDefault();
    });
    
    postBtn.addEventListener('click', () => {
        const postText = postInput.value.trim();
        
        if (postText) {
            // In a real app, you would send this to a server
            console.log(`New post created: ${postText}`);
            
            // For demo purposes, create a new post element
            createNewPost(postText);
            
            // Clear the input
            postInput.value = '';
        }
    });
}

// Create a new post element (for demo purposes)
function createNewPost(text) {
    const postsList = document.querySelector('.posts-list');
    
    if (!postsList) return;
    
    const newPost = document.createElement('div');
    newPost.className = 'post-item';
    
    // Get random vote count for demo
    const randomVotes = Math.floor(Math.random() * 50);
    
    // Create post HTML structure
    newPost.innerHTML = `
        <div class="vote-controls">
            <button class="vote-btn upvote"><i class="material-icons">thumb_up</i></button>
            <span class="vote-count">${randomVotes}</span>
            <button class="vote-btn downvote"><i class="material-icons">thumb_down</i></button>
        </div>
        <div class="post-content">
            <div class="post-header">
                <div class="post-meta">
                    <a href="#" class="post-category">General</a>
                    <span class="post-author">Posted by <a href="#">You</a></span>
                    <span class="post-time">Just now</span>
                </div>
                <h3 class="post-title"><a href="#">${text.length > 60 ? text.substring(0, 60) + '...' : text}</a></h3>
            </div>
            <div class="post-body">
                <p>${text}</p>
            </div>
            <div class="post-footer">
                <div class="post-actions">
                    <a href="#" class="post-action"><i class="material-icons">comment</i> 0 Comments</a>
                    <a href="#" class="post-action"><i class="material-icons">share</i> Share</a>
                    <a href="#" class="post-action"><i class="material-icons">bookmark</i> Save</a>
                </div>
            </div>
        </div>
    `;
    
    // Insert the new post at the top of the list
    postsList.insertBefore(newPost, postsList.firstChild);
    
    // Add event listeners to the new vote buttons
    const newVoteBtns = newPost.querySelectorAll('.vote-btn');
    
    newVoteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const postItem = btn.closest('.post-item');
            const voteCount = postItem.querySelector('.vote-count');
            const hasVoted = btn.classList.contains('voted');
            const isUpvote = btn.classList.contains('upvote');
            const currentVotes = parseInt(voteCount.textContent);
            
            postItem.querySelectorAll('.vote-btn').forEach(voteBtn => {
                voteBtn.classList.remove('voted');
                voteBtn.style.color = '';
            });
            
            if (!hasVoted) {
                btn.classList.add('voted');
                voteCount.textContent = isUpvote ? currentVotes + 1 : currentVotes - 1;
                btn.style.color = isUpvote ? 'var(--success-color)' : 'var(--danger-color)';
            }
        });
    });
}

// Add a placeholder avatar for demo purposes
document.addEventListener('DOMContentLoaded', () => {
    const avatarImg = document.querySelector('.user-avatar img');
    
    if (avatarImg && avatarImg.src.includes('avatar-placeholder.png')) {
        // Create a data URI for a default avatar
        const defaultAvatarUrl = 'https://ui-avatars.com/api/?name=Guest+User&background=087ea4&color=fff&size=128';
        avatarImg.src = defaultAvatarUrl;
    }
});

// Simplified styles for voted buttons
const style = document.createElement('style');
style.textContent = `
    .vote-btn.voted.upvote {
        color: var(--success-color);
    }
    
    .vote-btn.voted.downvote {
        color: var(--danger-color);
    }
`;

document.head.appendChild(style);
