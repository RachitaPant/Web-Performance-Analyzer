import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Without config (e.g. a preview deployment whose env vars are scoped to production), initializing
// throws auth/invalid-api-key at module load — which fails `next build` during prerendering.
// Initialize only when configured; callers handle `null` by disabling sign-in and history.
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// The app signs in only with email/password and anonymously, so Auth is initialized without the
// popup/redirect resolver. getAuth() includes it, and it loads Firebase's auth iframe and Google's
// API loader (~128 KB of script) on every page: SitePulse's own CI caught the landing page's first
// paint swinging between ~1 s and ~4 s in PageSpeed depending on when that iframe loaded.
// Persistence matches getAuth()'s browser defaults, so existing sessions are kept.
const createAuth = (app: FirebaseApp): Auth => {
  if (typeof window === "undefined") return getAuth(app); // server prerender: no browser storage
  try {
    return initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  } catch {
    return getAuth(app); // already initialized (e.g. after a hot reload)
  }
};

export const firebaseApp = isFirebaseConfigured ? (getApps()[0] ?? initializeApp(firebaseConfig)) : null;

export const auth = firebaseApp ? createAuth(firebaseApp) : null;
// Firestore lives in ./firestore so pages that only sign in (e.g. /login) don't download it.

export const FIREBASE_UNAVAILABLE_MESSAGE = "Sign-in isn't configured on this deployment.";
