import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app"
import { getAuth, Auth } from "firebase/auth"

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCMk5peWqDN70xr_BGFkNUFswFAQi1LRsg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "starcastonline-live.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "starcastonline-live",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "starcastonline-live.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "713609005713",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:713609005713:web:e4305c32f8beae727ecd30",
}

export function getClientFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp()
  }
  return initializeApp(firebaseConfig)
}

export function getClientFirebaseAuth(): Auth {
  const app = getClientFirebaseApp()
  return getAuth(app)
}
