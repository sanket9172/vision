/**
 * Firebase config — replace these values from Firebase Console
 * Project settings → Your apps → Web app → config object
 *
 * Until you paste real keys, the form will show a clear setup message
 * and will NOT pretend to save successfully.
 */
export const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID",
};

/** Collection name in Firestore where all India-wide signups land */
export const COLLECTION_NAME = "signups";
