import { 
    auth, 
    db, 
    storage 
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
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    collection, 
    query, 
    where, 
    getDocs,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

// Providers for social login
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const twitterProvider = new TwitterAuthProvider();

/**
 * Check if a username already exists in database
 * @param {string} username - The username to check
 * @returns {Promise<boolean>} - True if username exists, false otherwise
 */
export async function checkUsernameExists(username) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

/**
 * Generate username suggestions based on original username
 * @param {string} originalUsername - The original username that was taken
 * @returns {Promise<string[]>} - Array of suggested usernames
 */
export async function generateUsernameSuggestions(originalUsername) {
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
        const randomChars = Math.random().toString(36).substring(2, 5);
        const suggestion = `${originalUsername}_${randomChars}`;
        
        const exists = await checkUsernameExists(suggestion);
        if (!exists) {
            suggestions.push(suggestion);
        }
    }
    
    return suggestions;
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
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {Object} userData - Additional user data
 * @returns {Promise<Object>} - Result object with success status
 */
export async function registerUser(email, password, userData) {
    try {
        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update profile with display name (username)
        await updateProfile(user, {
            displayName: userData.username,
            photoURL: userData.photoUrl || null
        });
        
        // Send verification email
        await sendEmailVerification(user);
        
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
            joinDate: serverTimestamp(),
            emailVerified: false,
            role: 'user',
            settings: {
                emailNotifications: true,
                darkMode: false
            }
        };
        
        // If user has a photo, add it to photoHistory as a map field
        if (userData.photoUrl) {
            const timestamp = new Date().getTime().toString();
            userDocData.photoHistory[timestamp] = {
                url: userData.photoUrl,
                deleteUrl: userData.photoDeleteUrl || '',
                timestamp: serverTimestamp()
            };
        }
        
        // Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), userDocData);
        
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
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
        
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        
        // Check if user exists in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        // If the user doesn't exist, create their profile
        if (!userDoc.exists()) {
            // Create initial user document with basic info
            const userDocData = {
                username: user.displayName?.replace(/\s+/g, '') || `user_${Math.random().toString(36).substring(2, 10)}`,
                email: user.email,
                displayName: user.displayName || '',
                photoUrl: user.photoURL || '',
                photoHistory: {},
                joinDate: serverTimestamp(),
                emailVerified: user.emailVerified,
                role: 'user',
                settings: {
                    emailNotifications: true,
                    darkMode: false
                }
            };
            
            // If user has a photo from social provider, add it to photoHistory as a map field
            if (user.photoURL) {
                const timestamp = new Date().getTime().toString();
                userDocData.photoHistory[timestamp] = {
                    url: user.photoURL,
                    deleteUrl: '',
                    timestamp: serverTimestamp()
                };
            }
            
            await setDoc(userDocRef, userDocData);
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
        await signOut(auth);
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
        await sendPasswordResetEmail(auth, email);
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
        const userDocRef = doc(db, "users", user.uid);
        
        // Update auth profile if display name or photo URL are included
        if (userData.username || userData.photoUrl) {
            const updateData = {};
            if (userData.username) updateData.displayName = userData.username;
            if (userData.photoUrl) updateData.photoURL = userData.photoUrl;
            
            await updateProfile(user, updateData);
        }
        
        // Update Firestore document
        await updateDoc(userDocRef, userData);
        
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
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            // Update profile
            await updateProfile(user, { photoURL: photoUrl });
            
            // Create a timestamp key for the new photo entry
            const timestampKey = new Date().getTime().toString();
            
            // Update Firestore with a map structure instead of an array
            await updateDoc(userDocRef, {
                photoUrl: photoUrl,
                [`photoHistory.${timestampKey}`]: {
                    url: photoUrl,
                    deleteUrl: deleteUrl || '',
                    timestamp: serverTimestamp()
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
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
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
    return onAuthStateChanged(auth, callback);
} 