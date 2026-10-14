import { getFirestore } from "firebase/firestore";
import { firebaseApp } from "./firebaseClient";

// Separate module so only the dashboard (saved history and trends) downloads the Firestore SDK.
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
