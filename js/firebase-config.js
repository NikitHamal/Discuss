// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxXNJPvvnxhZafQHOf6xGD-MVfCNg8zDE",
  authDomain: "storm-threads.firebaseapp.com",
  databaseURL: "https://storm-threads-default-rtdb.firebaseio.com",
  projectId: "storm-threads",
  storageBucket: "storm-threads.firebasestorage.app",
  messagingSenderId: "845382197197",
  appId: "1:845382197197:web:21610cebf609c1e41aee84",
  measurementId: "G-KTTDW9EE88"
};

// Create dummy implementations in case Firebase isn't loaded
const dummyAuth = {
  currentUser: null,
  onAuthStateChanged: (callback) => callback(null)
};

const dummyFirestore = {
  collection: () => ({
    doc: () => ({
      get: async () => ({ exists: false, data: () => ({}) }),
      set: async () => {},
      update: async () => {}
    }),
    where: () => ({ get: async () => ({ empty: true, docs: [] }) })
  })
};

const dummyStorage = {
  ref: () => ({
    put: async () => ({ ref: { getDownloadURL: async () => '' } })
  })
};

// Variables for export
let firebase, auth, db, storage;

// Check if Firebase is available from the global scope
if (typeof window !== 'undefined' && window.firebase) {
  firebase = window.firebase;
  
  try {
    // Initialize Firebase if not already initialized
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    // Set Firebase services
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    
    console.log('Firebase initialized successfully!');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    
    // Use dummy implementations in case of error
    auth = dummyAuth;
    db = dummyFirestore;
    storage = dummyStorage;
  }
} else {
  console.error('Firebase SDK not loaded! Make sure the Firebase SDK scripts are included in your HTML before this script.');
  
  // Use dummy implementations when Firebase is not available
  firebase = null;
  auth = dummyAuth;
  db = dummyFirestore;
  storage = dummyStorage;
}

// Export the services
export { firebase, auth, db, storage };