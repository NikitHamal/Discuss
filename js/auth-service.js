import { 
    auth, 
    db, 
    storage,
    firebase
} from './firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    GoogleAuthProvider,
    FacebookAuthProvider,
    TwitterAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

// Providers for social login
const googleProvider = new firebase.auth.GoogleAuthProvider();
const facebookProvider = new firebase.auth.FacebookAuthProvider();
const twitterProvider = new firebase.auth.TwitterAuthProvider();

/**
 * Check if a username already exists in database
 * @param {string} username - The username to check
 * @returns {Promise<boolean>} - True if username exists
 */
export async function checkUsernameExists(username) {
    try {
        const usersRef = db.collection("users");
        const querySnapshot = await usersRef.where("username", "==", username).get();
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Error checking username: ", error);
        throw error;
    }
}

/**
 * Generate username suggestions based on original username
 * @param {string} originalUsername - The original username that was taken
 * @returns {Promise<string[]>} - Array of suggested usernames
 */
export async function generateUsernameSuggestions(originalUsername) {
    try {
        const suggestions = [];
        
        // Try adding random numbers
        for (let i = 0; i < 3; i++) {
            const randomNum = Math.floor(Math.random() * 1000);
            const suggestion = `${originalUsername}${randomNum}`;
            
            // Check if this suggestion is available
            const exists = await checkUsernameExists(suggestion);
            if (!exists) {
                suggestions.push(suggestion);
                if (suggestions.length === 3) break;
            }
        }
        
        // If we don't have 3 suggestions yet, try more variations
        while (suggestions.length < 3) {
            const randomChar = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
            const suggestion = `${originalUsername}${randomChar}`;
            
            // Check if this suggestion is available
            const exists = await checkUsernameExists(suggestion);
            if (!exists && !suggestions.includes(suggestion)) {
                suggestions.push(suggestion);
            }
        }
        
        return suggestions;
    } catch (error) {
        console.error("Error generating username suggestions: ", error);
        // Return some basic suggestions without checking availability
        return [
            `${originalUsername}123`,
            `${originalUsername}456`,
            `${originalUsername}789`
        ];
    }
}

/**
 * Upload image to ImgBB
 * @param {File} imageFile - The image file to upload
 * @returns {Promise<Object>} - Object containing URL data
 */
export async function uploadImageToImgBB(imageFile) {
    const apiKey = 'cae25a5efbe778e17c1db8b6f4e44cd7'; // Replace with your ImgBB API key
    const formData = new FormData();
    formData.append('image', imageFile);
    
    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData,
        });
        
        const data = await response.json();
        
        if (data.success) {
            return {
                displayUrl: data.data.display_url,
                deleteUrl: data.data.delete_url,
                success: true
            };
        } else {
            console.error('Failed to upload image:', data.error);
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Register a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} userData - Additional user data
 * @returns {Promise<Object>} - Success status and user or error
 */
export async function registerUser(email, password, userData) {
    try {
        // Create auth user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update profile with display name (username)
        await user.updateProfile({
            displayName: userData.username,
            photoURL: userData.photoUrl || null
        });
        
        // Send verification email
        await user.sendEmailVerification();
        
        // Create initial user document with basic info
        const userDocData = {
            username: userData.username,
            email: user.email,
            displayName: userData.displayName || '',
            photoUrl: userData.photoUrl || '',
            photoHistory: {},
            gender: userData.gender || '',
            birthday: userData.birthday || null,
            interests: userData.interests || {},
            bioTags: userData.bioTags || {},
            bio: userData.bio || '',
            location: userData.location || '',
            joinDate: firebase.firestore.FieldValue.serverTimestamp(),
            emailVerified: false,
            role: 'user',
            settings: {
                emailNotifications: true,
                darkMode: false
            }
        };
        
        // Add profile picture to photo history if it exists
        if (userData.photoUrl) {
            userDocData.photoHistory[Date.now()] = {
                url: userData.photoUrl,
                deleteUrl: userData.photoDeleteUrl || '',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
        }
        
        // Create the user document in Firestore
        await db.collection("users").doc(user.uid).set(userDocData);
        
        return { success: true, user: user };
    } catch (error) {
        console.error('Error registering user:', error);
        return { 
            success: false, 
            error: error.message,
            code: error.code
        };
    }
}

/**
 * Sign in user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} - Result object with success status
 */
export async function signInWithEmail(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Error signing in:', error);
        return { 
            success: false, 
            error: error.message,
            code: error.code
        };
    }
}

/**
 * Sign in with a social provider
 * @param {string} providerName - The provider to use ('google', 'facebook', or 'twitter')
 * @returns {Promise<Object>} - Result object with success status
 */
export async function signInWithSocial(providerName) {
    try {
        let provider;
        
        switch (providerName) {
            case 'google':
                provider = googleProvider;
                break;
            case 'facebook':
                provider = facebookProvider;
                break;
            case 'twitter':
                provider = twitterProvider;
                break;
            default:
                throw new Error('Invalid provider specified');
        }
        
        const userCredential = await auth.signInWithPopup(provider);
        const user = userCredential.user;
        
        // Check if user exists in Firestore
        const userDocRef = db.collection("users").doc(user.uid);
        const userDoc = await userDocRef.get();
        
        // If the user doesn't exist, create their profile
        if (!userDoc.exists) {
            // Create initial user document with basic info
            const userDocData = {
                username: user.displayName?.replace(/\s+/g, '') || `user_${Math.random().toString(36).substring(2, 10)}`,
                email: user.email,
                displayName: user.displayName || '',
                photoUrl: user.photoURL || '',
                photoHistory: {},
                joinDate: firebase.firestore.FieldValue.serverTimestamp(),
                emailVerified: user.emailVerified,
                role: 'user',
                settings: {
                    emailNotifications: true,
                    darkMode: false
                }
            };
            
            // If user has a photo from social provider, add it to photoHistory
            if (user.photoURL) {
                const timestamp = Date.now().toString();
                userDocData.photoHistory[timestamp] = {
                    url: user.photoURL,
                    deleteUrl: '',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
            }
            
            await userDocRef.set(userDocData);
        }
        
        return { success: true, user: user };
    } catch (error) {
        console.error('Error signing in with social provider:', error);
        return { 
            success: false, 
            error: error.message,
            code: error.code
        };
    }
}

/**
 * Sign out the current user
 * @returns {Promise<Object>} - Result object with success status
 */
export async function signOutUser() {
    try {
        await auth.signOut();
        return { success: true };
    } catch (error) {
        console.error('Error signing out:', error);
        return { 
            success: false, 
            error: error.message
        };
    }
}

/**
 * Send password reset email
 * @param {string} email - User's email
 * @returns {Promise<Object>} - Result object with success status
 */
export async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        return { success: true };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return { 
            success: false, 
            error: error.message,
            code: error.code
        };
    }
}

/**
 * Get current user data from Firestore
 * @returns {Promise<Object>} - User data object
 */
export async function getCurrentUserData() {
    return getUserData();
}

/**
 * Update user profile data
 * @param {Object} userData - Data to update
 * @returns {Promise<Object>} - Result object with success status
 */
export async function updateUserProfile(userData) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'No user logged in' };
    
    try {
        const userDocRef = db.collection("users").doc(user.uid);
        
        // Update auth profile if display name or photo URL are included
        if (userData.username || userData.photoUrl) {
            const updateData = {};
            if (userData.username) updateData.displayName = userData.username;
            if (userData.photoUrl) updateData.photoURL = userData.photoUrl;
            
            await user.updateProfile(updateData);
        }
        
        // Update Firestore document
        await userDocRef.update(userData);
        
        return { success: true };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { 
            success: false, 
            error: error.message
        };
    }
}

/**
 * Add a new profile picture to user's history
 * @param {string} photoUrl - URL of the photo
 * @param {string} deleteUrl - Delete URL from ImgBB
 * @returns {Promise<Object>} - Result object with success status
 */
export async function addProfilePicture(photoUrl, deleteUrl) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'No user logged in' };
    
    try {
        const userDocRef = db.collection("users").doc(user.uid);
        const userDoc = await userDocRef.get();
        
        if (userDoc.exists) {
            // Update profile
            await user.updateProfile({ photoURL: photoUrl });
            
            // Create a timestamp key for the new photo entry
            const timestampKey = Date.now().toString();
            
            // Update Firestore with a map structure
            await userDocRef.update({
                photoUrl: photoUrl,
                [`photoHistory.${timestampKey}`]: {
                    url: photoUrl,
                    deleteUrl: deleteUrl || '',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }
            });
            
            return { success: true };
        } else {
            return { success: false, error: 'User document not found' };
        }
    } catch (error) {
        console.error('Error adding profile picture:', error);
        return { 
            success: false, 
            error: error.message
        };
    }
}

// Check if email is verified
export function isEmailVerified() {
    const user = auth.currentUser;
    return user ? user.emailVerified : false;
}

// Check if user is logged in
export function isUserLoggedIn() {
    return auth.currentUser !== null;
}

// Get current user
export function getCurrentUser() {
    return auth.currentUser;
}

// Get user data from Firestore
export async function getUserData() {
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
        const userDocRef = db.collection("users").doc(user.uid);
        const userDoc = await userDocRef.get();
        
        if (userDoc.exists) {
            return { id: user.uid, ...userDoc.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

// Listen for auth state changes
export function onAuthStateChange(callback) {
    return auth.onAuthStateChanged(callback);
}

/**
 * Delete user account and associated data
 * @param {string} password - User's current password for verification
 * @returns {Promise<Object>} - Result object with success status
 */
export async function deleteAccount(password) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'No user logged in' };
    
    try {
        // First, reauthenticate the user (required for account deletion)
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
        await user.reauthenticateWithCredential(credential);
        
        // Get the user document to access profile picture delete URLs
        const userDocRef = db.collection("users").doc(user.uid);
        const userDoc = await userDocRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Delete profile pictures from ImgBB if delete URLs exist
            if (userData.photoHistory) {
                const deletePromises = [];
                
                // Go through all photos in history and delete them
                for (const key in userData.photoHistory) {
                    const photoData = userData.photoHistory[key];
                    if (photoData.deleteUrl) {
                        try {
                            // Extract delete code from URL (assuming format with delete code at end)
                            const deleteUrl = photoData.deleteUrl;
                            if (deleteUrl && deleteUrl.includes('delete/')) {
                                const deleteCode = deleteUrl.split('delete/').pop();
                                
                                // Call ImgBB API to delete image
                                const deletePromise = fetch(`https://api.imgbb.com/1/delete/${deleteCode}`, {
                                    method: 'POST'
                                }).catch(err => {
                                    console.error('Error deleting profile picture:', err);
                                    // Continue even if image deletion fails
                                });
                                
                                deletePromises.push(deletePromise);
                            }
                        } catch (error) {
                            console.error('Error parsing delete URL:', error);
                            // Continue with next photo
                        }
                    }
                }
                
                // Wait for all delete operations to complete
                await Promise.all(deletePromises);
            }
            
            // Delete the user document from Firestore
            await userDocRef.delete();
        }
        
        // Delete the user's authentication account
        await user.delete();
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting account:', error);
        
        let errorMessage = 'Failed to delete account.';
        
        // Provide more specific error messages
        if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/requires-recent-login') {
            errorMessage = 'For security reasons, please log out and log back in before deleting your account.';
        }
        
        return { 
            success: false, 
            error: errorMessage,
            code: error.code
        };
    }
} 