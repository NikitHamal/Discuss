// DOM Elements
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mainNav = document.querySelector('.main-nav');
const authButtons = document.querySelector('.auth-buttons');
const voteBtns = document.querySelectorAll('.vote-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const createPostForm = document.querySelector('.create-post');
const postInput = document.querySelector('.post-input input');
const postBtn = document.querySelector('.post-btn');
const categoryTags = document.querySelectorAll('.category-tag');

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('open');
            // Toggle between menu and close icons
            const icon = this.querySelector('i');
            if (icon) {
                if (icon.classList.contains('fa-bars')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
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
            
            // Reset icon
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });
});

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
            // For demo purposes, we'll just show a message
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
            // For demo purposes, we'll just show a message
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
            <button class="vote-btn upvote"><i class="fas fa-thumbs-up"></i></button>
            <span class="vote-count">${randomVotes}</span>
            <button class="vote-btn downvote"><i class="fas fa-thumbs-down"></i></button>
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
                    <a href="#" class="post-action"><i class="fas fa-comment-alt"></i> 0 Comments</a>
                    <a href="#" class="post-action"><i class="fas fa-share"></i> Share</a>
                    <a href="#" class="post-action"><i class="fas fa-bookmark"></i> Save</a>
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

// Add scroll animation for a better UX
window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY;
    const header = document.querySelector('.header');
    
    if (header) {
        if (scrollPos > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});

// Handle dark mode toggle (for future implementation)
const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (prefersDarkMode) {
    // For future implementation
    console.log('User prefers dark mode');
}

// Add CSS for the mobile menu and scrolled header state
const style = document.createElement('style');
style.textContent = `
    .mobile-menu {
        position: fixed;
        top: 70px;
        left: 0;
        right: 0;
        background-color: var(--background-color);
        padding: 1rem;
        box-shadow: var(--shadow-md);
        z-index: 99;
        transform: translateY(-100%);
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
        visibility: hidden;
    }
    
    .mobile-menu.active {
        transform: translateY(0);
        opacity: 1;
        visibility: visible;
    }
    
    .mobile-menu .main-nav ul {
        flex-direction: column;
        gap: 1rem;
    }
    
    .mobile-menu .auth-buttons {
        margin-top: 1.5rem;
        justify-content: center;
    }
    
    body.menu-open {
        overflow: hidden;
    }
    
    .header.scrolled {
        box-shadow: var(--shadow-md);
    }
    
    .vote-btn.voted.upvote {
        color: var(--success-color);
    }
    
    .vote-btn.voted.downvote {
        color: var(--danger-color);
    }
`;

document.head.appendChild(style);
