// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  getFirestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const firebaseProjectId = firebaseConfig.projectId;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to local emulators when running locally (or when explicitly enabled).
// This keeps dev data isolated from production.
if (typeof window !== 'undefined') {
  const shouldUseEmulators =
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

  if (shouldUseEmulators) {
    // Guard against re-connecting during HMR.
    const w = window as unknown as {
      __CALMPULSE_FIREBASE_EMULATORS_CONNECTED__?: boolean;
    };

    if (!w.__CALMPULSE_FIREBASE_EMULATORS_CONNECTED__) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
        disableWarnings: true,
      });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      w.__CALMPULSE_FIREBASE_EMULATORS_CONNECTED__ = true;
    }
  }
}

// Enable offline persistence for faster loading
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Firestore persistence already enabled in another tab');
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support persistence
      console.warn('Firestore persistence not supported in this browser');
    }
  });
}

export const storage = getStorage(app); 
