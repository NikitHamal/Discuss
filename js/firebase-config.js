// Firebase configuration for compat version
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

// Get the global firebase object from the window
const firebase = window.firebase;

// Initialize Firebase with compat version
firebase.initializeApp(firebaseConfig);

// Export the firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

export { firebase, auth, db, storage }; 