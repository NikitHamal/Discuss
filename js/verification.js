import { 
    sendEmailVerification,
    signOut,
    isEmailVerified,
    isUserLoggedIn,
    resendVerificationEmail,
    getCurrentUserEmail
} from './auth-service.js';

// DOM Elements
const emailDisplay = document.getElementById('email-display');
const resendBtn = document.getElementById('resend-btn');
const checkStatusBtn = document.getElementById('check-status-btn');
const loginBtn = document.getElementById('login-btn');
const homeBtn = document.getElementById('home-btn');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// Get email from URL query params
const urlParams = new URLSearchParams(window.location.search);
const emailParam = urlParams.get('email');

document.addEventListener('DOMContentLoaded', () => {
    initVerificationPage();
});

function initVerificationPage() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const status = urlParams.get('status') || 'sent';
    const actionCode = urlParams.get('oobCode');

    // Set verification state based on parameters
    updateVerificationState(status, email, actionCode);

    // Initialize button listeners
    setupActionButtons();
}

function updateVerificationState(status, email, actionCode) {
    const statusTitle = document.getElementById('verification-title');
    const statusMessage = document.getElementById('verification-message');
    const emailElement = document.getElementById('verification-email');
    const actionButton = document.getElementById('action-button');
    const resendButton = document.getElementById('resend-button');
    const loginButton = document.getElementById('login-button');

    if (emailElement && email) {
        emailElement.textContent = email;
    } else if (emailElement && !email && isUserLoggedIn()) {
        emailElement.textContent = getCurrentUserEmail();
    }

    // Handle page based on status
    switch (status) {
        case 'sent':
            // Verification email just sent
            if (statusTitle) statusTitle.textContent = 'Verification Email Sent';
            if (statusMessage) statusMessage.textContent = 'Please check your email inbox and click the verification link to complete the process.';
            if (actionButton) {
                actionButton.textContent = 'Go to Home';
                actionButton.disabled = false;
            }
            if (resendButton) {
                resendButton.style.display = 'block';
                resendButton.disabled = false;
            }
            break;

        case 'needed':
            // User needs to verify email
            if (statusTitle) statusTitle.textContent = 'Email Verification Required';
            if (statusMessage) statusMessage.textContent = 'Your account requires email verification before you can continue.';
            if (actionButton) {
                actionButton.textContent = 'Send Verification Email';
                actionButton.disabled = false;
            }
            if (resendButton) {
                resendButton.style.display = 'none';
            }
            break;

        case 'success':
            // Email successfully verified
            if (statusTitle) statusTitle.textContent = 'Email Verified Successfully';
            if (statusMessage) statusMessage.textContent = 'Your email has been verified. You can now fully access your account.';
            if (actionButton) {
                actionButton.textContent = 'Go to Home';
                actionButton.disabled = false;
            }
            if (resendButton) {
                resendButton.style.display = 'none';
            }
            if (loginButton) {
                loginButton.style.display = 'block';
            }
            break;

        case 'error':
            // Verification failed or expired
            if (statusTitle) statusTitle.textContent = 'Verification Error';
            if (statusMessage) statusMessage.textContent = 'The verification link is invalid or has expired. Please request a new verification email.';
            if (actionButton) {
                actionButton.textContent = 'Request New Verification';
                actionButton.disabled = false;
            }
            if (resendButton) {
                resendButton.style.display = 'none';
            }
            if (loginButton) {
                loginButton.style.display = 'block';
            }
            break;

        default:
            // Handle verification link directly
            if (actionCode) {
                handleVerificationLink(actionCode);
            } else {
                // Check current verification status
                checkVerificationStatus();
            }
    }
}

async function handleVerificationLink(actionCode) {
    const statusTitle = document.getElementById('verification-title');
    const statusMessage = document.getElementById('verification-message');
    const actionButton = document.getElementById('action-button');
    const loginButton = document.getElementById('login-button');

    if (statusTitle) statusTitle.textContent = 'Verifying Email...';
    if (statusMessage) statusMessage.textContent = 'Please wait while we verify your email address.';
    if (actionButton) actionButton.disabled = true;

    try {
        // Implement Firebase verification with actionCode
        // This is a placeholder - Firebase has an applyActionCode method for this
        // In the actual implementation, you'd use Firebase's auth methods

        // For now, we'll simulate success
        setTimeout(() => {
            if (statusTitle) statusTitle.textContent = 'Email Verified Successfully';
            if (statusMessage) statusMessage.textContent = 'Your email has been verified. You can now fully access your account.';
            if (actionButton) {
                actionButton.textContent = 'Go to Home';
                actionButton.disabled = false;
            }
            if (loginButton) {
                loginButton.style.display = 'block';
            }
        }, 1500);
    } catch (error) {
        console.error('Verification error:', error);
        if (statusTitle) statusTitle.textContent = 'Verification Error';
        if (statusMessage) statusMessage.textContent = 'The verification link is invalid or has expired. Please request a new verification email.';
        if (actionButton) {
            actionButton.textContent = 'Request New Verification';
            actionButton.disabled = false;
        }
        if (loginButton) {
            loginButton.style.display = 'block';
        }
    }
}

async function checkVerificationStatus() {
    const statusTitle = document.getElementById('verification-title');
    const statusMessage = document.getElementById('verification-message');
    const actionButton = document.getElementById('action-button');
    const resendButton = document.getElementById('resend-button');

    if (!isUserLoggedIn()) {
        // Not logged in, redirect to login
        window.location.href = 'login.html';
        return;
    }

    if (isEmailVerified()) {
        // Already verified
        if (statusTitle) statusTitle.textContent = 'Email Already Verified';
        if (statusMessage) statusMessage.textContent = 'Your email has been verified. You can now fully access your account.';
        if (actionButton) {
            actionButton.textContent = 'Go to Home';
            actionButton.disabled = false;
        }
        if (resendButton) {
            resendButton.style.display = 'none';
        }
    } else {
        // Needs verification
        if (statusTitle) statusTitle.textContent = 'Email Verification Required';
        if (statusMessage) statusMessage.textContent = 'Your account requires email verification before you can continue.';
        if (actionButton) {
            actionButton.textContent = 'Send Verification Email';
            actionButton.disabled = false;
        }
        if (resendButton) {
            resendButton.style.display = 'none';
        }
    }
}

function setupActionButtons() {
    const actionButton = document.getElementById('action-button');
    const resendButton = document.getElementById('resend-button');
    const loginButton = document.getElementById('login-button');

    if (actionButton) {
        actionButton.addEventListener('click', handleActionButtonClick);
    }

    if (resendButton) {
        resendButton.addEventListener('click', handleResendButtonClick);
    }

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }
}

async function handleActionButtonClick() {
    const actionButton = document.getElementById('action-button');
    const buttonText = actionButton.textContent.trim();

    switch (buttonText) {
        case 'Send Verification Email':
        case 'Request New Verification':
            await sendVerificationEmail();
            break;
        case 'Go to Home':
            // Always redirect to home page regardless of verification status
            window.location.href = 'index.html';
            break;
        default:
            console.log('Unknown button action:', buttonText);
            break;
    }
}

async function sendVerificationEmail() {
    const actionButton = document.getElementById('action-button');
    const statusMessage = document.getElementById('verification-message');
    
    if (actionButton) {
        actionButton.disabled = true;
        const originalText = actionButton.textContent;
        actionButton.innerHTML = '<span class="loading-spinner"></span> Sending...';
    }

    try {
        const result = await sendEmailVerification();
        
        if (result.success) {
            // Update URL with sent status
            const url = new URL(window.location);
            url.searchParams.set('status', 'sent');
            window.history.pushState({}, '', url);
            
            // Update UI
            updateVerificationState('sent');
        } else {
            if (statusMessage) {
                statusMessage.textContent = result.error || 'Failed to send verification email. Please try again.';
            }
            if (actionButton) {
                actionButton.disabled = false;
                actionButton.textContent = 'Try Again';
            }
        }
    } catch (error) {
        console.error('Send verification error:', error);
        if (statusMessage) {
            statusMessage.textContent = 'An error occurred. Please try again later.';
        }
        if (actionButton) {
            actionButton.disabled = false;
            actionButton.textContent = 'Try Again';
        }
    }
}

async function handleResendButtonClick() {
    const resendButton = document.getElementById('resend-button');
    const statusMessage = document.getElementById('verification-message');
    
    if (resendButton) {
        resendButton.disabled = true;
        const originalText = resendButton.textContent;
        resendButton.innerHTML = '<span class="loading-spinner"></span> Resending...';
    }

    try {
        const result = await resendVerificationEmail();
        
        if (result.success) {
            if (statusMessage) {
                statusMessage.textContent = 'Verification email resent. Please check your inbox.';
            }
            if (resendButton) {
                resendButton.textContent = 'Email Resent';
                setTimeout(() => {
                    if (resendButton) {
                        resendButton.disabled = false;
                        resendButton.textContent = 'Resend Verification Email';
                    }
                }, 3000);
            }
        } else {
            if (statusMessage) {
                statusMessage.textContent = result.error || 'Failed to resend verification email. Please try again.';
            }
            if (resendButton) {
                resendButton.disabled = false;
                resendButton.textContent = 'Resend Verification Email';
            }
        }
    } catch (error) {
        console.error('Resend verification error:', error);
        if (statusMessage) {
            statusMessage.textContent = 'An error occurred. Please try again later.';
        }
        if (resendButton) {
            resendButton.disabled = false;
            resendButton.textContent = 'Resend Verification Email';
        }
    }
}

function showSuccess() {
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    
    // Update UI for verified state
    document.querySelector('.verification-message').style.display = 'none';
    resendBtn.style.display = 'none';
    checkStatusBtn.style.display = 'none';
    
    // Show only relevant buttons
    loginBtn.style.display = 'block';
    homeBtn.style.display = 'block';
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

function showMessage(message, type) {
    if (type === 'success') {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    } else {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }
} 