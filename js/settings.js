import {
    isUserLoggedIn,
    getCurrentUser,
    getUserData,
    updateUserData,
    updateEmail,
    updatePassword,
    deleteAccount,
    signOut
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

// User Data
let currentUser = null;
let userData = null;

document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
    checkAuthAndLoadSettings();
});

function initElements() {
    // Account settings
    accountForm = document.getElementById('account-form');
    emailInput = document.getElementById('email');
    currentPasswordInput = document.getElementById('current-password');
    newPasswordInput = document.getElementById('new-password');
    confirmPasswordInput = document.getElementById('confirm-password');
    saveAccountBtn = document.getElementById('save-account-btn');

    // Notification settings
    notificationsForm = document.getElementById('notifications-form');
    emailNotifCheckbox = document.getElementById('email-notifications');
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

    // UI Elements
    loadingIndicator = document.getElementById('loading-indicator');
    errorMessages = document.querySelectorAll('.error-message');
    successMessages = document.querySelectorAll('.success-message');
}

function initEventListeners() {
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

    // Password visibility toggles
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

async function checkAuthAndLoadSettings() {
    // Show loading indicator
    showLoadingState();

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
            showError('general', 'Failed to load user data. Please try again later.');
            return;
        }

        // Populate form fields with user data
        populateSettingsForms();
    } catch (error) {
        console.error('Error loading settings:', error);
        showError('general', 'An error occurred while loading your settings. Please try again.');
    } finally {
        // Hide loading indicator
        hideLoadingState();
    }
}

function populateSettingsForms() {
    // Account settings
    if (emailInput) {
        emailInput.value = currentUser.email || '';
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
        // Update email if changed
        if (emailChanged) {
            const emailResult = await updateEmail(email, currentPassword);
            
            if (!emailResult.success) {
                showError('account', emailResult.error || 'Failed to update email');
                return;
            }
        }

        // Update password if changed
        if (passwordChanged) {
            const passwordResult = await updatePassword(currentPassword, newPassword);
            
            if (!passwordResult.success) {
                showError('account', passwordResult.error || 'Failed to update password');
                return;
            }
        }

        // Show success message
        showSuccess('account', 'Account settings updated successfully');

        // Clear password fields
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
    } catch (error) {
        console.error('Error updating account settings:', error);
        showError('account', 'An unexpected error occurred. Please try again.');
    } finally {
        // Reset button and loading state
        saveAccountBtn.disabled = false;
        saveAccountBtn.innerHTML = 'Save Changes';
        hideLoadingState();
    }
}

async function handleNotificationsFormSubmit(e) {
    e.preventDefault();

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
    saveNotificationsBtn.disabled = true;
    saveNotificationsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

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

        // Update preferences in Firestore
        const result = await updateUserData(updatedPreferences);

        if (result.success) {
            // Update local data
            userData = {...userData, ...updatedPreferences};
            
            // Show success message
            showSuccess('notifications', 'Notification settings updated successfully');
        } else {
            showError('notifications', result.error || 'Failed to update notification settings');
        }
    } catch (error) {
        console.error('Error updating notification settings:', error);
        showError('notifications', 'An unexpected error occurred. Please try again.');
    } finally {
        // Reset button and loading state
        saveNotificationsBtn.disabled = false;
        saveNotificationsBtn.innerHTML = 'Save Changes';
        hideLoadingState();
    }
}

async function handlePrivacyFormSubmit(e) {
    e.preventDefault();

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
    savePrivacyBtn.disabled = true;
    savePrivacyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

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

        // Update preferences in Firestore
        const result = await updateUserData(updatedPreferences);

        if (result.success) {
            // Update local data
            userData = {...userData, ...updatedPreferences};
            
            // Show success message
            showSuccess('privacy', 'Privacy settings updated successfully');
        } else {
            showError('privacy', result.error || 'Failed to update privacy settings');
        }
    } catch (error) {
        console.error('Error updating privacy settings:', error);
        showError('privacy', 'An unexpected error occurred. Please try again.');
    } finally {
        // Reset button and loading state
        savePrivacyBtn.disabled = false;
        savePrivacyBtn.innerHTML = 'Save Changes';
        hideLoadingState();
    }
}

function showDeleteAccountModal() {
    if (deleteAccountModal) {
        deleteAccountModal.style.display = 'block';
        
        if (deletePasswordInput) {
            deletePasswordInput.value = '';
            deletePasswordInput.focus();
        }
    }
}

function hideDeleteAccountModal() {
    if (deleteAccountModal) {
        deleteAccountModal.style.display = 'none';
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