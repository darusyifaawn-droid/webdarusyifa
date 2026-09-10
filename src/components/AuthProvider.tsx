import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { UserData } from '../types';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  userData: null, 
  loading: true,
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cachedUser] = useState<UserData | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('darusyifa_auth_cache');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [userData, setUserData] = useState<UserData | null>(cachedUser);
  const [loading, setLoading] = useState<boolean>(() => !cachedUser && !auth.currentUser);

  const logout = async () => {
    try {
      if (auth.currentUser) {
        updatePresence(auth.currentUser.uid, userData?.id, false);
      }
      localStorage.removeItem('darusyifa_auth_cache');
      setUserData(null);
      setUser(null);
      await auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Update presence heartbeat in Firestore
  const updatePresence = async (uid: string, targetDocId?: string, isOnline: boolean = true) => {
    try {
      const isMobile = typeof window !== 'undefined' && (
        window.innerWidth < 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
      
      const presencePayload = {
        isOnline,
        lastActiveAt: new Date().toISOString(),
        lastActiveTimestamp: Date.now(),
        lastActiveDevice: isMobile ? 'Mobile' : 'Desktop',
        deviceType: isMobile ? 'mobile' : 'desktop'
      };

      // 1. Update primary doc by uid non-blocking
      const primaryRef = doc(db, 'users', uid);
      updateDoc(primaryRef, presencePayload).catch(() => {
        setDoc(primaryRef, presencePayload, { merge: true }).catch(() => {});
      });

      // 2. If targetDocId is different, update it too
      if (targetDocId && targetDocId !== uid) {
        const secondaryRef = doc(db, 'users', targetDocId);
        updateDoc(secondaryRef, presencePayload).catch(() => {});
      }
    } catch (err) {
      // Ignore error silently
    }
  };

  useEffect(() => {
    // Enforce light mode and cleanup any residual dark mode class/storage
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
      localStorage.removeItem('app_theme');
      localStorage.removeItem('admin_finance_theme');
    }

    let heartbeatInterval: any = null;
    let currentResolvedDocId: string | undefined = userData?.id;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          let userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
          let docId = currentUser.uid;
          
          // Fallback: If not found by UID, search by email
          if (!userDocSnap.exists() && currentUser.email) {
            try {
              const q = query(collection(db, 'users'), where('email', '==', currentUser.email));
              const querySnapshot = await getDocs(q);
              if (!querySnapshot.empty) {
                userDocSnap = querySnapshot.docs[0];
                docId = userDocSnap.id;
              }
            } catch (searchErr) {
              console.error("User email lookup error:", searchErr);
            }
          }

          if (userDocSnap.exists()) {
            currentResolvedDocId = docId;
            const uData = { id: docId, ...userDocSnap.data() } as UserData;
            setUserData(uData);
            try {
              localStorage.setItem('darusyifa_auth_cache', JSON.stringify(uData));
            } catch {}
            
            // Sync to users/{uid} if docId was a custom/different ID so Firestore rules succeed
            if (docId !== currentUser.uid) {
              setDoc(doc(db, 'users', currentUser.uid), { ...uData, id: currentUser.uid, originalDocId: docId }, { merge: true }).catch(() => {});
            }

            // Initial presence update
            updatePresence(currentUser.uid, docId, true);

            // Heartbeat every 25 seconds while tab/app is open
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            heartbeatInterval = setInterval(() => {
              updatePresence(currentUser.uid, currentResolvedDocId, true);
            }, 25000);
          } else {
            setUserData(null);
            localStorage.removeItem('darusyifa_auth_cache');
          }
        } else {
          setUserData(null);
          localStorage.removeItem('darusyifa_auth_cache');
          currentResolvedDocId = undefined;
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setUserData(null);
        localStorage.removeItem('darusyifa_auth_cache');
      } finally {
        setLoading(false);
      }
    });

    // Presence update on user activity / visibility change
    let lastActivityTime = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityTime > 15000 && auth.currentUser) {
        lastActivityTime = now;
        updatePresence(auth.currentUser.uid, currentResolvedDocId, true);
      }
    };

    const handleVisibilityChange = () => {
      if (auth.currentUser) {
        const isVisible = document.visibilityState === 'visible';
        updatePresence(auth.currentUser.uid, currentResolvedDocId, isVisible);
      }
    };

    // Cleanup on tab close / leave
    const handleBeforeUnload = () => {
      if (auth.currentUser) {
        updatePresence(auth.currentUser.uid, currentResolvedDocId, false);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('click', handleUserActivity, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
