import { 
    signInWithEmail, 
    signInWithSocial, 
    resetPassword,
    isEmailVerified
} from './auth-service.js';

// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const errorMessage = document.getElementById('login-error');
const rememberMeCheckbox = document.getElementById('remember-me');
const googleLoginBtn = document.querySelector('.social-btn.google');

document.addEventListener('DOMContentLoaded', () => {
    initializeLoginPage();
});

function initializeLoginPage() {
    // Check if there's a stored email for 'remember me' feature
    const storedEmail = localStorage.getItem('stormwrite_email');
    if (storedEmail) {
        emailInput.value = storedEmail;
        rememberMeCheckbox.checked = true;
    }

    // Handle form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Handle social login
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => handleSocialLogin('google'));
    }

    // Initialize password visibility toggle
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                passwordInput.classList.add('password-input');
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

async function handleLogin(e) {
    e.preventDefault();

    // Get form values
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Basic validation
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Please enter a valid email address');
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing In...';
    hideError();

    try {
        // Attempt to sign in
        const result = await signInWithEmail(email, password);

        if (result.success) {
            // Handle remember me
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('stormwrite_email', email);
            } else {
                localStorage.removeItem('stormwrite_email');
            }

            // Check if email is verified
            if (!isEmailVerified()) {
                // Redirect to verification needed page
                window.location.href = `verification.html?email=${encodeURIComponent(email)}&status=needed`;
                return;
            }

            // Redirect to dashboard or home
            window.location.href = 'index.html';
        } else {
            // Handle specific error codes
            switch (result.code) {
                case 'auth/wrong-password':
                    showError('Incorrect password. Please try again.');
                    break;
                case 'auth/user-not-found':
                    showError('No account found with this email. Please sign up.');
                    break;
                case 'auth/too-many-requests':
                    showError('Too many failed login attempts. Please try again later or reset your password.');
                    break;
                default:
                    showError('Login failed. Please try again.');
                    break;
            }

            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('An unexpected error occurred. Please try again.');
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
}

async function handleSocialLogin(provider) {
    try {
        // Show loading state on button
        const button = document.querySelector(`.social-btn.${provider}`);
        const originalText = button.innerHTML;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Connecting...`;
        button.disabled = true;
        hideError();

        // Attempt social login
        const result = await signInWithSocial(provider);

        if (result.success) {
            // Redirect to home/dashboard
            window.location.href = 'index.html';
        } else {
            // Handle specific error cases
            if (result.code === 'auth/account-exists-with-different-credential') {
                showError('An account already exists with the same email address but different sign-in credentials.');
            } else {
                showError(`Failed to sign in with ${provider}. Please try again.`);
            }

            // Reset button
            button.innerHTML = originalText;
            button.disabled = false;
        }
    } catch (error) {
        console.error(`${provider} login error:`, error);
        showError('An unexpected error occurred. Please try again.');
        
        // Reset all buttons
        const buttons = document.querySelectorAll('.social-btn');
        buttons.forEach(btn => {
            btn.innerHTML = btn.innerHTML.replace('<i class="fas fa-spinner fa-spin"></i> Connecting...', btn.dataset.originalText || originalText);
            btn.disabled = false;
        });
    }
}

function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
}

function hideError() {
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

function showForgotPasswordModal(e) {
    e.preventDefault();
    
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Reset Password</h2>
            <p>Enter your email address and we'll send you a link to reset your password.</p>
            <div class="form-group">
                <label for="reset-email">Email Address</label>
                <div class="input-with-icon">
                    <i class="fas fa-envelope"></i>
                    <input type="email" id="reset-email" placeholder="Enter your email address">
                </div>
            </div>
            <div id="reset-feedback" class="feedback"></div>
            <button type="button" id="reset-btn" class="auth-button">Send Reset Link</button>
        </div>
    `;
    
    // Add modal to page
    document.body.appendChild(modal);
    
    // Show modal
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Close button functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
    
    // Submit button functionality
    const resetBtn = modal.querySelector('#reset-btn');
    resetBtn.addEventListener('click', async () => {
        const email = modal.querySelector('#reset-email').value.trim();
        const feedback = modal.querySelector('#reset-feedback');
        
        if (!email) {
            feedback.textContent = 'Please enter your email address';
            feedback.className = 'feedback error';
            return;
        }
        
        // Show loading state
        resetBtn.disabled = true;
        resetBtn.textContent = 'Sending...';
        
        try {
            const result = await resetPassword(email);
            
            if (result.success) {
                feedback.textContent = 'Password reset link sent to your email';
                feedback.className = 'feedback success';
                
                // Close modal after delay
                setTimeout(() => {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.remove();
                    }, 300);
                }, 3000);
            } else {
                feedback.textContent = result.error || 'Failed to send reset link';
                feedback.className = 'feedback error';
            }
        } catch (error) {
            console.error('Error sending reset link:', error);
            feedback.textContent = 'Something went wrong. Please try again.';
            feedback.className = 'feedback error';
        } finally {
            resetBtn.disabled = false;
            resetBtn.textContent = 'Send Reset Link';
        }
    });
} 