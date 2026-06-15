// lib/firebase.ts
// Khởi tạo Firebase Admin SDK cho Firestore và Storage

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function initFirebase() {
  if (getApps().length) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET?.replace(/^gs:\/\//, ''),
  });
}

const app = initFirebase();

/** Firestore database instance (null nếu Firebase chưa cấu hình) */
export const db = app ? getFirestore(app, 'default') : null;

/** Firebase Storage bucket instance (null nếu Firebase chưa cấu hình) */
export const bucket = app ? getStorage(app).bucket() : null;
