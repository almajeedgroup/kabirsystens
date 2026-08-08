// ─────────────────────────────────────────────────────────────────────────
//  FIREBASE CREDENTIALS  —  paste your project's web config below.
//
//  Firebase Console → Project settings → General → "Your apps" → Web app →
//  SDK setup and configuration → "Config". Copy the values into the fields.
//
//  While these stay blank the app runs in LOCAL mode (browser storage, no
//  login), so the preview keeps working. As soon as apiKey + projectId are
//  filled in, the app switches to Firebase mode: an admin login screen and
//  cloud (Firestore) storage.
//
//  These web keys are safe to keep in the client — access is controlled by
//  Firebase Authentication and the Firestore security rules, not by hiding
//  the config. Vite env vars (VITE_FIREBASE_*) override these when present.
// ─────────────────────────────────────────────────────────────────────────

const env = import.meta.env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

// True once the essential fields are present.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);
