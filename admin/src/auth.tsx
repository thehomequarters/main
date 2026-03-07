import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// Auto-sign-out after 8 hours of inactivity
const IDLE_TIMEOUT_MS = 8 * 60 * 60 * 1000;

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      fbSignOut(auth);
    }, IDLE_TIMEOUT_MS);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const adminDoc = await getDoc(doc(db, "admins", u.uid));
          if (adminDoc.exists()) {
            setUser(u);
            setIsAdmin(true);
            resetIdleTimer();
          } else {
            // Authenticated but not in /admins — sign out immediately
            await fbSignOut(auth);
            setUser(null);
            setIsAdmin(false);
          }
        } catch (e) {
          console.error("Admin check failed:", e);
          await fbSignOut(auth);
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Reset idle timer on any user interaction
  useEffect(() => {
    if (!user) return;
    const handler = () => resetIdleTimer();
    const events = ["mousedown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, [user]);

  const signOut = async () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    await fbSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
