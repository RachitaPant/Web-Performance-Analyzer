"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "./firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";

const AuthContext = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No Firebase config: nobody can be signed in, so stop "loading" right away.
    if (!auth) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
