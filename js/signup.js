import {
    checkUsernameExists,
    generateUsernameSuggestions,
    uploadImageToImgBB,
    registerUser
} from './auth-service.js';

// State variables for signup
const userData = {
    username: '',
    email: '',
    password: '',
    displayName: '',
    photoUrl: '',
    photoDeleteUrl: '',
    gender: '',
    birthday: null,
    interests: [],
    bio: '',
    bioTags: [],
    location: '',
    education: '',
    institution: '',
    website: '',
    badges: {
        verified: false,
        premium: false
    }
};

// Default avatar options
const defaultAvatars = [
    'https://cdn-icons-png.flaticon.com/512/4333/4333609.png',
    'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
    'https://cdn-icons-png.flaticon.com/512/4140/4140047.png',
    'https://cdn-icons-png.flaticon.com/512/2202/2202112.png',
    'https://cdn-icons-png.flaticon.com/512/4140/4140061.png',
];

// DOM Elements
const signupForm = document.getElementById('signup-form');
const stepCards = document.querySelectorAll('.step-card');
const nextBtns = document.querySelectorAll('.next-step');
const prevBtns = document.querySelectorAll('.prev-step');
const progressSteps = document.querySelectorAll('.progress-step');
const usernameInput = document.getElementById('username');
const usernameFeedback = document.getElementById('username-feedback');
const usernameSpinner = document.getElementById('username-spinner');
const usernameSuggestions = document.getElementById('username-suggestions');
const avatarUpload = document.getElementById('avatar-upload');
const avatarPreview = document.getElementById('avatar-preview');
const defaultAvatarContainer = document.getElementById('default-avatars');
const customFileUpload = document.getElementById('custom-file-upload');
const fileInput = document.getElementById('file-input');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const passwordStrengthBar = document.querySelector('.password-strength-bar');
const passwordRequirements = document.querySelector('.password-requirements');
const passwordMatchIndicator = document.querySelector('.password-match-indicator');
const bioTextarea = document.getElementById('bio');
const bioCharCount = document.getElementById('bio-char-count');
const bioPreview = document.querySelector('.bio-preview');
const bioPreviewContent = document.getElementById('bio-preview-content');
const bioTags = document.querySelectorAll('.bio-tag');
const previewToggle = document.querySelector('.preview-toggle');
const skipAvatarBtn = document.getElementById('skip-avatar');

document.addEventListener('DOMContentLoaded', () => {
    initializeSignupForm();
});

function initializeSignupForm() {
    // Initialize progress steps
    updateProgressSteps(0);

    // Navigate between steps with next/prev buttons
    nextBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => nextStep(index));
    });

    prevBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => prevStep(index));
    });

    // Initialize username validation
    if (usernameInput) {
        usernameInput.addEventListener('input', debounce(function() {
            if (usernameInput.value.trim().length >= 3) {
                validateUsername();
            }
        }, 500));
        
        usernameInput.addEventListener('blur', function() {
            if (usernameInput.value.trim()) {
                validateUsername();
            }
        });
    }

    // Initialize avatar selection
    initializeAvatarSelection();

    // Initialize password strength meter
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
        
        passwordInput.addEventListener('focus', function() {
            document.querySelector('.password-requirements').classList.add('active');
        });
        
        passwordInput.addEventListener('blur', function() {
            if (!this.value) {
                document.querySelector('.password-requirements').classList.remove('active');
            }
            
            // Store password if valid
            const strength = updatePasswordStrength(this.value);
            if (strength >= 3) {
                userData.password = this.value;
            }
        });
    }

    // Initialize password match checker
    if (confirmPasswordInput && passwordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const password = passwordInput.value;
            const confirmPassword = this.value;
            
            if (confirmPassword) {
                passwordMatchIndicator.classList.add('visible');
                
                if (password === confirmPassword) {
                    passwordMatchIndicator.classList.add('match');
                    passwordMatchIndicator.innerHTML = '<i class="fas fa-check-circle"></i> Passwords match';
                } else {
                    passwordMatchIndicator.classList.remove('match');
                    passwordMatchIndicator.innerHTML = '<i class="fas fa-times-circle"></i> Passwords do not match';
                }
            } else {
                passwordMatchIndicator.classList.remove('visible');
            }
        });
    }

    // Initialize bio character counter and preview
    if (bioTextarea) {
        bioTextarea.addEventListener('input', updateBioCharCount);
        
        if (previewToggle) {
            previewToggle.addEventListener('click', toggleBioPreview);
        }
    }

    // Initialize bio tags
    if (bioTags) {
        bioTags.forEach(tag => {
            tag.addEventListener('click', toggleBioTag);
        });
    }

    // Final submit handler
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmit);
    }
    
    // Initialize password visibility toggle
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.closest('.input-with-icon').querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
}

// Password strength checker
function checkPasswordStrength() {
    const password = passwordInput.value;
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };

    // Update requirement indicators
    Object.keys(requirements).forEach(req => {
        const element = document.getElementById(`req-${req}`);
        if (element) {
            if (requirements[req]) {
                element.classList.remove('unmet');
                element.classList.add('met');
                element.querySelector('i').classList.remove('fa-circle');
                element.querySelector('i').classList.add('fa-check-circle');
            } else {
                element.classList.remove('met');
                element.classList.add('unmet');
                element.querySelector('i').classList.remove('fa-check-circle');
                element.querySelector('i').classList.add('fa-circle');
            }
        }
    });

    // Calculate strength percentage
    const metRequirements = Object.values(requirements).filter(Boolean).length;
    let strengthClass = '';

    if (password.length === 0) {
        passwordStrengthBar.style.width = '0';
        passwordStrengthBar.className = 'password-strength-bar';
    } else if (metRequirements <= 2) {
        strengthClass = 'weak';
    } else if (metRequirements === 3) {
        strengthClass = 'medium';
    } else if (metRequirements === 4) {
        strengthClass = 'strong';
    } else {
        strengthClass = 'very-strong';
    }

    // Update strength bar
    passwordStrengthBar.className = `password-strength-bar ${strengthClass}`;
}

// Check if passwords match
function checkPasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword.length === 0) {
        passwordMatchIndicator.classList.remove('visible', 'match');
        return;
    }
    
    passwordMatchIndicator.classList.add('visible');
    
    if (password === confirmPassword) {
        passwordMatchIndicator.classList.add('match');
        passwordMatchIndicator.innerHTML = '<i class="fas fa-check-circle"></i> Passwords match';
    } else {
        passwordMatchIndicator.classList.remove('match');
        passwordMatchIndicator.innerHTML = '<i class="fas fa-times-circle"></i> Passwords do not match';
    }
}

// Bio character counter
function updateBioCharCount() {
    const maxLength = bioTextarea.getAttribute('maxlength');
    const currentLength = bioTextarea.value.length;
    bioCharCount.textContent = currentLength;
    
    // Update preview if active
    if (bioPreview.classList.contains('active')) {
        updateBioPreview();
    }

    // Change counter color based on remaining characters
    const charCounter = bioCharCount.parentElement;
    
    if (currentLength >= maxLength * 0.9) {
        charCounter.classList.add('limit-reached');
        charCounter.classList.remove('limit-near');
    } else if (currentLength >= maxLength * 0.7) {
        charCounter.classList.add('limit-near');
        charCounter.classList.remove('limit-reached');
    } else {
        charCounter.classList.remove('limit-near', 'limit-reached');
    }
    
    // Update userData
    userData.bio = bioTextarea.value;
}

// Bio preview toggle
function toggleBioPreview() {
    bioPreview.classList.toggle('active');
    const isActive = bioPreview.classList.contains('active');
    
    if (isActive) {
        updateBioPreview();
        previewToggle.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Preview';
    } else {
        previewToggle.innerHTML = '<i class="fas fa-eye"></i> Preview';
    }
}

// Update bio preview
function updateBioPreview() {
    const bioText = bioTextarea.value || 'Your bio will appear here...';
    bioPreviewContent.textContent = bioText;
}

// Toggle bio tag selection
function toggleBioTag() {
    this.classList.toggle('selected');
    
    // Update userData
    userData.bioTags = Array.from(document.querySelectorAll('.bio-tag.selected'))
        .map(tag => tag.dataset.tag);
}

// Step navigation functions
function nextStep(currentStepIndex) {
    // Validate current step before proceeding
    if (!validateStep(currentStepIndex)) {
        return;
    }

    // Hide current step
    const currentStep = stepCards[currentStepIndex];
    currentStep.classList.remove('active');
    
    // Show next step
    stepCards[currentStepIndex + 1].classList.add('active');
    
    // Update progress
    updateProgressSteps(currentStepIndex + 1);
    
    // Scroll to top of form
    scrollToFormTop();
}

function prevStep(currentStepIndex) {
    // Hide current step
    const currentStep = stepCards[currentStepIndex];
    currentStep.classList.remove('active');
    
    // Show previous step
    stepCards[currentStepIndex - 1].classList.add('active');
    
    // Update progress
    updateProgressSteps(currentStepIndex - 1);
    
    // Scroll to top of form
    scrollToFormTop();
}

function scrollToFormTop() {
    // Scroll to the top of the form without smooth behavior
    document.querySelector('.signup-progress').scrollIntoView({ block: 'start' });
}

function updateProgressSteps(activeStep) {
    // Update progress line
    document.querySelector('.progress-line').setAttribute('data-progress', activeStep);
    
    progressSteps.forEach((step, index) => {
        if (index < activeStep) {
            // Previous steps are complete
            step.classList.remove('active');
            step.classList.add('complete');
            step.innerHTML = '<i class="fas fa-check"></i>';
        } else if (index === activeStep) {
            // Current step is active
            step.classList.add('active');
            step.classList.remove('complete');
            step.innerHTML = index + 1;
        } else {
            // Future steps are inactive
            step.classList.remove('active', 'complete');
            step.innerHTML = index + 1;
        }
    });
}

// Step validation
function validateStep(stepIndex) {
    switch (stepIndex) {
        case 0:
            return validateCredentialsStep();
        case 1:
            return validateProfileStep();
        case 2:
            return validateInterestsStep();
        default:
            return true;
    }
}

function validateCredentialsStep() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const username = document.getElementById('username').value.trim();
    
    // Email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('email', 'Please enter a valid email address');
        return false;
    }
    
    // Password validation
    if (!password || password.length < 8) {
        showError('password', 'Password must be at least 8 characters long');
        return false;
    }
    
    // Password match validation
    if (password !== confirmPassword) {
        showError('confirm-password', 'Passwords do not match');
        return false;
    }
    
    // Username validation
    if (!username || username.length < 3) {
        showError('username', 'Username must be at least 3 characters long');
        return false;
    }
    
    // Check if username is valid format (already checked asynchronously)
    if (usernameFeedback.classList.contains('error')) {
        return false;
    }
    
    // Store the data
    userData.email = email;
    userData.password = password;
    userData.username = username;
    
    return true;
}

function validateProfileStep() {
    const displayName = document.getElementById('display-name').value.trim();
    const gender = document.getElementById('gender').value;
    const birthday = document.getElementById('birthday').value;
    const bio = document.getElementById('bio').value.trim();
    const education = document.getElementById('education')?.value.trim();
    const institution = document.getElementById('institution')?.value.trim();
    const website = document.getElementById('website')?.value.trim();
    
    // Some basic validation
    if (!displayName) {
        showError('display-name', 'Please enter your name');
        return false;
    }
    
    if (!birthday) {
        showError('birthday', 'Please enter your birthday');
        return false;
    }
    
    // Store the data
    userData.displayName = displayName;
    userData.gender = gender;
    userData.birthday = birthday ? new Date(birthday).toISOString() : null;
    userData.bio = bio;
    userData.bioTags = Array.from(document.querySelectorAll('.bio-tag.selected'))
        .map(tag => tag.dataset.tag);
    userData.location = document.getElementById('location').value.trim();
    userData.education = education || '';
    userData.institution = institution || '';
    userData.website = website || '';
    
    // If no avatar was selected (through upload, default, or skip), use initials
    if (!userData.photoUrl) {
        const initials = displayName.split(' ').map(name => name[0]).join('').toUpperCase();
        userData.photoUrl = `https://ui-avatars.com/api/?name=${initials}&background=087ea4&color=fff&size=128`;
    }
    
    return true;
}

function validateInterestsStep() {
    const interests = Array.from(document.querySelectorAll('input[name="interests"]:checked'))
        .map(checkbox => checkbox.value);
    
    if (interests.length < 3) {
        document.getElementById('interests-feedback').textContent = 'Please select at least 3 interests';
        document.getElementById('interests-feedback').classList.add('error');
        return false;
    }
    
    // Store the data
    userData.interests = interests;
    
    return true;
}

// Enhanced feedback function
function showFeedback(element, message, type) {
    element.textContent = message;
    element.className = 'feedback';
    
    if (type) {
        element.classList.add(type);
        
        // Also add class to the closest input-with-icon
        const inputWrapper = element.closest('.form-group').querySelector('.input-with-icon');
        if (inputWrapper) {
            inputWrapper.classList.remove('input-error', 'input-success');
            if (type === 'error') {
                inputWrapper.classList.add('input-error');
            } else if (type === 'success') {
                inputWrapper.classList.add('input-success');
            }
        }
    }
}

// Better error display
function showError(message) {
    const errorElement = document.getElementById('signup-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.classList.add('visible');
    
    // Scroll to error
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorElement.classList.remove('visible');
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 300);
    }, 5000);
}

// Enhanced username validation
async function validateUsername() {
    const username = usernameInput.value.trim();
    
    // Show spinner
    usernameSpinner.style.display = 'inline-block';
    
    // Clear previous feedback
    showFeedback(usernameFeedback, '', null);
    usernameSuggestions.innerHTML = '';
    usernameSuggestions.style.display = 'none';
    
    // Basic validation
    if (!username) {
        showFeedback(usernameFeedback, 'Username is required', 'error');
        usernameSpinner.style.display = 'none';
        return false;
    }
    
    if (username.length < 3) {
        showFeedback(usernameFeedback, 'Username must be at least 3 characters long', 'error');
        usernameSpinner.style.display = 'none';
        return false;
    }
    
    // Check if username contains spaces or special characters
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showFeedback(usernameFeedback, 'Username can only contain letters, numbers, and underscores', 'error');
        usernameSpinner.style.display = 'none';
        return false;
    }
    
    try {
        // Check if username exists
        const exists = await checkUsernameExists(username);
        
        if (exists) {
            showFeedback(usernameFeedback, 'Username already taken', 'error');
            
            // Generate suggestions
            const suggestions = await generateUsernameSuggestions(username);
            
            if (suggestions.length > 0) {
                usernameSuggestions.innerHTML = `
                    <p>Try one of these instead:</p>
                    <div class="suggestions-list">
                        ${suggestions.map(suggestion => `
                            <button type="button" class="suggestion-btn">${suggestion}</button>
                        `).join('')}
                    </div>
                `;
                usernameSuggestions.style.display = 'block';
                
                // Add click handlers to suggestion buttons
                document.querySelectorAll('.suggestion-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        usernameInput.value = btn.textContent;
                        validateUsername();
                    });
                });
            }
            
            usernameSpinner.style.display = 'none';
            return false;
        } else {
            showFeedback(usernameFeedback, 'Username is available', 'success');
            userData.username = username;
            usernameSpinner.style.display = 'none';
            return true;
        }
    } catch (error) {
        console.error('Error validating username:', error);
        showFeedback(usernameFeedback, 'Error checking username availability', 'error');
        usernameSpinner.style.display = 'none';
        return false;
    }
}

function initializeAvatarSelection() {
    // Create default avatar options
    if (defaultAvatarContainer) {
        defaultAvatars.forEach(avatarUrl => {
            const avatarElement = document.createElement('div');
            avatarElement.className = 'default-avatar';
            avatarElement.innerHTML = `<img src="${avatarUrl}" alt="Default avatar">`;
            avatarElement.addEventListener('click', () => selectDefaultAvatar(avatarUrl));
            defaultAvatarContainer.appendChild(avatarElement);
        });
    }
    
    // Initialize file input for custom avatar
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
        customFileUpload.addEventListener('click', () => fileInput.click());
        customFileUpload.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });
    }
    
    // Initialize skip avatar button
    if (skipAvatarBtn) {
        skipAvatarBtn.addEventListener('click', skipAvatarSelection);
    }
    
    // Initialize avatar with default image
    if (avatarPreview) {
        avatarPreview.style.display = 'block';
    }
}

function handleFileSelection(e) {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file.');
        return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('File size should be less than 5MB.');
        return;
    }
    
    // Show image preview
    const reader = new FileReader();
    reader.onload = function(e) {
        avatarPreview.src = e.target.result;
        avatarPreview.style.display = 'block';
        
        // Deselect any default avatars
        document.querySelectorAll('.default-avatar').forEach(avatar => {
            avatar.classList.remove('selected');
        });
    };
    reader.readAsDataURL(file);
}

function selectDefaultAvatar(avatarUrl) {
    // Set preview
    avatarPreview.src = avatarUrl;
    avatarPreview.style.display = 'block';
    
    // Clear file input
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Mark selected avatar
    document.querySelectorAll('.default-avatar').forEach(avatar => {
        const avatarImg = avatar.querySelector('img');
        if (avatarImg && avatarImg.src === avatarUrl) {
            avatar.classList.add('selected');
        } else {
            avatar.classList.remove('selected');
        }
    });
    
    // Set the userData
    userData.photoUrl = avatarUrl;
    userData.photoDeleteUrl = '';
}

function skipAvatarSelection() {
    // Reset to default avatar based on initials
    const displayName = document.getElementById('display-name').value.trim() || 'User';
    const initials = displayName.split(' ').map(name => name[0]).join('').toUpperCase();
    const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${initials}&background=087ea4&color=fff&size=128`;
    
    avatarPreview.src = defaultAvatarUrl;
    
    // Clear file input
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Deselect any default avatars
    document.querySelectorAll('.default-avatar').forEach(avatar => {
        avatar.classList.remove('selected');
    });
    
    // Use initials avatar
    userData.photoUrl = defaultAvatarUrl;
    userData.photoDeleteUrl = '';
}

async function handleSignupSubmit(e) {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    
    try {
        // If there's a file to upload
        const file = fileInput.files[0];
        if (file) {
            const uploadResult = await uploadImageToImgBB(file);
            
            if (uploadResult.success) {
                userData.photoUrl = uploadResult.displayUrl;
                userData.photoDeleteUrl = uploadResult.deleteUrl;
            } else {
                throw new Error('Failed to upload profile picture');
            }
        }
        
        // Prepare user data for Firebase - fix timestamp in arrays issue
        const firebaseUserData = {
            ...userData,
            // Convert arrays to objects with values that don't include serverTimestamp
            interests: userData.interests.reduce((obj, interest, index) => {
                obj[`interest_${index}`] = interest;
                return obj;
            }, {}),
            bioTags: userData.bioTags.reduce((obj, tag, index) => {
                obj[`tag_${index}`] = tag;
                return obj;
            }, {})
        };
        
        // Register the user with the modified data structure
        const result = await registerUser(userData.email, userData.password, firebaseUserData);
        
        if (result.success) {
            // Redirect to verification page
            window.location.href = `verification.html?email=${encodeURIComponent(userData.email)}`;
        } else {
            throw new Error(result.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Error during signup:', error);
        
        // Show error message
        const errorMessage = document.getElementById('signup-error');
        errorMessage.textContent = error.message || 'Something went wrong. Please try again.';
        errorMessage.style.display = 'block';
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Update the button states with loading indicators
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        const spinner = document.createElement('span');
        spinner.className = 'spinner';
        spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        button.prepend(spinner);
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        const spinner = button.querySelector('.spinner');
        if (spinner) spinner.remove();
        button.disabled = false;
    }
}

// Show the password strength in real-time
function updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.password-strength-bar');
    const requirements = document.querySelector('.password-requirements');
    
    // Show requirements when field is focused
    requirements.classList.add('active');
    
    // Reset all requirements
    document.querySelectorAll('.requirement').forEach(req => {
        req.classList.remove('met');
        req.classList.add('unmet');
    });
    
    // Check each requirement
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    // Update requirement indicators
    if (hasLength) document.getElementById('req-length').classList.replace('unmet', 'met');
    if (hasUppercase) document.getElementById('req-uppercase').classList.replace('unmet', 'met');
    if (hasLowercase) document.getElementById('req-lowercase').classList.replace('unmet', 'met');
    if (hasNumber) document.getElementById('req-number').classList.replace('unmet', 'met');
    if (hasSpecial) document.getElementById('req-special').classList.replace('unmet', 'met');
    
    // Calculate strength
    let strength = 0;
    if (hasLength) strength++;
    if (hasUppercase) strength++;
    if (hasLowercase) strength++;
    if (hasNumber) strength++;
    if (hasSpecial) strength++;
    
    // Update strength bar
    strengthBar.className = 'password-strength-bar';
    if (password.length === 0) {
        strengthBar.style.width = '0';
    } else if (strength <= 2) {
        strengthBar.classList.add('weak');
    } else if (strength === 3) {
        strengthBar.classList.add('medium');
    } else if (strength === 4) {
        strengthBar.classList.add('strong');
    } else {
        strengthBar.classList.add('very-strong');
    }
    
    return strength;
}

// Enhanced navigation between steps with validation
function goToStep(step) {
    // Validate current step before proceeding
    const currentStep = parseInt(document.querySelector('.step-card.active').id.split('-')[1]);
    
    if (step > currentStep && !validateStep(currentStep)) {
        return false;
    }
    
    // Hide all steps
    stepCards.forEach(stepCard => {
        stepCard.classList.remove('active');
    });
    
    // Show target step
    document.getElementById(`step-${step}`).classList.add('active');
    
    // Update progress bar
    document.querySelector('.progress-line').dataset.progress = step - 1;
    
    // Update step indicators
    progressSteps.forEach(progressStep => {
        const stepNum = parseInt(progressStep.dataset.step);
        
        progressStep.classList.remove('active', 'complete');
        
        if (stepNum === step) {
            progressStep.classList.add('active');
        } else if (stepNum < step) {
            progressStep.classList.add('complete');
        }
    });
    
    // Scroll to top of form
    document.querySelector('.auth-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    return true;
}

// Better form submission with loading state
async function submitSignup(e) {
    e.preventDefault();
    
    // Final validation of all steps
    if (!validateAllSteps()) {
        return;
    }
    
    const submitBtn = document.querySelector('#submit-signup');
    setButtonLoading(submitBtn, true);
    
    try {
        const result = await registerUser(userData.email, userData.password, userData);
        
        if (result.success) {
            // Show success message
            showFeedback(document.getElementById('signup-success'), 'Account created successfully! Redirecting to login...', 'success');
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            setButtonLoading(submitBtn, false);
            showError(result.error || 'Failed to create account. Please try again.');
        }
    } catch (error) {
        console.error('Error during signup:', error);
        setButtonLoading(submitBtn, false);
        showError('An unexpected error occurred. Please try again later.');
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Username validation on input
    usernameInput.addEventListener('input', debounce(function() {
        if (usernameInput.value.trim().length >= 3) {
            validateUsername();
        }
    }, 500));
    
    // Username validation on blur
    usernameInput.addEventListener('blur', function() {
        if (usernameInput.value.trim()) {
            validateUsername();
        }
    });
    
    // Email validation
    const emailInput = document.getElementById('email');
    emailInput.addEventListener('blur', function() {
        const email = emailInput.value.trim();
        const emailFeedback = document.getElementById('email-feedback');
        
        if (!email) {
            showFeedback(emailFeedback, 'Email is required', 'error');
            return;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showFeedback(emailFeedback, 'Please enter a valid email address', 'error');
            return;
        }
        
        showFeedback(emailFeedback, 'Email format is valid', 'success');
        userData.email = email;
    });
    
    // Password strength meter
    const passwordInput = document.getElementById('password');
    passwordInput.addEventListener('input', function() {
        updatePasswordStrength(this.value);
    });
    
    passwordInput.addEventListener('focus', function() {
        document.querySelector('.password-requirements').classList.add('active');
    });
    
    passwordInput.addEventListener('blur', function() {
        if (!this.value) {
            document.querySelector('.password-requirements').classList.remove('active');
        }
        
        // Store password if valid
        const strength = updatePasswordStrength(this.value);
        if (strength >= 3) {
            userData.password = this.value;
        }
    });
    
    // Password match validation
    const confirmPasswordInput = document.getElementById('confirm-password');
    const passwordMatchIndicator = document.querySelector('.password-match-indicator');
    
    confirmPasswordInput.addEventListener('input', function() {
        const password = passwordInput.value;
        const confirmPassword = this.value;
        
        if (confirmPassword) {
            passwordMatchIndicator.classList.add('visible');
            
            if (password === confirmPassword) {
                passwordMatchIndicator.classList.add('match');
                passwordMatchIndicator.innerHTML = '<i class="fas fa-check-circle"></i> Passwords match';
            } else {
                passwordMatchIndicator.classList.remove('match');
                passwordMatchIndicator.innerHTML = '<i class="fas fa-times-circle"></i> Passwords do not match';
            }
        } else {
            passwordMatchIndicator.classList.remove('visible');
        }
    });
    
    // Password visibility toggle
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.closest('.input-with-icon').querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
    
    // Step navigation
    nextBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const currentStep = parseInt(this.closest('.step-card').id.split('-')[1]);
            goToStep(currentStep + 1);
        });
    });
    
    prevBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const currentStep = parseInt(this.closest('.step-card').id.split('-')[1]);
            goToStep(currentStep - 1);
        });
    });
    
    // Form submission
    signupForm.addEventListener('submit', submitSignup);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeAvatarSelection();
    initializeEventListeners();
    initializeInterestTags();
}); 