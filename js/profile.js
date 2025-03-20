import { auth, db, storage } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Profile page loaded');

// DOM Elements
    const profileTabs = document.querySelectorAll('.profile-tabs li a');
    const tabContents = document.querySelectorAll('.tab-section');
    const profileSidebar = document.querySelector('.profile-sidebar');
    
    // Current user data
    let currentUser = null;
    let userData = null;
    let isEditing = false;
    
    // Show shimmer effects immediately on page load
    showProfileShimmer();
    
    // Check if user is logged in
    auth.onAuthStateChanged(async (user) => {
        try {
            console.log('Auth state changed:', user ? 'User logged in' : 'No user');
            
            if (user) {
                currentUser = user;
                await loadUserData(); // Load user data from Firestore
                console.log('User data loaded:', userData);
            } else {
                // For demo purposes, load a demo profile
                await loadDemoUserData();
                console.log('Demo data loaded:', userData);
            }
            
            if (!userData) {
                console.warn('userData is null after loading, using default data');
                userData = getDefaultUserData();
            }
            
            // Make sure userData has a uid property
            if (currentUser && !userData.uid) {
                userData.uid = currentUser.uid;
            }
            
            // Get profile username from URL if available
            const urlParams = new URLSearchParams(window.location.search);
            const profileUsername = urlParams.get('username');
            
            // If there's a username in the URL and it's not the current user, load that profile
            if (profileUsername && currentUser && profileUsername !== userData.username) {
                try {
                    const profileUserQuery = await db.collection('users')
                        .where('username', '==', profileUsername)
                        .limit(1)
                        .get();
                    
                    if (!profileUserQuery.empty) {
                        userData = profileUserQuery.docs[0].data();
                        userData.uid = profileUserQuery.docs[0].id; // Set the document ID as the uid
                        console.log('Loaded profile for:', profileUsername);
                    }
                } catch (error) {
                    console.error('Error loading profile from URL param:', error);
                }
            }
            
            // Render profile and hide shimmer AFTER data is loaded
            renderUserProfile();
            setupTabNavigation();
        } catch (error) {
            console.error('Error in auth state change handler:', error);
            userData = getDefaultUserData();
            renderUserProfile();
            setupTabNavigation();
        }
    });
    
    // Load user data from Firestore
    async function loadUserData() {
        try {
            if (!currentUser) {
                console.warn('Cannot load user data: No current user');
                return;
            }
            
            console.log('Loading user data for:', currentUser.uid);
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            
            if (userDoc.exists) {
                userData = userDoc.data();
                userData.uid = currentUser.uid; // Ensure UID is set
                
                // Ensure photoURL is synced from auth profile
                if (currentUser.photoURL && (!userData.photoURL || userData.photoURL !== currentUser.photoURL)) {
                    userData.photoURL = currentUser.photoURL;
                    
                    // Optionally update Firestore with the current photoURL
                    try {
                        await db.collection('users').doc(currentUser.uid).update({
                            photoURL: currentUser.photoURL
                        });
                    } catch (updateError) {
                        console.warn('Could not update photoURL in Firestore:', updateError);
                    }
                }
                
                // Ensure required fields exist
                userData.displayName = userData.displayName || currentUser.displayName || 'User';
                userData.avatarUrl = userData.avatarUrl || userData.photoURL || currentUser.photoURL || 'img/default-profile.png';
                userData.bio = userData.bio || 'No bio available';
                userData.stats = userData.stats || {
                    discussions: 0,
                    reputation: 0,
                    comments: 0,
                    joined: formatJoinDate(currentUser.metadata?.creationTime)
                };
                
                console.log('User data loaded successfully with UID:', userData.uid);
            } else {
                console.warn('No user document found in Firestore, creating default profile');
                userData = getDefaultUserData();
                userData.uid = currentUser.uid;
                
                // Add auth user's displayName and photoURL if available
                if (currentUser.displayName) {
                    userData.displayName = currentUser.displayName;
                }
                if (currentUser.photoURL) {
                    userData.photoURL = currentUser.photoURL;
                    userData.avatarUrl = currentUser.photoURL;
                }
                
                // Set join date from Firebase Auth
                if (currentUser.metadata?.creationTime) {
                    userData.stats.joined = formatJoinDate(currentUser.metadata.creationTime);
                }
                
                // Create a new user document in Firestore
                try {
                    await db.collection('users').doc(currentUser.uid).set(userData);
                    console.log('Created new user document in Firestore');
                } catch (createError) {
                    console.error('Failed to create user document:', createError);
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            userData = getDefaultUserData();
            
            // Add auth user's info if available
            if (currentUser) {
                userData.uid = currentUser.uid;
                if (currentUser.displayName) {
                    userData.displayName = currentUser.displayName;
                }
                if (currentUser.photoURL) {
                    userData.photoURL = currentUser.photoURL;
                    userData.avatarUrl = currentUser.photoURL;
                }
            }
        }
    }
    
    // Format join date from timestamp
    function formatJoinDate(timestamp) {
        if (!timestamp) return '';
        
        try {
            const date = new Date(timestamp);
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            return `${month} ${year}`;
        } catch (error) {
            console.error('Error formatting join date:', error);
            return '';
        }
    }
    
    // Load demo user data for development/demonstration
    async function loadDemoUserData() {
        try {
            // Try to get a demo user from Firestore
            const demoUserQuery = await db.collection('users').where('username', '==', 'PhilosophyFan').limit(1).get();
            
            if (!demoUserQuery.empty) {
                userData = demoUserQuery.docs[0].data();
            } else {
                userData = getDefaultUserData();
            }
        } catch (error) {
            console.error('Error loading demo data:', error);
            userData = getDefaultUserData();
        }
    }
    
    // Default user data
    function getDefaultUserData() {
        return {
            username: 'PhilosophyFan',
            displayName: 'PhilosophyFan',
            bio: 'Philosophy enthusiast focusing on ethics and free will. Graduate student at University of Philosophy.',
            verified: true,
            premium: true,
            avatarUrl: 'https://ui-avatars.com/api/?name=PhilosophyFan&background=087ea4&color=fff&size=128',
            coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            stats: {
                discussions: 128,
                reputation: 4200,
                comments: 836,
                joined: 'Jan 2022'
            },
            education: {
                degree: 'PhD Candidate in Philosophy',
                institution: 'University of Philosophy'
            },
            location: 'New York, USA',
            website: 'philosophyfan.com',
            memberSince: 'January 15, 2022',
            activeTopics: [
                { name: 'Philosophy', count: 47 },
                { name: 'Ethics', count: 32 },
                { name: 'Existentialism', count: 28 },
                { name: 'Consciousness Studies', count: 16 },
                { name: 'Political Philosophy', count: 5 }
            ],
            achievements: [
                { name: 'Top Contributor', icon: 'star', tier: 'gold' },
                { name: 'Prolific Writer', icon: 'pen-fancy', tier: 'silver' },
                { name: 'Insightful Commenter', icon: 'comment', tier: 'bronze' },
                { name: 'Appreciated', icon: 'heart', tier: '' },
                { name: '1 Year Club', icon: 'certificate', tier: '' }
            ],
            discussions: getDefaultDiscussions()
        };
    }
    
    // Default discussions data
    function getDefaultDiscussions() {
        return [
            {
                id: '1',
                title: 'The concept of free will in modern society - Are we truly free to make our own choices?',
                category: 'Philosophy',
                time: '2 hours ago',
                votes: 125,
                content: 'In today\'s interconnected world, how much of our decisions are truly our own? I\'ve been contemplating the intersection of social media influence and personal autonomy...',
                commentCount: 42
            },
            {
                id: '2',
                title: 'The trolley problem revisited: Modern ethical dilemmas in automated systems',
                category: 'Ethics',
                time: '3 days ago',
                votes: 93,
                content: 'With the rise of self-driving vehicles and AI decision-making systems, the classic trolley problem has taken on new significance. How do we program machines to make ethical choices?',
                commentCount: 28
            },
            {
                id: '3',
                title: 'Finding meaning in a post-truth world: Existential challenges of the digital age',
                category: 'Existentialism',
                time: '1 week ago',
                votes: 156,
                content: 'In an era where information is abundant but truth seems increasingly elusive, how do we construct meaning and authenticity in our lives? This discussion explores existential challenges in the digital age.',
                commentCount: 63
            }
        ];
    }
    
    // Render the user profile with data from Firebase
    function renderUserProfile() {
        if (!userData) {
            console.error('User data is undefined');
            userData = getDefaultUserData(); // Fallback to default data
        }
        
        // Update profile header
        const profileAvatar = document.querySelector('.profile-avatar img');
        if (profileAvatar) {
            // Use the photoURL from Firebase auth if available, fallback to userData.avatarUrl
            // This ensures consistency with navbar avatar
            if (currentUser && currentUser.photoURL) {
                profileAvatar.src = currentUser.photoURL;
            } else {
                profileAvatar.src = userData.avatarUrl || userData.photoURL || 'img/default-profile.png';
            }
        }
        
        const profileCover = document.querySelector('.profile-cover');
        const coverImg = profileCover?.querySelector('img');
        
        if (profileCover) {
            // Check if user has a gradient cover
            if (userData.coverType === 'gradient' && userData.coverGradient) {
                const gradient = userData.coverGradient;
                // Apply gradient to cover container
                profileCover.style.background = `linear-gradient(${gradient.direction}, ${gradient.colors[0]}, ${gradient.colors[1]})`;
                // Hide the image
                if (coverImg) {
                    coverImg.style.display = 'none';
                }
            } else {
                // User has an image cover or default
                if (coverImg) {
                    coverImg.style.display = 'block';
                    coverImg.src = userData.coverUrl || '';
                }
                // Reset any background gradient
                profileCover.style.background = '';
            }
        }
        
        // Update profile name and bio
        const profileName = document.querySelector('.profile-name');
        if (profileName) {
            profileName.textContent = userData.displayName || (currentUser ? currentUser.displayName : 'User');
        }
        
        const profileBio = document.querySelector('.profile-bio');
        if (profileBio) {
            profileBio.textContent = userData.bio || 'No bio available';
        }
        
        // Update profile badges
        const verifiedBadge = document.querySelector('.profile-badge.verified');
        if (verifiedBadge) {
            verifiedBadge.style.display = userData.verified ? 'inline-flex' : 'none';
        }
        
        const premiumBadge = document.querySelector('.profile-badge.premium');
        if (premiumBadge) {
            premiumBadge.style.display = userData.premium ? 'inline-flex' : 'none';
        }

        // Update stats
        if (userData.stats) {
            const discussionsStat = document.querySelector('.profile-stat:nth-child(1) .stat-value');
            if (discussionsStat) {
                discussionsStat.textContent = userData.stats.discussions || 0;
            }
            
            const reputationStat = document.querySelector('.profile-stat:nth-child(2) .stat-value');
            if (reputationStat) {
                reputationStat.textContent = formatNumber(userData.stats.reputation || 0);
            }
            
            const commentsStat = document.querySelector('.profile-stat:nth-child(3) .stat-value');
            if (commentsStat) {
                commentsStat.textContent = userData.stats.comments || 0;
            }
            
            const joinedStat = document.querySelector('.profile-stat:nth-child(4) .stat-value');
            if (joinedStat) {
                joinedStat.textContent = userData.stats.joined || '';
            }
        }

        // Handle profile actions - hide follow and message buttons for own profile
        const profileActions = document.querySelector('.profile-actions');
        const followBtn = profileActions?.querySelector('.follow-btn');
        const messageBtn = profileActions?.querySelector('.message-btn');
        
        if (profileActions) {
            // Check if user is viewing their own profile
            const isOwnProfile = currentUser && userData && currentUser.uid === userData.uid;
            console.log('Profile ownership check:', { 
                currentUserUID: currentUser ? currentUser.uid : 'no-user',
                profileUID: userData ? userData.uid : 'no-profile-data',
                isOwnProfile
            });
            
            if (isOwnProfile) {
                // Viewing own profile - hide follow and message buttons
                if (followBtn) followBtn.style.display = 'none';
                if (messageBtn) messageBtn.style.display = 'none';
                
                // Add edit button if it doesn't already exist
                if (!profileActions.querySelector('.edit-profile-header-btn')) {
                    const editProfileBtn = document.createElement('button');
                    editProfileBtn.className = 'edit-profile-header-btn';
                    editProfileBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
                    editProfileBtn.addEventListener('click', startEditing);
                    profileActions.prepend(editProfileBtn);
                }
            } else {
                // Viewing someone else's profile - show follow and message buttons
                if (followBtn) followBtn.style.display = 'inline-flex';
                if (messageBtn) messageBtn.style.display = 'inline-flex';
                
                // Remove edit button if it exists
                const editBtn = profileActions.querySelector('.edit-profile-header-btn');
                if (editBtn) {
                    editBtn.remove();
                }
            }
        }
        
        // Render sidebar with user data
        renderSidebar();
        
        // Render About tab content
        renderAboutTabContent();
        
        // Render discussions
        renderDiscussions();
        
        // Add edit buttons
        addEditButtons();
        
        // Setup image upload functionality
        setupImageUpload();
        
        // Hide shimmer and show content
        hideProfileShimmer();
    }
    
    // Render user sidebar information
    function renderSidebar() {
        const sidebar = document.querySelector('.profile-sidebar');
        if (!sidebar) return;
        
        // Get the About User card
        const aboutCard = sidebar.querySelector('.sidebar-card.about-user');
        if (!aboutCard) return;
        
        const formatter = new Intl.DateTimeFormat('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Helper function to handle empty values
        function formatContent(value, defaultText = 'Not specified') {
            if (!value || value.trim() === '') {
                return `<span class="empty-value">${defaultText}</span>`;
            }
            return value;
        }
        
        // Format the join date
        const joinDate = currentUser && currentUser.metadata && currentUser.metadata.creationTime 
            ? formatter.format(new Date(currentUser.metadata.creationTime))
            : 'Unknown';
        
        // Get the topics count
        const topicsCount = userData && userData.activeTopics ? userData.activeTopics.length : 0;
        
        // Get the achievements count
        const achievementsCount = userData && userData.achievements ? userData.achievements.length : 0;
        
        // Update About User card
        aboutCard.innerHTML = `
            <h3>About User</h3>
            
            <div class="about-item">
                <i class="material-icons">person</i>
                <div>
                    <h4>Display Name</h4>
                    <p>${formatContent(userData ? userData.displayName : currentUser ? currentUser.displayName : null)}</p>
                </div>
            </div>
            
            <div class="about-item">
                <i class="material-icons">school</i>
                <div>
                    <h4>Education</h4>
                    <p>${formatContent(userData && userData.education ? userData.education.degree : null)}<br>${formatContent(userData && userData.education ? userData.education.institution : null)}</p>
                </div>
            </div>
            
            <div class="about-item">
                <i class="material-icons">location_on</i>
                <div>
                    <h4>Location</h4>
                    <p>${formatContent(userData && userData.location ? userData.location : null)}</p>
                </div>
            </div>
            
            <div class="about-item">
                <i class="material-icons">link</i>
                <div>
                    <h4>Website</h4>
                    <p>${userData && userData.website ? 
                        `<a href="https://${userData.website}" target="_blank">${userData.website}</a>` : 
                        '<span class="empty-value">Not specified</span>'}</p>
                </div>
            </div>
            
            <div class="about-item">
                <i class="material-icons">cake</i>
                <div>
                    <h4>Member Since</h4>
                    <p>${joinDate}</p>
                </div>
            </div>
            
            <div class="about-item">
                <i class="material-icons">forum</i>
                <div>
                    <h4>Active Topics</h4>
                    <p>${topicsCount} topics</p>
                </div>
            </div>
            
            <div class="about-item">
                <i class="material-icons">emoji_events</i>
                <div>
                    <h4>Achievements</h4>
                    <p>${achievementsCount} badges</p>
                </div>
            </div>
        `;
        
        // Update user topics
        const topicsCard = sidebar.querySelector('.sidebar-card.user-topics');
        if (topicsCard) {
            let topicsHTML = '<h3>Active Topics</h3>';
            
            if (userData && userData.activeTopics && userData.activeTopics.length > 0) {
                topicsHTML += '<ul class="user-topics-list">';
                
                userData.activeTopics.forEach(topic => {
                    topicsHTML += `
                        <li>
                            <a href="topics.html?topic=${encodeURIComponent(topic.name)}">
                                <span class="topic-name">${topic.name}</span>
                                <span class="topic-count">${topic.count || 0} posts</span>
                            </a>
                        </li>
                    `;
                });
                
                topicsHTML += '</ul>';
            } else {
                topicsHTML += '<p class="empty-content">No active topics yet</p>';
            }
            
            topicsCard.innerHTML = topicsHTML;
        }
        
        // Update achievements
        const achievementsCard = sidebar.querySelector('.sidebar-card.user-achievements');
        if (achievementsCard) {
            let achievementsHTML = '<h3>Achievements</h3>';
            
            if (userData && userData.achievements && userData.achievements.length > 0) {
                achievementsHTML += '<div class="achievement-grid">';
                
                userData.achievements.forEach(achievement => {
                    let tierClass = '';
                    
                    if (achievement.tier === 'gold') {
                        tierClass = 'gold';
                    } else if (achievement.tier === 'silver') {
                        tierClass = 'silver';
                    } else if (achievement.tier === 'bronze') {
                        tierClass = 'bronze';
                    }
                    
                    achievementsHTML += `
                        <div class="achievement-item">
                            <div class="achievement-icon ${tierClass}">
                                <i class="material-icons">${achievement.icon || 'emoji_events'}</i>
                            </div>
                            <div class="achievement-name">${achievement.name}</div>
                        </div>
                    `;
                });
                
                achievementsHTML += '</div>';
            } else {
                achievementsHTML += '<p class="empty-content">No achievements yet</p>';
            }
            
            achievementsCard.innerHTML = achievementsHTML;
        }
    }
    
    // Format numbers (e.g., 4200 to 4.2k)
    function formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num;
    }
    
    // Render the About tab content
    function renderAboutTabContent() {
        // Only create the About tab content if it doesn't exist
        let aboutTab = document.querySelector('.tab-section.about-tab');
        if (!aboutTab) {
            const tabContent = document.querySelector('.profile-tab-content');
            if (!tabContent) return;
            
            aboutTab = document.createElement('div');
            aboutTab.className = 'tab-section about-tab';
            tabContent.appendChild(aboutTab);
        }
        
        // Ensure all userData properties exist
        const displayName = userData.displayName || 'User';
        const bio = userData.bio || 'No bio available.';
        const education = userData.education || { degree: 'Not specified', institution: 'Not specified' };
        const location = userData.location || 'Not specified';
        const website = userData.website || 'example.com';
        const memberSince = userData.memberSince || 'Not available';
        const activeTopics = userData.activeTopics || [];
        const achievements = userData.achievements || [];
        
        aboutTab.innerHTML = `
            <div class="about-user-section">
                <h2>About ${displayName}</h2>
                <div class="edit-section">
                    <div class="about-field">
                        <label>Display Name</label>
                        <p class="field-value">${displayName}</p>
                        <div class="edit-field" style="display: none;">
                            <input type="text" value="${displayName}" data-field="displayName">
                        </div>
                    </div>
                    <div class="about-field">
                        <label>Bio</label>
                        <p class="field-value">${bio}</p>
                        <div class="edit-field" style="display: none;">
                            <textarea data-field="bio">${bio}</textarea>
                        </div>
                    </div>
                    <div class="about-field">
                        <label>Education</label>
                        <p class="field-value">${education.degree || 'Not specified'}<br>${education.institution || 'Not specified'}</p>
                        <div class="edit-field" style="display: none;">
                            <input type="text" value="${education.degree || ''}" data-field="education.degree" placeholder="Degree">
                            <input type="text" value="${education.institution || ''}" data-field="education.institution" placeholder="Institution">
                        </div>
                    </div>
                    <div class="about-field">
                        <label>Location</label>
                        <p class="field-value">${location}</p>
                        <div class="edit-field" style="display: none;">
                            <input type="text" value="${location}" data-field="location">
                        </div>
                    </div>
                    <div class="about-field">
                        <label>Website</label>
                        <p class="field-value"><a href="https://${website}" target="_blank">${website}</a></p>
                        <div class="edit-field" style="display: none;">
                            <input type="text" value="${website}" data-field="website">
                        </div>
                    </div>
                    <div class="about-field">
                        <label>Member Since</label>
                        <p class="field-value">${memberSince}</p>
                    </div>
                </div>
                <button class="edit-profile-btn" data-section="about">Edit Profile</button>
                <div class="edit-actions" style="display: none;">
                    <button class="save-profile-btn" data-section="about">Save Changes</button>
                    <button class="cancel-edit-btn" data-section="about">Cancel</button>
                </div>
            </div>
            
            <div class="profile-topics-section">
                <h2>Active in Topics</h2>
                ${activeTopics.length > 0 ? `
                <ul class="user-topics-list">
                    ${activeTopics.map(topic => `
                        <li>
                            <a href="#">
                                <span class="topic-name">${topic.name || 'Unknown'}</span>
                                <span class="topic-count">${topic.count || 0} discussions</span>
                            </a>
                        </li>
                    `).join('')}
                </ul>
                ` : `
                <p class="empty-topics">User is not active in any topics yet.</p>
                `}
                <button class="edit-profile-btn" data-section="topics">Edit Topics</button>
                <div class="edit-actions" style="display: none;">
                    <button class="save-profile-btn" data-section="topics">Save Changes</button>
                    <button class="cancel-edit-btn" data-section="topics">Cancel</button>
                </div>
            </div>
            
            <div class="achievements-section">
                <h2>Achievements</h2>
                ${achievements.length > 0 ? `
                <div class="achievement-grid">
                    ${achievements.map(achievement => `
                        <div class="achievement-item">
                            <div class="achievement-icon ${achievement.tier || ''}">
                                <i class="fas fa-${achievement.icon || 'award'}"></i>
                            </div>
                            <span class="achievement-name">${achievement.name || 'Achievement'}</span>
                        </div>
                    `).join('')}
                </div>
                ` : `
                <p class="empty-achievements">No achievements yet.</p>
                `}
            </div>
        `;
    }
    
    // Render discussions
    function renderDiscussions() {
        const postsList = document.querySelector('.posts-list');
        if (!postsList) return;
        
        if (!userData.discussions) {
            console.warn('No discussions found, using default discussions');
            userData.discussions = getDefaultDiscussions();
        }
        
        if (!userData.discussions.length) {
            postsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comment-slash"></i>
                    <h3>No Discussions Yet</h3>
                    <p>This user hasn't posted any discussions yet.</p>
                </div>
            `;
        return;
    }
        
        postsList.innerHTML = userData.discussions.map(discussion => `
            <div class="post-item">
                <div class="vote-controls">
                    <button class="vote-btn upvote"><i class="fas fa-thumbs-up"></i></button>
                    <span class="vote-count">${discussion.votes || 0}</span>
                    <button class="vote-btn downvote"><i class="fas fa-thumbs-down"></i></button>
                </div>
                <div class="post-content">
                    <div class="post-header">
                        <div class="post-meta">
                            <a href="#" class="post-category">${discussion.category || 'General'}</a>
                            <span class="post-time">${discussion.time || 'Recently'}</span>
                        </div>
                        <h3 class="post-title"><a href="post-detail.html?id=${discussion.id || '0'}">${discussion.title || 'Untitled Discussion'}</a></h3>
                    </div>
                    <div class="post-body">
                        <p>${discussion.content || 'No content available.'}</p>
                    </div>
                    <div class="post-footer">
                        <div class="post-actions">
                            <a href="#" class="post-action"><i class="fas fa-comment-alt"></i> ${discussion.commentCount || 0} Comments</a>
                            <a href="#" class="post-action"><i class="fas fa-share"></i> Share</a>
                            <a href="#" class="post-action"><i class="fas fa-bookmark"></i> Save</a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Add edit buttons
    function addEditButtons() {
        // Header profile edit button
        const profileHeaderActions = document.querySelector('.profile-actions');
        
        // Only add the button if it doesn't already exist
        if (!profileHeaderActions.querySelector('.edit-profile-header-btn')) {
            const editProfileHeaderBtn = document.createElement('button');
            editProfileHeaderBtn.className = 'edit-profile-header-btn';
            editProfileHeaderBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
            profileHeaderActions.prepend(editProfileHeaderBtn);
            
            // Add event listener
            editProfileHeaderBtn.addEventListener('click', startEditing);
        }
        
        // Set up event listeners for all edit buttons
        document.querySelectorAll('.edit-profile-btn').forEach(btn => {
            btn.addEventListener('click', startEditing);
        });
        
        document.querySelectorAll('.save-profile-btn').forEach(btn => {
            btn.addEventListener('click', saveChanges);
        });
        
        document.querySelectorAll('.cancel-edit-btn').forEach(btn => {
            btn.addEventListener('click', cancelEditing);
        });
    }
    
    // Start editing a section
    function startEditing(e) {
        const section = e.target.dataset.section || 'header';
        isEditing = true;
        
        // Store original values for comparison
        window.originalProfileValues = window.originalProfileValues || {};
        
        if (section === 'header') {
            // Enable editing of header elements
            const nameElement = document.querySelector('.profile-name');
            const bioElement = document.querySelector('.profile-bio');
            
            // Store original values
            window.originalProfileValues.displayName = userData.displayName;
            window.originalProfileValues.bio = userData.bio;
            
            // Replace with editable fields
            nameElement.innerHTML = `<input type="text" id="edit-name" value="${userData.displayName}">`;
            bioElement.innerHTML = `<textarea id="edit-bio">${userData.bio}</textarea>`;
            
            // Add input change listeners to toggle save button visibility
            const nameInput = document.getElementById('edit-name');
            const bioInput = document.getElementById('edit-bio');
            
            // Change button to Save
            e.target.textContent = 'Save Profile';
            e.target.classList.add('disabled-btn');
            e.target.style.opacity = '0.6';
            e.target.style.cursor = 'default';
            e.target.removeEventListener('click', startEditing);
            e.target.addEventListener('click', () => saveChanges({ target: { dataset: { section: 'header' } } }));
            
            // Add event listeners to detect changes
            function checkForChanges() {
                const displayNameChanged = nameInput.value !== window.originalProfileValues.displayName;
                const bioChanged = bioInput.value !== window.originalProfileValues.bio;
                
                if (displayNameChanged || bioChanged) {
                    e.target.classList.remove('disabled-btn');
                    e.target.style.opacity = '1';
                    e.target.style.cursor = 'pointer';
                } else {
                    e.target.classList.add('disabled-btn');
                    e.target.style.opacity = '0.6';
                    e.target.style.cursor = 'default';
                }
            }
            
            nameInput.addEventListener('input', checkForChanges);
            bioInput.addEventListener('input', checkForChanges);
            
        } else {
            // Enable editing for other sections
            const sectionElement = document.querySelector('.about-user-section, .profile-topics-section');
            if (sectionElement) {
                // Store original values
                window.originalProfileValues[section] = {};
                
                const fields = sectionElement.querySelectorAll('.about-field');
                fields.forEach(field => {
                    const valueEl = field.querySelector('.field-value');
                    const editEl = field.querySelector('.edit-field');
                    if (valueEl && editEl) {
                        const fieldInputs = editEl.querySelectorAll('[data-field]');
                        
                        // Store original values for each field
                        fieldInputs.forEach(input => {
                            const fieldName = input.dataset.field;
                            window.originalProfileValues[section][fieldName] = input.value;
                        });
                        
                        valueEl.style.display = 'none';
                        editEl.style.display = 'block';
                    }
                });
                
                // Show save/cancel buttons
                const editBtn = sectionElement.querySelector('.edit-profile-btn');
                const actions = sectionElement.querySelector('.edit-actions');
                if (editBtn && actions) {
                    editBtn.style.display = 'none';
                    actions.style.display = 'flex';
                }
                
                // Disable the save button initially
                const saveBtn = actions.querySelector('.save-profile-btn');
                saveBtn.classList.add('disabled-btn');
                saveBtn.style.opacity = '0.6';
                saveBtn.style.cursor = 'default';
                
                // Add change event listeners to all inputs
                const inputs = sectionElement.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    const fieldName = input.dataset.field;
                    if (fieldName) {
                        input.addEventListener('input', () => {
                            let hasChanges = false;
                            
                            // Check all inputs for changes
                            inputs.forEach(inp => {
                                const field = inp.dataset.field;
                                if (field && window.originalProfileValues[section][field] !== inp.value) {
                                    hasChanges = true;
                                }
                            });
                            
                            // Enable/disable save button based on changes
                            if (hasChanges) {
                                saveBtn.classList.remove('disabled-btn');
                                saveBtn.style.opacity = '1';
                                saveBtn.style.cursor = 'pointer';
                            } else {
                                saveBtn.classList.add('disabled-btn');
                                saveBtn.style.opacity = '0.6';
                                saveBtn.style.cursor = 'default';
                            }
                        });
                    }
                });
            }
        }
    }
    
    // Save changes to Firebase
    async function saveChanges(e) {
        const section = e.target.dataset.section || 'header';
        
        // Check if the button is disabled (no changes to save)
        if (e.target.classList.contains('disabled-btn')) {
            return;
        }
        
        try {
            // Show loading state
            const originalText = e.target.innerHTML;
            e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            e.target.disabled = true;
            
            // Collect the edited data
            let updates = {};
            
            if (section === 'header') {
                // Get values from header fields
                const newName = document.getElementById('edit-name').value;
                const newBio = document.getElementById('edit-bio').value;
                
                updates = {
                    displayName: newName,
                    bio: newBio
                };
                
                // Restore non-editable display
                document.querySelector('.profile-name').textContent = newName;
                document.querySelector('.profile-bio').textContent = newBio;
                
                // Change button back
                e.target.innerHTML = originalText;
                e.target.textContent = 'Edit Profile';
                e.target.removeEventListener('click', saveChanges);
                e.target.addEventListener('click', startEditing);
                
            } else {
                // Get values from about section fields
                const editFields = document.querySelectorAll('.edit-field input, .edit-field textarea');
                editFields.forEach(field => {
                    const fieldName = field.dataset.field;
                    if (fieldName?.includes('.')) {
                        const [parent, child] = fieldName.split('.');
                        if (!updates[parent]) updates[parent] = {};
                        updates[parent][child] = field.value;
                    } else if (fieldName) {
                        updates[fieldName] = field.value;
                    }
                });
                
                // Hide edit fields, show values
                const sectionElement = document.querySelector('.about-user-section, .profile-topics-section');
                const fields = sectionElement.querySelectorAll('.about-field');
                fields.forEach(field => {
                    const valueEl = field.querySelector('.field-value');
                    const editEl = field.querySelector('.edit-field');
                    if (valueEl && editEl) {
                        // Update displayed value
                        const fieldInput = editEl.querySelector('[data-field]');
                        if (fieldInput) {
                            if (fieldInput.dataset.field === 'website') {
                                valueEl.innerHTML = `<a href="https://${fieldInput.value}" target="_blank">${fieldInput.value}</a>`;
                            } else if (fieldInput.dataset.field === 'education.degree') {
                                const institution = editEl.querySelector('[data-field="education.institution"]');
                                valueEl.innerHTML = `${fieldInput.value}<br>${institution ? institution.value : ''}`;
                            } else if (fieldInput.dataset.field !== 'education.institution') {
                                valueEl.textContent = fieldInput.value;
                            }
                        }
                        
                        valueEl.style.display = 'block';
                        editEl.style.display = 'none';
                    }
                });
                
                // Show edit button, hide save/cancel
                const editBtn = sectionElement.querySelector('.edit-profile-btn');
                const actions = sectionElement.querySelector('.edit-actions');
                if (editBtn && actions) {
                    editBtn.style.display = 'block';
                    actions.style.display = 'none';
                }
            }
            
            // Update the local userData object
            Object.keys(updates).forEach(key => {
                if (typeof updates[key] === 'object') {
                    if (!userData[key]) userData[key] = {};
                    Object.keys(updates[key]).forEach(subKey => {
                        userData[key][subKey] = updates[key][subKey];
                    });
                } else {
                    userData[key] = updates[key];
                }
            });
            
            // If user is logged in, save to Firebase
            if (currentUser) {
                await db.collection('users').doc(currentUser.uid).update(updates);
                showNotification('Profile updated successfully', 'success');
                console.log('Profile updated successfully');
            } else {
                showNotification('Profile would be updated if logged in', 'info');
                console.log('Profile would be updated if logged in');
            }
        
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Failed to update profile. Please try again.', 'error');
        } finally {
            // Reset disabled state
            e.target.disabled = false;
            
            // Clear stored original values
            delete window.originalProfileValues;
        }
        
        isEditing = false;
    }
    
    // Cancel editing
    function cancelEditing(e) {
        const section = e.target.dataset.section || 'header';
        isEditing = false;
        
        if (section === 'header') {
            // Restore header elements
            document.querySelector('.profile-name').textContent = userData.displayName;
            document.querySelector('.profile-bio').textContent = userData.bio;
            
            // Change button back
            const editBtn = document.querySelector('.edit-profile-header-btn');
            editBtn.textContent = 'Edit Profile';
            editBtn.removeEventListener('click', saveChanges);
            editBtn.addEventListener('click', startEditing);
        } else {
            // Hide edit fields, show values for a section
            const sectionElement = document.querySelector('.about-user-section, .profile-topics-section');
            if (sectionElement) {
                const fields = sectionElement.querySelectorAll('.about-field');
                fields.forEach(field => {
                    const valueEl = field.querySelector('.field-value');
                    const editEl = field.querySelector('.edit-field');
                    if (valueEl && editEl) {
                        valueEl.style.display = 'block';
                        editEl.style.display = 'none';
                    }
                });
                
                // Show edit button, hide save/cancel
                const editBtn = sectionElement.querySelector('.edit-profile-btn');
                const actions = sectionElement.querySelector('.edit-actions');
                if (editBtn && actions) {
                    editBtn.style.display = 'block';
                    actions.style.display = 'none';
                }
            }
        }
    }
    
    // Setup tab navigation
    function setupTabNavigation() {
        // Make sure at least one tab is active by default
        let hasActiveTab = false;
        profileTabs.forEach(tab => {
            if (tab.classList.contains('active')) {
                hasActiveTab = true;
            }
        });
        
        // If no tab is active, activate the Discussions tab by default
        if (!hasActiveTab && profileTabs.length > 0) {
            const discussionsTab = Array.from(profileTabs).find(tab => tab.dataset.tab === 'discussions');
            if (discussionsTab) {
                discussionsTab.classList.add('active');
                const discussionsContent = document.querySelector('.tab-section.discussions-tab');
                if (discussionsContent) {
                    discussionsContent.classList.add('active');
                }
            } else {
                // If there's no discussions tab, just activate the first tab
                profileTabs[0].classList.add('active');
                const firstTabName = profileTabs[0].dataset.tab;
                const firstTabContent = document.querySelector(`.tab-section.${firstTabName}-tab`);
                if (firstTabContent) {
                    firstTabContent.classList.add('active');
                }
            }
        }
        
        // Handle tab clicks
        profileTabs.forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all tabs
                profileTabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Hide all tab sections
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                // Show the corresponding tab content
                const tabName = this.dataset.tab;
                const targetTabContent = document.querySelector(`.tab-section.${tabName}-tab`);
                
                if (targetTabContent) {
                    targetTabContent.classList.add('active');
                } else if (tabName === 'discussions') {
                    document.querySelector('.tab-section.discussions-tab').classList.add('active');
                }
                
                // Toggle sidebar visibility based on tab
                if (tabName === 'about') {
                    // Hide sidebar when viewing About tab since the content is duplicated
                    if (profileSidebar) {
                        profileSidebar.style.display = 'none';
                    }
                    
                    // Expand the main content to take full width
                    const mainContent = document.querySelector('.profile-main-content');
                    if (mainContent) {
                        mainContent.style.maxWidth = '100%';
                    }
                } else {
                    // Show sidebar for other tabs
                    if (profileSidebar) {
                        profileSidebar.style.display = 'block';
                    }
                    
                    // Reset the main content width
                    const mainContent = document.querySelector('.profile-main-content');
                    if (mainContent) {
                        mainContent.style.maxWidth = '';
                    }
                }
            });
        });
    }
    
    // Image upload functionality
    function setupImageUpload() {
        // Add avatar and cover photo upload buttons
        const avatarContainer = document.querySelector('.profile-avatar');
        const coverContainer = document.querySelector('.profile-cover');
        
        // Only add buttons if they don't already exist
        if (!avatarContainer.querySelector('.image-upload-btn')) {
            const avatarUploadBtn = document.createElement('button');
            avatarUploadBtn.className = 'image-upload-btn avatar-upload';
            avatarUploadBtn.innerHTML = '<i class="fas fa-camera"></i>';
            avatarContainer.appendChild(avatarUploadBtn);
            
            // Event listener for avatar upload
            avatarUploadBtn.addEventListener('click', () => uploadImage('avatar'));
        }
        
        if (!coverContainer.querySelector('.image-upload-btn')) {
            const coverUploadBtn = document.createElement('button');
            coverUploadBtn.className = 'image-upload-btn cover-upload';
            coverUploadBtn.innerHTML = '<i class="fas fa-camera"></i>';
            coverContainer.appendChild(coverUploadBtn);
            
            // Event listener for cover upload
            coverUploadBtn.addEventListener('click', () => uploadImage('cover'));
            
            // Add gradient button if it doesn't exist
            if (!coverContainer.querySelector('.gradient-btn')) {
                const gradientBtn = document.createElement('button');
                gradientBtn.className = 'image-upload-btn gradient-btn';
                gradientBtn.innerHTML = '<i class="fas fa-palette"></i>';
                gradientBtn.style.right = '65px'; // Position to the left of the camera button
                coverContainer.appendChild(gradientBtn);
                
                // Event listener for gradient selection
                gradientBtn.addEventListener('click', showGradientPicker);
            }
        }
    }
    
    // Image upload function
    async function uploadImage(type) {
        if (!currentUser) {
            alert('You must be logged in to upload images');
            return;
        }
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.click();
        
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                // Show a loading indicator
                const targetElement = type === 'avatar' ? 
                    document.querySelector('.profile-avatar') : 
                    document.querySelector('.profile-cover');
                    
                if (targetElement) {
                    const loadingIndicator = document.createElement('div');
                    loadingIndicator.className = 'upload-loading';
                    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    loadingIndicator.style.position = 'absolute';
                    loadingIndicator.style.top = '50%';
                    loadingIndicator.style.left = '50%';
                    loadingIndicator.style.transform = 'translate(-50%, -50%)';
                    loadingIndicator.style.backgroundColor = 'rgba(0,0,0,0.5)';
                    loadingIndicator.style.color = 'white';
                    loadingIndicator.style.borderRadius = type === 'avatar' ? '50%' : '8px';
                    loadingIndicator.style.width = type === 'avatar' ? '128px' : '100%';
                    loadingIndicator.style.height = type === 'avatar' ? '128px' : '100%';
                    loadingIndicator.style.display = 'flex';
                    loadingIndicator.style.alignItems = 'center';
                    loadingIndicator.style.justifyContent = 'center';
                    loadingIndicator.style.fontSize = '2rem';
                    loadingIndicator.style.zIndex = '10';
                    
                    targetElement.style.position = 'relative';
                    targetElement.appendChild(loadingIndicator);
                }
                
                const storageRef = storage.ref(`users/${currentUser.uid}/${type}_${Date.now()}`);
                const uploadTask = storageRef.put(file);
                
                uploadTask.on('state_changed', 
                    (snapshot) => {
                        // Progress tracking if needed
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`Upload is ${progress}% done`);
                    },
                    (error) => {
                        // Remove loading indicator
                        document.querySelector('.upload-loading')?.remove();
                        console.error('Upload failed:', error);
                        alert('Upload failed. Please try again.');
                    },
                    async () => {
                        // Handle successful upload
                        const downloadURL = await storageRef.getDownloadURL();
                        
                        // Remove loading indicator
                        document.querySelector('.upload-loading')?.remove();
                        
                        // Update UI
                        if (type === 'avatar') {
                            document.querySelector('.profile-avatar img').src = downloadURL;
                            userData.avatarUrl = downloadURL;
                            userData.photoURL = downloadURL;  // Update photoURL as well
                            
                            // Update Firebase Auth profile
                            try {
                                await currentUser.updateProfile({
                                    photoURL: downloadURL
                                });
                                console.log('Auth profile photo updated');
                            } catch (error) {
                                console.error('Error updating auth profile:', error);
                            }
                            
                            // Update Firestore with both fields
                            await db.collection('users').doc(currentUser.uid).update({
                                avatarUrl: downloadURL,
                                photoURL: downloadURL
                            });
                        } else {
                            document.querySelector('.profile-cover img').src = downloadURL;
                            userData.coverUrl = downloadURL;
                            
                            // Update Firestore
                            await db.collection('users').doc(currentUser.uid).update({
                                coverUrl: downloadURL
                            });
                        }
                        
                        console.log(`${type} updated successfully`);
                    }
                );
            } catch (error) {
                // Remove loading indicator if any
                document.querySelector('.upload-loading')?.remove();
                console.error('Error uploading image:', error);
                alert('Failed to upload image. Please try again.');
            }
        });
    }

    // Show gradient color picker for cover
    function showGradientPicker() {
        // Check if gradient picker already exists
        if (document.getElementById('gradient-picker-container')) {
            return;
        }

        // Remove any existing gradient picker and overlay
        document.getElementById('gradient-picker-container')?.remove();
        document.getElementById('gradient-picker-overlay')?.remove();

        // Create and append overlay to body first (not to cover container)
        const overlay = document.createElement('div');
        overlay.id = 'gradient-picker-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '1000'; // High z-index
        document.body.appendChild(overlay);
        
        // Create gradient picker container
        const gradientPickerContainer = document.createElement('div');
        gradientPickerContainer.id = 'gradient-picker-container';
        gradientPickerContainer.className = 'gradient-picker-container';
        
        // Apply styles directly to ensure proper positioning and z-index
        gradientPickerContainer.style.position = 'fixed'; // Fixed instead of absolute
        gradientPickerContainer.style.top = '50%';
        gradientPickerContainer.style.left = '50%';
        gradientPickerContainer.style.transform = 'translate(-50%, -50%)';
        gradientPickerContainer.style.backgroundColor = 'var(--background-light, #fff)';
        gradientPickerContainer.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        gradientPickerContainer.style.borderRadius = '8px';
        gradientPickerContainer.style.padding = '20px';
        gradientPickerContainer.style.width = '350px';
        gradientPickerContainer.style.maxWidth = '90%';
        gradientPickerContainer.style.zIndex = '1001'; // Higher than overlay
        gradientPickerContainer.style.color = 'var(--text-color, #333)';
        
        // Create gradient picker UI
        gradientPickerContainer.innerHTML = `
            <div class="gradient-picker-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid var(--border-color, #eee); padding-bottom: 10px;">
                <h3 style="margin: 0; font-size: 18px;">Choose Cover Gradient</h3>
                <button class="close-gradient-picker" style="background: none; border: none; cursor: pointer; font-size: 18px; color: var(--text-muted, #666);">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="gradient-color-inputs" style="margin-bottom: 20px;">
                <div class="color-input-group" style="margin-bottom: 15px;">
                    <label for="gradient-color-1" style="display: block; margin-bottom: 5px; font-weight: 500;">Start Color</label>
                    <input type="color" id="gradient-color-1" value="#087ea4" style="width: 100%; height: 40px; border: 1px solid var(--border-color, #ddd); border-radius: 4px;">
                </div>
                <div class="color-input-group" style="margin-bottom: 15px;">
                    <label for="gradient-color-2" style="display: block; margin-bottom: 5px; font-weight: 500;">End Color</label>
                    <input type="color" id="gradient-color-2" value="#2bc4bc" style="width: 100%; height: 40px; border: 1px solid var(--border-color, #ddd); border-radius: 4px;">
                </div>
                <div class="direction-select-group" style="margin-bottom: 15px;">
                    <label for="gradient-direction" style="display: block; margin-bottom: 5px; font-weight: 500;">Direction</label>
                    <select id="gradient-direction" style="width: 100%; height: 40px; border: 1px solid var(--border-color, #ddd); border-radius: 4px; padding: 0 10px; background-color: var(--background-light, #fff);">
                        <option value="to right">→ Horizontal</option>
                        <option value="to bottom">↓ Vertical</option>
                        <option value="to right bottom">↘ Diagonal</option>
                        <option value="to left bottom">↙ Reverse Diagonal</option>
                    </select>
                </div>
            </div>
            <div class="gradient-preview" style="margin-bottom: 20px;">
                <div id="gradient-preview-box" style="width: 100%; height: 80px; border-radius: 6px; border: 1px solid var(--border-color, #ddd);"></div>
            </div>
            <div class="gradient-actions" style="display: flex; justify-content: space-between; gap: 10px;">
                <button class="save-gradient-btn" style="flex: 1; background-color: var(--primary-color, #087ea4); color: white; border: none; border-radius: 4px; padding: 10px 15px; font-weight: 500; cursor: pointer;">Save as Cover</button>
                <button class="cancel-gradient-btn" style="flex: 1; background-color: var(--background-light, #f5f5f5); border: 1px solid var(--border-color, #ddd); border-radius: 4px; padding: 10px 15px; font-weight: 500; cursor: pointer;">Cancel</button>
            </div>
        `;
        
        // Add picker to body, not to the cover container
        document.body.appendChild(gradientPickerContainer);
        
        // Get UI elements
        const closeBtn = gradientPickerContainer.querySelector('.close-gradient-picker');
        const color1Input = document.getElementById('gradient-color-1');
        const color2Input = document.getElementById('gradient-color-2');
        const directionSelect = document.getElementById('gradient-direction');
        const previewBox = document.getElementById('gradient-preview-box');
        const saveGradientBtn = gradientPickerContainer.querySelector('.save-gradient-btn');
        const cancelGradientBtn = gradientPickerContainer.querySelector('.cancel-gradient-btn');
        
        // Update preview on input change
        function updatePreview() {
            const direction = directionSelect.value;
            const color1 = color1Input.value;
            const color2 = color2Input.value;
            
            previewBox.style.background = `linear-gradient(${direction}, ${color1}, ${color2})`;
        }
        
        // Set initial preview
        updatePreview();
        
        // Function to close the gradient picker and clean up
        function closeGradientPicker() {
            document.getElementById('gradient-picker-container')?.remove();
            document.getElementById('gradient-picker-overlay')?.remove();
        }
        
        // Add event listeners
        color1Input.addEventListener('input', updatePreview);
        color2Input.addEventListener('input', updatePreview);
        directionSelect.addEventListener('change', updatePreview);
        
        closeBtn.addEventListener('click', closeGradientPicker);
        overlay.addEventListener('click', closeGradientPicker);
        
        cancelGradientBtn.addEventListener('click', closeGradientPicker);
        
        saveGradientBtn.addEventListener('click', () => {
            const direction = directionSelect.value;
            const color1 = color1Input.value;
            const color2 = color2Input.value;
            
            saveGradientCover(direction, color1, color2);
            closeGradientPicker();
        });
    }

    // Save gradient cover to Firebase
    async function saveGradientCover(direction, color1, color2) {
        if (!currentUser) {
            alert('You must be logged in to save a gradient cover');
            return;
        }
        
        try {
            // Show loading indicator
            const coverElement = document.querySelector('.profile-cover');
            if (!coverElement) return;
            
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'upload-loading';
            loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            loadingIndicator.style.position = 'absolute';
            loadingIndicator.style.top = '50%';
            loadingIndicator.style.left = '50%';
            loadingIndicator.style.transform = 'translate(-50%, -50%)';
            loadingIndicator.style.backgroundColor = 'rgba(0,0,0,0.5)';
            loadingIndicator.style.color = 'white';
            loadingIndicator.style.borderRadius = '8px';
            loadingIndicator.style.width = '100%';
            loadingIndicator.style.height = '100%';
            loadingIndicator.style.display = 'flex';
            loadingIndicator.style.alignItems = 'center';
            loadingIndicator.style.justifyContent = 'center';
            loadingIndicator.style.fontSize = '2rem';
            loadingIndicator.style.zIndex = '10';
            
            coverElement.style.position = 'relative';
            coverElement.appendChild(loadingIndicator);
            
            // Create gradient data object
            const gradientData = {
                direction: direction,
                colors: [color1, color2],
                timestamp: new Date().toISOString()
            };
            
            // Update user data in Firestore
            await db.collection('users').doc(currentUser.uid).update({
                coverType: 'gradient',
                coverGradient: gradientData,
                coverUrl: null // Clear any existing image URL
            });
            
            // Update local user data
            userData.coverType = 'gradient';
            userData.coverGradient = gradientData;
            userData.coverUrl = null;
            
            // Apply gradient to the cover container
                coverElement.style.background = `linear-gradient(${direction}, ${color1}, ${color2})`;
                
                // Hide the cover image if it exists
                const coverImg = coverElement.querySelector('img');
                if (coverImg) {
                    coverImg.style.display = 'none';
            }
            
            // Remove loading indicator
            loadingIndicator.remove();
            
            // Show success notification
            showNotification('Gradient cover saved successfully!', 'success');
            
            console.log('Gradient cover saved successfully');
        } catch (error) {
            // Remove loading indicator if any
            document.querySelector('.upload-loading')?.remove();
            console.error('Error saving gradient cover:', error);
            showNotification('Failed to save gradient cover. Please try again.', 'error');
        }
    }

    // Show notification
    function showNotification(message, type = 'info') {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.profile-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `profile-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="close-notification"><i class="fas fa-times"></i></button>
        `;
        
        // Style the notification
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3';
        notification.style.color = 'white';
        notification.style.padding = '12px 16px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        notification.style.zIndex = '9999';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.justifyContent = 'space-between';
        notification.style.minWidth = '250px';
        notification.style.maxWidth = '80%';
        notification.style.animation = 'fadeInUp 0.3s ease-out forwards';
        
        // Add styles for the content
        const content = notification.querySelector('.notification-content');
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.style.gap = '8px';
        
        // Add styles for the close button
        const closeBtn = notification.querySelector('.close-notification');
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'white';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.padding = '0';
        closeBtn.style.fontSize = '16px';
        closeBtn.style.marginLeft = '10px';
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Add keyframes for animation if not already present
        if (!document.getElementById('notification-keyframes')) {
            const keyframes = document.createElement('style');
            keyframes.id = 'notification-keyframes';
            keyframes.textContent = `
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                    }
                    to {
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(keyframes);
        }
        
        // Add event listener to close button
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 5000);
    }

    // Show shimmer loading effects for profile
    function showProfileShimmer() {
        // Add shimmer styles if not already present
        addShimmerStyles();
        
        // Profile avatar shimmer
        const profileAvatar = document.querySelector('.profile-avatar');
        if (profileAvatar) {
            const avatarImg = profileAvatar.querySelector('img');
            if (avatarImg) {
                avatarImg.style.display = 'none';
                const shimmerElement = document.createElement('div');
                shimmerElement.className = 'shimmer avatar-shimmer';
                shimmerElement.style.width = '128px';
                shimmerElement.style.height = '128px';
                shimmerElement.style.borderRadius = '50%';
                profileAvatar.appendChild(shimmerElement);
            }
        }
        
        // Profile cover shimmer
        const profileCover = document.querySelector('.profile-cover');
        if (profileCover) {
            const coverImg = profileCover.querySelector('img');
            if (coverImg) {
                coverImg.style.opacity = '0';
                const shimmerElement = document.createElement('div');
                shimmerElement.className = 'shimmer cover-shimmer';
                shimmerElement.style.position = 'absolute';
                shimmerElement.style.top = '0';
                shimmerElement.style.left = '0';
                shimmerElement.style.width = '100%';
                shimmerElement.style.height = '100%';
                profileCover.style.position = 'relative';
                profileCover.appendChild(shimmerElement);
            }
        }
        
        // Profile info shimmer
        const profileInfo = document.querySelector('.profile-info');
        if (profileInfo) {
            profileInfo.innerHTML = `
                <div class="shimmer text-shimmer" style="width: 200px; height: 32px; margin-bottom: 10px;"></div>
                <div class="shimmer text-shimmer" style="width: 300px; height: 18px; margin-bottom: 20px;"></div>
                <div class="profile-stats">
                    <div class="profile-stat">
                        <span class="shimmer stat-shimmer" style="width: 30px; height: 20px;"></span>
                        <span class="shimmer stat-shimmer" style="width: 80px; height: 16px;"></span>
                    </div>
                    <div class="profile-stat">
                        <span class="shimmer stat-shimmer" style="width: 30px; height: 20px;"></span>
                        <span class="shimmer stat-shimmer" style="width: 80px; height: 16px;"></span>
                    </div>
                    <div class="profile-stat">
                        <span class="shimmer stat-shimmer" style="width: 30px; height: 20px;"></span>
                        <span class="shimmer stat-shimmer" style="width: 80px; height: 16px;"></span>
                    </div>
                    <div class="profile-stat">
                        <span class="shimmer stat-shimmer" style="width: 30px; height: 20px;"></span>
                        <span class="shimmer stat-shimmer" style="width: 80px; height: 16px;"></span>
                    </div>
                </div>
            `;
        }
        
        // Sidebar shimmer effects
        const sidebar = document.querySelector('.profile-sidebar');
        if (sidebar) {
            // About user card shimmer
            const aboutUserCard = sidebar.querySelector('.sidebar-card.about-user');
            if (aboutUserCard) {
                aboutUserCard.innerHTML = `
                    <div class="shimmer text-shimmer" style="width: 150px; height: 24px; margin-bottom: 15px;"></div>
                    
                    <div class="about-item-shimmer" style="display: flex; margin-bottom: 15px;">
                        <div class="shimmer icon-shimmer" style="width: 24px; height: 24px; margin-right: 10px;"></div>
                        <div style="flex-grow: 1;">
                            <div class="shimmer text-shimmer" style="width: 80px; height: 18px; margin-bottom: 8px;"></div>
                            <div class="shimmer text-shimmer" style="width: 100%; height: 16px; margin-bottom: 4px;"></div>
                            <div class="shimmer text-shimmer" style="width: 80%; height: 16px;"></div>
                        </div>
                    </div>
                    
                    <div class="about-item-shimmer" style="display: flex; margin-bottom: 15px;">
                        <div class="shimmer icon-shimmer" style="width: 24px; height: 24px; margin-right: 10px;"></div>
                        <div style="flex-grow: 1;">
                            <div class="shimmer text-shimmer" style="width: 80px; height: 18px; margin-bottom: 8px;"></div>
                            <div class="shimmer text-shimmer" style="width: 60%; height: 16px;"></div>
                        </div>
                    </div>
                    
                    <div class="about-item-shimmer" style="display: flex; margin-bottom: 15px;">
                        <div class="shimmer icon-shimmer" style="width: 24px; height: 24px; margin-right: 10px;"></div>
                        <div style="flex-grow: 1;">
                            <div class="shimmer text-shimmer" style="width: 80px; height: 18px; margin-bottom: 8px;"></div>
                            <div class="shimmer text-shimmer" style="width: 70%; height: 16px;"></div>
                        </div>
                    </div>
                    
                    <div class="about-item-shimmer" style="display: flex;">
                        <div class="shimmer icon-shimmer" style="width: 24px; height: 24px; margin-right: 10px;"></div>
                        <div style="flex-grow: 1;">
                            <div class="shimmer text-shimmer" style="width: 80px; height: 18px; margin-bottom: 8px;"></div>
                            <div class="shimmer text-shimmer" style="width: 90%; height: 16px;"></div>
                        </div>
                    </div>
                `;
            }
            
            // Topics card shimmer
            const topicsCard = sidebar.querySelector('.sidebar-card.user-topics');
            if (topicsCard) {
                topicsCard.innerHTML = `
                    <div class="shimmer text-shimmer" style="width: 120px; height: 24px; margin-bottom: 15px;"></div>
                    
                    <div class="shimmer topic-shimmer" style="height: 18px; margin-bottom: 10px;"></div>
                    <div class="shimmer topic-shimmer" style="height: 18px; margin-bottom: 10px;"></div>
                    <div class="shimmer topic-shimmer" style="height: 18px; margin-bottom: 10px;"></div>
                    <div class="shimmer topic-shimmer" style="height: 18px; margin-bottom: 10px;"></div>
                    <div class="shimmer topic-shimmer" style="height: 18px;"></div>
                `;
            }
            
            // Achievements card shimmer
            const achievementsCard = sidebar.querySelector('.sidebar-card.user-achievements');
            if (achievementsCard) {
                achievementsCard.innerHTML = `
                    <div class="shimmer text-shimmer" style="width: 150px; height: 24px; margin-bottom: 15px;"></div>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                        <div class="shimmer achievement-shimmer" style="height: 70px; border-radius: 8px;"></div>
                        <div class="shimmer achievement-shimmer" style="height: 70px; border-radius: 8px;"></div>
                        <div class="shimmer achievement-shimmer" style="height: 70px; border-radius: 8px;"></div>
                        <div class="shimmer achievement-shimmer" style="height: 70px; border-radius: 8px;"></div>
                        <div class="shimmer achievement-shimmer" style="height: 70px; border-radius: 8px;"></div>
                    </div>
                `;
            }
        }
        
        // Posts list shimmer
        const postsList = document.querySelector('.posts-list');
        if (postsList) {
            let postsShimmer = '';
            for (let i = 0; i < 3; i++) {
                postsShimmer += `
                    <div class="post-item shimmer-post">
                        <div class="vote-controls">
                            <div class="shimmer vote-shimmer" style="width: 36px; height: 36px; border-radius: 50%; margin-bottom: 5px;"></div>
                            <div class="shimmer vote-shimmer" style="width: 20px; height: 20px; margin: 5px 0;"></div>
                            <div class="shimmer vote-shimmer" style="width: 36px; height: 36px; border-radius: 50%;"></div>
                        </div>
                        <div class="post-content">
        <div class="post-header">
                                <div class="shimmer title-shimmer" style="width: 70%; height: 24px; margin-bottom: 10px;"></div>
        </div>
                            <div class="post-body">
                                <div class="shimmer content-shimmer" style="width: 100%; height: 60px;"></div>
            </div>
                        </div>
        </div>
    `;
            }
            postsList.innerHTML = postsShimmer;
        }
    }
    
    // Hide shimmer effects
    function hideProfileShimmer() {
        console.log('Hiding profile shimmer...');
        
        // Remove avatar shimmer
        const profileAvatar = document.querySelector('.profile-avatar');
        if (profileAvatar) {
            const shimmer = profileAvatar.querySelector('.avatar-shimmer');
            if (shimmer) {
                shimmer.remove();
            }
            const avatarImg = profileAvatar.querySelector('img');
            if (avatarImg) {
                avatarImg.style.display = 'block';
            }
        }
        
        // Remove cover shimmer
        const profileCover = document.querySelector('.profile-cover');
        if (profileCover) {
            const shimmer = profileCover.querySelector('.cover-shimmer');
            if (shimmer) {
                shimmer.remove();
            }
            const coverImg = profileCover.querySelector('img');
            if (coverImg) {
                coverImg.style.opacity = '1';
            }
        }
        
        // Re-render profile info
        const profileInfo = document.querySelector('.profile-info');
        if (profileInfo) {
            const profileName = document.createElement('h1');
            profileName.className = 'profile-name';
            profileName.textContent = userData.displayName || (currentUser ? currentUser.displayName : 'User');
            
            const profileBio = document.createElement('p');
            profileBio.className = 'profile-bio';
            profileBio.textContent = userData.bio || 'No bio available';
            
            // Build badges container
            const badgesContainer = document.createElement('div');
            badgesContainer.className = 'profile-badges';
            
            // Verified badge
            if (userData.verified) {
                const verifiedBadge = document.createElement('span');
                verifiedBadge.className = 'profile-badge verified';
                verifiedBadge.innerHTML = '<i class="fas fa-check-circle"></i> Verified';
                badgesContainer.appendChild(verifiedBadge);
            }
            
            // Premium badge
            if (userData.premium) {
                const premiumBadge = document.createElement('span');
                premiumBadge.className = 'profile-badge premium';
                premiumBadge.innerHTML = '<i class="fas fa-crown"></i> Premium';
                badgesContainer.appendChild(premiumBadge);
            }
            
            // Clear and rebuild profile info
            profileInfo.innerHTML = '';
            profileInfo.appendChild(profileName);
            profileInfo.appendChild(profileBio);
            profileInfo.appendChild(badgesContainer);
            
            // Rebuild stats
            const statsContainer = document.createElement('div');
            statsContainer.className = 'profile-stats';
            
            // Stats data
            const stats = [
                { value: userData.stats?.discussions || 0, label: 'Discussions' },
                { value: formatNumber(userData.stats?.reputation || 0), label: 'Reputation' },
                { value: userData.stats?.comments || 0, label: 'Comments' },
                { value: userData.stats?.joined || '', label: 'Joined' }
            ];
            
            stats.forEach(stat => {
                const statEl = document.createElement('div');
                statEl.className = 'profile-stat';
                
                const valueEl = document.createElement('span');
                valueEl.className = 'stat-value';
                valueEl.textContent = stat.value;
                
                const labelEl = document.createElement('span');
                labelEl.className = 'stat-label';
                labelEl.textContent = stat.label;
                
                statEl.appendChild(valueEl);
                statEl.appendChild(labelEl);
                statsContainer.appendChild(statEl);
            });
            
            profileInfo.appendChild(statsContainer);
        }
        
        // Remove shimmer from sidebar
        const sidebar = document.querySelector('.profile-sidebar');
        if (sidebar) {
            // Restore sidebar content by re-rendering it
            renderSidebar();
        }
        
        // Remove posts shimmer and render discussions
        const shimmerPosts = document.querySelectorAll('.shimmer-post');
        shimmerPosts.forEach(post => post.remove());
        renderDiscussions();
        
        // Remove any remaining shimmer elements
        document.querySelectorAll('.shimmer').forEach(el => {
            // Make sure it's not inside a template or hidden section
            if (el.offsetParent !== null) {
                el.remove();
            }
        });
        
        // Ensure tabs are set up properly
        setupTabNavigation();
        
        console.log('Profile shimmer hidden, content now visible');
    }
    
    // Add shimmer styles to the document if not already present
    function addShimmerStyles() {
        if (!document.getElementById('shimmer-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'shimmer-styles';
            styleEl.textContent = `
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
                
                .avatar-shimmer {
                    border-radius: 50%;
                }
                
                .shimmer-post {
                    display: flex;
                    padding: 20px;
                    margin-bottom: 20px;
                    border-radius: 8px;
                    background-color: var(--background-light, #f0f2f5);
                }
                
                /* Additional styles for avatar consistency */
                .profile-avatar {
                    position: relative;
                    width: 128px;
                    height: 128px;
                    border-radius: 50%;
                    overflow: hidden;
                    margin-right: 20px;
                    border: 4px solid #fff;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                
                .profile-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 50%;
                }
                
                .image-upload-btn {
                    position: absolute;
                    bottom: 5px;
                    right: 5px;
                    background-color: var(--primary-color, #087ea4);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    z-index: 5;
                }
                
                .image-upload-btn:hover {
                    background-color: var(--primary-dark, #065e7a);
                    transform: scale(1.1);
                }
                
                .cover-upload {
                    top: 10px;
                    right: 10px;
                    bottom: auto;
                }
                
                /* Better position for loading indicator */
                .upload-loading {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
            `;
            document.head.appendChild(styleEl);
        }
    }

    // Show notification function
    function showNotification(message, type = 'info') {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close"><i class="fas fa-times"></i></button>
            </div>
        `;

        // Add styles if not already in CSS
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 350px;
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease-out;
                animation: slideIn 0.3s forwards;
            }
            .notification-content {
                padding: 15px 20px;
                border-radius: 5px;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .notification-success .notification-content {
                background-color: #d4edda;
                color: #155724;
                border-left: 4px solid #28a745;
            }
            .notification-error .notification-content {
                background-color: #f8d7da;
                color: #721c24;
                border-left: 4px solid #dc3545;
            }
            .notification-info .notification-content {
                background-color: #d1ecf1;
                color: #0c5460;
                border-left: 4px solid #17a2b8;
            }
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                margin-left: 10px;
                opacity: 0.7;
            }
            .notification-close:hover {
                opacity: 1;
            }
            @keyframes slideIn {
                to { transform: translateX(0); }
            }
            @keyframes slideOut {
                to { transform: translateX(400px); }
            }
            .notification.closing {
                animation: slideOut 0.3s forwards;
            }
            @media (max-width: 768px) {
                .notification {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);

        // Add to document
        document.body.appendChild(notification);

        // Add close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.add('closing');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.classList.add('closing');
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    // Initialize variables to store original profile values
    window.originalProfileValues = {};

    // Start editing a section
    function startEditing(e) {
        const section = e.target.dataset.section || 'header';
        isEditing = true;
        
        // Store original values for comparison
        window.originalProfileValues = window.originalProfileValues || {};
        
        if (section === 'header') {
            // Enable editing of header elements
            const nameElement = document.querySelector('.profile-name');
            const bioElement = document.querySelector('.profile-bio');
            
            // Store original values
            window.originalProfileValues.displayName = userData.displayName;
            window.originalProfileValues.bio = userData.bio;
            
            // Replace with editable fields
            nameElement.innerHTML = `<input type="text" id="edit-name" value="${userData.displayName}">`;
            bioElement.innerHTML = `<textarea id="edit-bio">${userData.bio}</textarea>`;
            
            // Add input change listeners to toggle save button visibility
            const nameInput = document.getElementById('edit-name');
            const bioInput = document.getElementById('edit-bio');
            
            // Change button to Save
            e.target.textContent = 'Save Profile';
            e.target.classList.add('disabled-btn');
            e.target.style.opacity = '0.6';
            e.target.style.cursor = 'default';
            e.target.removeEventListener('click', startEditing);
            e.target.addEventListener('click', () => saveChanges({ target: { dataset: { section: 'header' } } }));
            
            // Add event listeners to detect changes
            function checkForChanges() {
                const displayNameChanged = nameInput.value !== window.originalProfileValues.displayName;
                const bioChanged = bioInput.value !== window.originalProfileValues.bio;
                
                if (displayNameChanged || bioChanged) {
                    e.target.classList.remove('disabled-btn');
                    e.target.style.opacity = '1';
                    e.target.style.cursor = 'pointer';
                } else {
                    e.target.classList.add('disabled-btn');
                    e.target.style.opacity = '0.6';
                    e.target.style.cursor = 'default';
                }
            }
            
            nameInput.addEventListener('input', checkForChanges);
            bioInput.addEventListener('input', checkForChanges);
            
        } else {
            // Enable editing for other sections
            const sectionElement = document.querySelector('.about-user-section, .profile-topics-section');
            if (sectionElement) {
                // Store original values
                window.originalProfileValues[section] = {};
                
                const fields = sectionElement.querySelectorAll('.about-field');
                fields.forEach(field => {
                    const valueEl = field.querySelector('.field-value');
                    const editEl = field.querySelector('.edit-field');
                    if (valueEl && editEl) {
                        const fieldInputs = editEl.querySelectorAll('[data-field]');
                        
                        // Store original values for each field
                        fieldInputs.forEach(input => {
                            const fieldName = input.dataset.field;
                            window.originalProfileValues[section][fieldName] = input.value;
                        });
                        
                        valueEl.style.display = 'none';
                        editEl.style.display = 'block';
                    }
                });
                
                // Show save/cancel buttons
                const editBtn = sectionElement.querySelector('.edit-profile-btn');
                const actions = sectionElement.querySelector('.edit-actions');
                if (editBtn && actions) {
                    editBtn.style.display = 'none';
                    actions.style.display = 'flex';
                }
                
                // Disable the save button initially
                const saveBtn = actions.querySelector('.save-profile-btn');
                saveBtn.classList.add('disabled-btn');
                saveBtn.style.opacity = '0.6';
                saveBtn.style.cursor = 'default';
                
                // Add change event listeners to all inputs
                const inputs = sectionElement.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    const fieldName = input.dataset.field;
                    if (fieldName) {
                        input.addEventListener('input', () => {
                            let hasChanges = false;
                            
                            // Check all inputs for changes
                            inputs.forEach(inp => {
                                const field = inp.dataset.field;
                                if (field && window.originalProfileValues[section][field] !== inp.value) {
                                    hasChanges = true;
                                }
                            });
                            
                            // Enable/disable save button based on changes
                            if (hasChanges) {
                                saveBtn.classList.remove('disabled-btn');
                                saveBtn.style.opacity = '1';
                                saveBtn.style.cursor = 'pointer';
                            } else {
                                saveBtn.classList.add('disabled-btn');
                                saveBtn.style.opacity = '0.6';
                                saveBtn.style.cursor = 'default';
                            }
                        });
                    }
                });
            }
        }
    }
}); 