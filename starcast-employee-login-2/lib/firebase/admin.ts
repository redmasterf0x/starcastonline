import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App;

export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || "starcastonline-live";

  // If a service account key JSON is provided via environment
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      const parsed = typeof serviceAccountJson === "string" ? JSON.parse(serviceAccountJson) : serviceAccountJson;
      app = initializeApp({
        credential: cert(parsed),
        projectId,
        storageBucket: `${projectId}.appspot.com`,
      });
      return app;
    } catch (err) {
      console.warn("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", err);
    }
  }

  // On Google Cloud (App Hosting / Cloud Run), Application Default Credentials are automatically discovered
  app = initializeApp({
    projectId,
    storageBucket: `${projectId}.appspot.com`,
  });
  return app;
}

export function getFirestoreDb(): Firestore {
  const adminApp = getFirebaseAdminApp();
  return getFirestore(adminApp);
}

export function getFirebaseStorage(): Storage {
  const adminApp = getFirebaseAdminApp();
  return getStorage(adminApp);
}

export function getFirebaseAuth(): Auth {
  const adminApp = getFirebaseAdminApp();
  return getAuth(adminApp);
}

export const firestore = getFirestoreDb();
