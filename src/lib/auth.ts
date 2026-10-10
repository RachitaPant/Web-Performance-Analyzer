import { auth, FIREBASE_UNAVAILABLE_MESSAGE } from "./firebaseClient";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

// Throws inside each helper's try block, so callers get it back as `{ error }`.
const requireAuth = () => {
  if (!auth) throw new Error(FIREBASE_UNAVAILABLE_MESSAGE);
  return auth;
};

export const signUpUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      requireAuth(),
      email,
      password
    );
    return { data: userCredential, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signInUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      requireAuth(),
      email,
      password
    );
    return { data: userCredential, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(requireAuth());
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const getCurrentUser = async () => {
  return auth?.currentUser ?? null;
};
