import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

describe("Firebase Configuration", () => {
  test("Firebase config should have all required fields", () => {
    expect(firebaseConfig.apiKey).toBeDefined();
    expect(firebaseConfig.authDomain).toBeDefined();
    expect(firebaseConfig.projectId).toBeDefined();
    expect(firebaseConfig.appId).toBeDefined();
  });

  test("Should initialize Firebase app successfully", () => {
    const app = initializeApp(firebaseConfig);
    expect(app).toBeDefined();
  });

  test("Should initialize Firebase Auth", () => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    expect(auth).toBeDefined();
  });

  test("Should initialize Firestore", () => {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    expect(db).toBeDefined();
  });
});

// Simple connectivity test (run manually if needed)
export async function testFirebaseConnection() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("🔥 Testing Firestore connection...");

    // Try to read from a collection
    const testCollection = collection(db, "test");
    const querySnapshot = await getDocs(testCollection);

    console.log("✅ Firestore connection successful!");
    console.log(`📊 Found ${querySnapshot.size} documents in test collection`);

    return true;
  } catch (error) {
    console.error("❌ Firestore connection failed:", error);
    return false;
  }
}
