import {
    isUserLoggedIn,
    getCurrentUser,
    getUserData,
    updateUserProfile,
    updatePassword,
    deleteAccount,
    signOutUser
} from './auth-service.js';

// DOM Elements
let accountForm;
let emailInput;
let currentPasswordInput;
let newPasswordInput;
let confirmPasswordInput;
let saveAccountBtn;

let notificationsForm;
let emailNotifCheckbox;
let commentNotifCheckbox;
let followNotifCheckbox;
let weeklyDigestCheckbox;
let saveNotificationsBtn;

let privacyForm;
let profileVisibilitySelect;
let postVisibilitySelect;
let savePrivacyBtn;

let deleteAccountBtn;
let deleteAccountModal;
let confirmDeleteBtn;
let cancelDeleteBtn;
let deletePasswordInput;

let loadingIndicator;
let errorMessages;
let successMessages;

// Theme and appearance elements
let themeOptions;
let fontOptions;
let fontSizeSlider;
let fontSizeValue;
let fontSizeSample;
let darkModeToggle;
let reduceAnimationsToggle;

// User Data
let currentUser = null;
let userData = null;

document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
    checkAuthAndLoadSettings();
});

function initElements() {
    try {
        // Account settings
        accountForm = document.getElementById('account-form');
        emailInput = document.getElementById('email');
        currentPasswordInput = document.getElementById('current-password');
        newPasswordInput = document.getElementById('new-password');
        confirmPasswordInput = document.getElementById('confirm-password');
        saveAccountBtn = document.getElementById('save-account-btn');

        // Notification settings
        notificationsForm = document.getElementById('notifications-form');
        emailNotifCheckbox = document.getElementById('emailNotifications');
        commentNotifCheckbox = document.getElementById('comment-notifications');
        followNotifCheckbox = document.getElementById('follow-notifications');
        weeklyDigestCheckbox = document.getElementById('weekly-digest');
        saveNotificationsBtn = document.getElementById('save-notifications-btn');

        // Privacy settings
        privacyForm = document.getElementById('privacy-form');
        profileVisibilitySelect = document.getElementById('profile-visibility');
        postVisibilitySelect = document.getElementById('post-visibility');
        savePrivacyBtn = document.getElementById('save-privacy-btn');

        // Delete account
        deleteAccountBtn = document.getElementById('delete-account-btn');
        deleteAccountModal = document.getElementById('delete-account-modal');
        confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        deletePasswordInput = document.getElementById('delete-password');

        // Theme and appearance elements
        themeOptions = document.querySelectorAll('.theme-option');
        fontOptions = document.querySelectorAll('.font-option');
        fontSizeSlider = document.getElementById('fontSizeSlider');
        fontSizeValue = document.getElementById('fontSizeValue');
        fontSizeSample = document.getElementById('fontSizeSample');
        darkModeToggle = document.getElementById('darkModeToggle');
        reduceAnimationsToggle = document.getElementById('reduceAnimations');

        // UI Elements
        loadingIndicator = document.getElementById('loading-indicator');
        errorMessages = document.querySelectorAll('.error-message');
        successMessages = document.querySelectorAll('.success-message');
    } catch (error) {
        console.error('Error initializing elements:', error);
    }
}

function initEventListeners() {
    try {
        // Account form submission
        if (accountForm) {
            accountForm.addEventListener('submit', handleAccountFormSubmit);
        }

        // Notifications form submission
        if (notificationsForm) {
            notificationsForm.addEventListener('submit', handleNotificationsFormSubmit);
        }

        // Privacy form submission
        if (privacyForm) {
            privacyForm.addEventListener('submit', handlePrivacyFormSubmit);
        }

        // Delete account
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', showDeleteAccountModal);
        }

        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', handleDeleteAccount);
        }

        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', hideDeleteAccountModal);
        }

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (deleteAccountModal && event.target === deleteAccountModal) {
                hideDeleteAccountModal();
            }
        });
        
        // Close modal when clicking the X
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', hideDeleteAccountModal);
        }

        // Password visibility toggles
        const passwordToggles = document.querySelectorAll('.password-toggle');
        if (passwordToggles) {
            passwordToggles.forEach(toggle => {
                toggle.addEventListener('click', function() {
                    try {
                        const passwordInput = this.previousElementSibling;
                        const icon = this.querySelector('i');
                        
                        if (passwordInput && icon) {
                            if (passwordInput.type === 'password') {
                                passwordInput.type = 'text';
                                icon.classList.remove('fa-eye');
                                icon.classList.add('fa-eye-slash');
                            } else {
                                passwordInput.type = 'password';
                                icon.classList.remove('fa-eye-slash');
                                icon.classList.add('fa-eye');
                            }
                        }
                    } catch (error) {
                        console.error('Error toggling password visibility:', error);
                    }
                });
            });
        }
        
        // Change Email Button
        const changeEmailBtn = document.getElementById('change-email-btn');
        if (changeEmailBtn) {
            changeEmailBtn.addEventListener('click', () => {
                alert('This feature is coming soon!');
            });
        }
        
        // Change Password Button
        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                alert('This feature is coming soon!');
            });
        }

        // Auto-save appearance settings
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', () => {
                try {
                    applyDarkMode(darkModeToggle.checked);
                    saveAppearanceSettings();
                } catch (error) {
                    console.error('Error applying dark mode:', error);
                }
            });
        }

        if (reduceAnimationsToggle) {
            reduceAnimationsToggle.addEventListener('change', () => {
                try {
                    if (reduceAnimationsToggle.checked) {
                        document.documentElement.classList.add('reduce-animations');
                    } else {
                        document.documentElement.classList.remove('reduce-animations');
                    }
                    saveAppearanceSettings();
                } catch (error) {
                    console.error('Error applying reduce animations:', error);
                }
            });
        }

        // Theme selection with auto-save
        if (themeOptions && themeOptions.length > 0) {
            themeOptions.forEach(option => {
                option.addEventListener('click', () => {
                    try {
                        // Remove active class from all options
                        themeOptions.forEach(opt => opt.classList.remove('active'));
                        
                        // Add active class to clicked option
                        option.classList.add('active');
                        
                        // Get selected theme
                        const theme = option.dataset.theme;
                        
                        // Apply theme
                        applyTheme(theme);
                        
                        // Apply dark mode based on toggle for special themes,
                        // or based on theme selection for light/dark/auto
                        if (darkModeToggle) {
                            if (theme.startsWith('theme-')) {
                                applyDarkMode(darkModeToggle.checked);
                            } else if (theme === 'dark') {
                                darkModeToggle.checked = true;
                                applyDarkMode(true);
                            } else if (theme === 'light') {
                                darkModeToggle.checked = false;
                                applyDarkMode(false);
                            } else if (theme === 'auto') {
                                const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                                darkModeToggle.checked = systemDarkMode;
                                applyDarkMode(systemDarkMode);
                            }
                        }

                        // Auto-save settings
                        saveAppearanceSettings();
                    } catch (error) {
                        console.error('Error applying theme:', error);
                    }
                });
            });
        }

        // Font family selection with auto-save
        if (fontOptions && fontOptions.length > 0) {
            fontOptions.forEach(option => {
                option.addEventListener('click', () => {
                    try {
                        // Remove active class from all options
                        fontOptions.forEach(opt => opt.classList.remove('active'));
                        
                        // Add active class to clicked option
                        option.classList.add('active');
                        
                        // Apply font
                        const font = option.dataset.font;
                        applyFontFamily(font);

                        // Auto-save settings
                        saveAppearanceSettings();
                    } catch (error) {
                        console.error('Error applying font family:', error);
                    }
                });
            });
        }

        // Font size slider with auto-save
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', () => {
                try {
                    const fontSize = fontSizeSlider.value;
                    if (fontSizeValue) fontSizeValue.textContent = fontSize + 'px';
                    if (fontSizeSample) fontSizeSample.style.fontSize = fontSize + 'px';
                } catch (error) {
                    console.error('Error updating font size display:', error);
                }
            });

            fontSizeSlider.addEventListener('change', () => {
                try {
                    applyFontSize(fontSizeSlider.value);
                    saveAppearanceSettings();
                } catch (error) {
                    console.error('Error applying font size:', error);
                }
            });
        }

        // Notification settings with auto-save
        const notificationCheckboxes = [
            document.getElementById('emailNotifications'),
            document.getElementById('pushNotifications'),
            document.getElementById('notificationSound')
        ];

        notificationCheckboxes.forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    try {
                        saveNotificationSettings();
                    } catch (error) {
                        console.error('Error saving notification settings:', error);
                    }
                });
            }
        });

        // Privacy settings with auto-save
        const privacyToggles = [
            document.getElementById('publicProfile'),
            document.getElementById('onlineStatus'),
            document.getElementById('dataCollection')
        ];

        privacyToggles.forEach(toggle => {
            if (toggle) {
                toggle.addEventListener('change', () => {
                    try {
                        savePrivacySettings();
                    } catch (error) {
                        console.error('Error saving privacy settings:', error);
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error initializing event listeners:', error);
    }
}

async function checkAuthAndLoadSettings() {
    // Check if user is logged in
    if (!isUserLoggedIn()) {
        // Redirect to login page
        window.location.href = 'login.html';
        return;
    }

    try {
        // Get current user and user data
        currentUser = getCurrentUser();
        userData = await getUserData();

        if (!userData) {
            console.error('Failed to load user data');
            return;
        }

        // Populate form fields with user data
        populateSettingsForms();
        
        // Display user's email in the account section
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement && currentUser && currentUser.email) {
            userEmailElement.textContent = currentUser.email;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function populateSettingsForms() {
    if (!currentUser || !userData) {
        console.error('No user data available');
        return;
    }

    // Account settings
    if (emailInput && currentUser.email) {
        emailInput.value = currentUser.email;
    }

    // Notification settings
    if (userData.preferences?.notifications) {
        const notifications = userData.preferences.notifications;
        
        if (emailNotifCheckbox) {
            emailNotifCheckbox.checked = notifications.email !== false;
        }
        
        if (commentNotifCheckbox) {
            commentNotifCheckbox.checked = notifications.comments !== false;
        }
        
        if (followNotifCheckbox) {
            followNotifCheckbox.checked = notifications.follows !== false;
        }
        
        if (weeklyDigestCheckbox) {
            weeklyDigestCheckbox.checked = notifications.weeklyDigest === true;
        }
    }

    // Privacy settings
    if (userData.preferences?.privacy) {
        const privacy = userData.preferences.privacy;
        
        if (profileVisibilitySelect) {
            profileVisibilitySelect.value = privacy.profileVisibility || 'public';
        }
        
        if (postVisibilitySelect) {
            postVisibilitySelect.value = privacy.postVisibility || 'public';
        }
    }
}

// Function to apply font family
function applyFontFamily(font) {
    document.documentElement.style.setProperty('--font-family', `'${font}', sans-serif`);
    if (fontSizeSample) {
        fontSizeSample.style.fontFamily = `'${font}', sans-serif`;
    }
}

// Function to apply font size
function applyFontSize(size) {
    document.documentElement.style.setProperty('--base-font-size', `${size}px`);
}

// Function to apply theme
function applyTheme(theme) {
    // Remove all theme classes
    document.body.classList.remove('theme-philosophical', 'theme-science', 'theme-nature', 'theme-cyberpunk', 'theme-minimal');
    
    // If it's a special theme, add the class
    if (theme.startsWith('theme-')) {
        document.body.classList.add(theme);
    }
}

// Function to apply dark mode
function applyDarkMode(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.querySelector('.header')?.classList.add('dark-mode');
        document.querySelector('.mobile-menu')?.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
        document.querySelector('.header')?.classList.remove('dark-mode');
        document.querySelector('.mobile-menu')?.classList.remove('dark-mode');
    }
}

// Function to save appearance settings
function saveAppearanceSettings() {
    try {
        // Save theme
        let selectedTheme = 'light';
        if (themeOptions) {
            themeOptions.forEach(option => {
                if (option.classList.contains('active')) {
                    selectedTheme = option.dataset.theme;
                }
            });
        }
        localStorage.setItem('theme', selectedTheme);
        
        // Save dark mode state
        if (darkModeToggle) {
            const isDarkMode = darkModeToggle.checked;
            localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
        }
        
        // Save font family
        let selectedFont = 'Poppins';
        if (fontOptions) {
            fontOptions.forEach(option => {
                if (option.classList.contains('active')) {
                    selectedFont = option.dataset.font;
                }
            });
        }
        localStorage.setItem('fontFamily', selectedFont);
        
        // Save font size
        if (fontSizeSlider) {
            const fontSize = fontSizeSlider.value;
            localStorage.setItem('fontSize', fontSize);
        }
        
        // Save reduce animations
        if (reduceAnimationsToggle) {
            const reduceAnimations = reduceAnimationsToggle.checked;
            localStorage.setItem('reduceAnimations', reduceAnimations);
        }
    } catch (error) {
        console.error('Error saving appearance settings:', error);
    }
}

// Function to save notification settings
function saveNotificationSettings() {
    try {
        const emailNotifications = document.getElementById('emailNotifications');
        const pushNotifications = document.getElementById('pushNotifications');
        const notificationSound = document.getElementById('notificationSound');
        
        if (emailNotifications) {
            localStorage.setItem('emailNotifications', emailNotifications.checked);
        }
        
        if (pushNotifications) {
            localStorage.setItem('pushNotifications', pushNotifications.checked);
        }
        
        if (notificationSound) {
            localStorage.setItem('notificationSound', notificationSound.checked);
        }
    } catch (error) {
        console.error('Error saving notification settings:', error);
    }
}

// Function to save privacy settings
function savePrivacySettings() {
    try {
        const publicProfile = document.getElementById('publicProfile');
        const onlineStatus = document.getElementById('onlineStatus');
        const dataCollection = document.getElementById('dataCollection');
        
        if (publicProfile) {
            localStorage.setItem('publicProfile', publicProfile.checked);
        }
        
        if (onlineStatus) {
            localStorage.setItem('onlineStatus', onlineStatus.checked);
        }
        
        if (dataCollection) {
            localStorage.setItem('dataCollection', dataCollection.checked);
        }
    } catch (error) {
        console.error('Error saving privacy settings:', error);
    }
}

// Email change and password change functionality
async function handleAccountFormSubmit(e) {
    e.preventDefault();

    // Clear previous messages
    clearMessages();

    // Validate inputs
    const email = emailInput.value.trim();
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    let hasChanges = false;
    let emailChanged = false;
    let passwordChanged = false;

    // Check if email is changed
    if (email !== currentUser.email) {
        if (!email) {
            showError('account', 'Email cannot be empty');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('account', 'Please enter a valid email address');
            return;
        }

        hasChanges = true;
        emailChanged = true;
    }

    // Check if password is changed
    if (newPassword || confirmPassword) {
        if (!currentPassword) {
            showError('account', 'Current password is required to change email or password');
            return;
        }

        if (newPassword.length < 8) {
            showError('account', 'New password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            showError('account', 'New passwords do not match');
            return;
        }

        hasChanges = true;
        passwordChanged = true;
    }

    // If current password is provided but no changes, show error
    if (currentPassword && !hasChanges) {
        showError('account', 'No changes detected');
        return;
    }

    // If no changes at all, do nothing
    if (!hasChanges) {
        showSuccess('account', 'No changes to save');
        return;
    }

    // Show loading state
    showLoadingState();
    saveAccountBtn.disabled = true;
    saveAccountBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        // For now, we'll just show a message that this feature is coming soon
        // We'll implement this properly once we have the proper backend functions
        showSuccess('account', 'This feature will be implemented soon!');
        
        // Clear password fields
        if (currentPasswordInput) currentPasswordInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
    } catch (error) {
        console.error('Error updating account settings:', error);
        showError('account', 'An unexpected error occurred. Please try again.');
    } finally {
        // Reset button and loading state
        if (saveAccountBtn) {
            saveAccountBtn.disabled = false;
            saveAccountBtn.innerHTML = 'Save Changes';
        }
        hideLoadingState();
    }
}

async function handleNotificationsFormSubmit(e) {
    if (e) e.preventDefault();

    // Clear previous messages
    clearMessages();

    // Get form values
    const emailNotif = emailNotifCheckbox?.checked ?? true;
    const commentNotif = commentNotifCheckbox?.checked ?? true;
    const followNotif = followNotifCheckbox?.checked ?? true;
    const weeklyDigest = weeklyDigestCheckbox?.checked ?? false;

    // Check if values changed
    const currentSettings = userData.preferences?.notifications || {};
    
    if (emailNotif === currentSettings.email &&
        commentNotif === currentSettings.comments &&
        followNotif === currentSettings.follows &&
        weeklyDigest === currentSettings.weeklyDigest) {
        showSuccess('notifications', 'No changes to save');
        return;
    }

    // Show loading state
    showLoadingState();
    if (saveNotificationsBtn) {
        saveNotificationsBtn.disabled = true;
        saveNotificationsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    try {
        // Prepare update data
        const updatedPreferences = {
            preferences: {
                ...userData.preferences,
                notifications: {
                    email: emailNotif,
                    comments: commentNotif,
                    follows: followNotif,
                    weeklyDigest: weeklyDigest
                }
            }
        };

        // For now, we'll just simulate success
        // Once backend is ready, we'll use the actual updateUserProfile function
        const result = { success: true };
        
        if (result.success) {
            // Update local data
            userData = {...userData, ...updatedPreferences};
            
            // Show success message
            showSuccess('notifications', 'Notification settings updated successfully');
        } else {
            showError('notifications', 'Failed to update notification settings');
        }
    } catch (error) {
        console.error('Error updating notification settings:', error);
        showError('notifications', 'An unexpected error occurred. Please try again.');
    } finally {
        // Reset button and loading state
        if (saveNotificationsBtn) {
            saveNotificationsBtn.disabled = false;
            saveNotificationsBtn.innerHTML = 'Save Changes';
        }
        hideLoadingState();
    }
}

async function handlePrivacyFormSubmit(e) {
    if (e) e.preventDefault();

    // Clear previous messages
    clearMessages();

    // Get form values
    const profileVisibility = profileVisibilitySelect?.value || 'public';
    const postVisibility = postVisibilitySelect?.value || 'public';

    // Check if values changed
    const currentSettings = userData.preferences?.privacy || {};
    
    if (profileVisibility === currentSettings.profileVisibility &&
        postVisibility === currentSettings.postVisibility) {
        showSuccess('privacy', 'No changes to save');
        return;
    }

    // Show loading state
    showLoadingState();
    if (savePrivacyBtn) {
        savePrivacyBtn.disabled = true;
        savePrivacyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    try {
        // Prepare update data
        const updatedPreferences = {
            preferences: {
                ...userData.preferences,
                privacy: {
                    profileVisibility,
                    postVisibility
                }
            }
        };

        // For now, we'll just simulate success
        // Once backend is ready, we'll use the actual updateUserProfile function
        const result = { success: true };
        
        if (result.success) {
            // Update local data
            userData = {...userData, ...updatedPreferences};
            
            // Show success message
            showSuccess('privacy', 'Privacy settings updated successfully');
        } else {
            showError('privacy', 'Failed to update privacy settings');
        }
    } catch (error) {
        console.error('Error updating privacy settings:', error);
        showError('privacy', 'An unexpected error occurred. Please try again.');
    } finally {
        // Reset button and loading state
        if (savePrivacyBtn) {
            savePrivacyBtn.disabled = false;
            savePrivacyBtn.innerHTML = 'Save Changes';
        }
        hideLoadingState();
    }
}

function showDeleteAccountModal() {
    if (deleteAccountModal) {
        deleteAccountModal.style.display = 'flex';
        
        if (deletePasswordInput) {
            deletePasswordInput.value = '';
            deletePasswordInput.focus();
        }
    }
}

function hideDeleteAccountModal() {
    if (deleteAccountModal) {
        deleteAccountModal.style.display = 'none';
        
        // Clear any previous error messages
        const errorElement = document.getElementById('delete-error');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
    }
}

async function handleDeleteAccount() {
    // Get password
    const password = deletePasswordInput?.value;
    
    if (!password) {
        showError('delete', 'Please enter your password to confirm account deletion');
        return;
    }

    // Show loading state
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

    try {
        // Delete account
        const result = await deleteAccount(password);

        if (result.success) {
            // Show success message (will redirect soon)
            showSuccess('delete', 'Your account has been successfully deleted');
            
            // Hide modal since we're showing the success message outside
            hideDeleteAccountModal();
            
            // Set timeout to allow user to see the message
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showError('delete', result.error || 'Failed to delete account');
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = 'Delete My Account';
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        showError('delete', 'An unexpected error occurred. Please try again.');
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = 'Delete My Account';
    }
}

function showError(section, message) {
    const errorElement = document.getElementById(`${section}-error`);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Add error class to the corresponding section
        const sectionElement = document.getElementById(`${section}-section`);
        if (sectionElement) {
            sectionElement.classList.add('has-error');
        }
        
        // Scroll to error message
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function showSuccess(section, message) {
    const successElement = document.getElementById(`${section}-success`);
    
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        
        // Add success class to the corresponding section
        const sectionElement = document.getElementById(`${section}-section`);
        if (sectionElement) {
            sectionElement.classList.add('has-success');
        }
        
        // Set timeout to hide success message
        setTimeout(() => {
            successElement.style.display = 'none';
            if (sectionElement) {
                sectionElement.classList.remove('has-success');
            }
        }, 5000);
    }
}

function clearMessages() {
    // Clear all error messages
    errorMessages.forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
    
    // Clear all success messages
    successMessages.forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
    
    // Remove error/success classes from sections
    const sections = document.querySelectorAll('.settings-section');
    sections.forEach(section => {
        section.classList.remove('has-error', 'has-success');
    });
}

function showLoadingState() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
}

function hideLoadingState() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
} 