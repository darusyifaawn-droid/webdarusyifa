import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserData } from '../types';

interface AuthContextType {
 user: User | null;
 userData: UserData | null;
 loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userData: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [user, setUser] = useState<User | null>(null);
 const [userData, setUserData] = useState<UserData | null>(null);
 const [loading, setLoading] = useState(true);

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

 const unsubscribe = onAuthStateChanged(auth, async (user) => {
 try {
 setUser(user);
 if (user) {
 const userDoc = await getDoc(doc(db, 'users', user.uid));
 if (userDoc.exists()) {
 setUserData({ id: user.uid, ...userDoc.data() } as UserData);
 } else {
 setUserData(null);
 }
 } else {
 setUserData(null);
 }
 } catch (error) {
 console.error("Auth initialization error:", error);
 setUserData(null);
 } finally {
 setLoading(false);
 }
 });

 return () => unsubscribe();
 }, []);

 return (
 <AuthContext.Provider value={{ user, userData, loading }}>
 {children}
 </AuthContext.Provider>
 );
};
