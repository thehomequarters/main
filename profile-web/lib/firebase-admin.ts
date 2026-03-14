import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(
          JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string)
        ),
      });

export const adminDb = getFirestore(app);
