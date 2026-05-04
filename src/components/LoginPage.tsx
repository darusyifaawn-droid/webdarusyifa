import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { LogIn, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'landingPage'), (snap) => {
      if (snap.exists()) {
        setLogoUrl(snap.data().logoUrl);
      }
    });
    return () => unsub();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleUserRedirect(userCredential.user.uid, userCredential.user.email);
    } catch (error: any) {
      console.error('Login failed', error);
      
      // Auto-create admin account if it doesn't exist
      if (email === 'darusyifa.awn@gmail.com' && (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found')) {
        try {
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await handleUserRedirect(userCredential.user.uid, userCredential.user.email);
          return; // Success!
        } catch (createError: any) {
          if (createError.code === 'auth/email-already-in-use') {
            setError('Password yang Anda masukkan salah. Silakan klik "Lupa Password?" untuk mereset.');
          } else {
            setError('Gagal membuat akun admin: ' + createError.message);
          }
          setLoading(false);
          return;
        }
      }

      if (error.code === 'auth/operation-not-allowed') {
        setError('Login dengan Email/Password belum diaktifkan di Firebase Console. Silakan hubungi admin.');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('Email atau password salah.');
      } else {
        setError('Gagal masuk. Silakan coba lagi nanti.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserRedirect = async (uid: string, email?: string | null) => {
    try {
      console.log("Fetching user doc for uid:", uid);
      const userDoc = await getDoc(doc(db, 'users', uid));
      console.log("User doc fetched. Exists:", userDoc.exists());
      
      // Auto-create or update super admin
      if (email === 'darusyifa.awn@gmail.com') {
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          console.log("Creating/updating super admin doc...");
          await setDoc(doc(db, 'users', uid), { 
            role: 'admin',
            email: email,
            name: 'Super Admin',
            createdAt: new Date()
          }, { merge: true });
          console.log("Super admin doc created/updated.");
        }
        navigate('/admin-dashboard');
        return;
      }

      if (userDoc.exists()) {
        const role = userDoc.data().role;
        navigate(`/${role}-dashboard`);
      } else {
        await auth.signOut();
        setError('Akun Anda belum didaftarkan oleh Admin. Silakan hubungi admin sekolah.');
      }
    } catch (err: any) {
      console.error("Error in handleUserRedirect:", err);
      throw err;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 relative">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          {logoUrl ? (
            <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-2xl border-2 border-green-600 p-1 bg-white">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-green-200">RA</div>
          )}
          <h2 className="text-2xl font-bold text-gray-800">RA Darusyifa Arjawinangun</h2>
          <p className="text-gray-500 text-sm">Silakan masuk untuk mengakses dashboard Anda</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex gap-3 items-start">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Email" 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all" 
              required 
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Password" 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all" 
              required 
            />
          </div>
          
          <div className="flex justify-end">
            <button 
              type="button"
              onClick={async () => {
                if (!email) {
                  setError('Masukkan email Anda terlebih dahulu untuk mereset password.');
                  return;
                }
                try {
                  const { sendPasswordResetEmail } = await import('firebase/auth');
                  await sendPasswordResetEmail(auth, email);
                  setError('Link reset password telah dikirim ke email Anda. Silakan cek inbox/spam.');
                } catch (err: any) {
                  setError('Gagal mengirim link reset password: ' + err.message);
                }
              }}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Lupa Password?
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : <><LogIn size={20} /> Masuk Portal</>}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-400">
          Hanya pengguna yang terdaftar oleh Admin yang dapat masuk.
        </p>
      </div>
    </div>
  );
}
