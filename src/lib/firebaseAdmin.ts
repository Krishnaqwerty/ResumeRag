import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App | undefined;

export function getAdminApp() {
  if (!app) {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !privateKey || !process.env.FIREBASE_ADMIN_PROJECT_ID) {
      throw new Error('Missing firebase admin credentials');
    }
    app = getApps()[0] || initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
  return app;
}

export function verifyIdToken(idToken: string) {
  return getAuth(getAdminApp()).verifyIdToken(idToken);
}

export async function ensureUserProfile(uid: string, email?: string | null) {
  const db = getFirestore(getAdminApp());
  const ref = db.collection('userProfiles').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({ uid, email: email || null, createdAt: Date.now(), lastActiveAt: Date.now(), role: 'user' });
  } else {
    await ref.update({ lastActiveAt: Date.now() });
  }
}
