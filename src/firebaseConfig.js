// ─────────────────────────────────────────────────────────────────────────
//  FIREBASE CREDENTIALS  —  Kabir Ind PU College (project kabiradmin-bd8bd).
//
//  These web keys are safe to keep in the client: access is controlled by
//  Firebase Authentication and the Firestore security rules, not by hiding
//  the config. Values can be overridden with VITE_FIREBASE_* env vars.
//
//  The single-file preview build forces LOCAL mode (browser storage, no
//  login) because its sandbox blocks Firebase's network calls; the normal
//  build (used by `firebase deploy`) runs in FIREBASE mode with admin login
//  and Cloud Firestore.
// ─────────────────────────────────────────────────────────────────────────

const env = import.meta.env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyAYJokY-Ikw-frZI2MKzSPNZkdhDLygwAg',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'kabiradmin-bd8bd.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'kabiradmin-bd8bd',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'kabiradmin-bd8bd.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '522790579719',
  appId: env.VITE_FIREBASE_APP_ID || '1:522790579719:web:85340773cbcff8e6d7c4a2',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-HLM06DH861',
};

// The preview (single-file) build sets this to true to stay in local mode.
const forceLocal =
  typeof __FORCE_LOCAL_MODE__ !== 'undefined' ? __FORCE_LOCAL_MODE__ : false;

export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId) && !forceLocal;
