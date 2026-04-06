import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { LogIn, Mail, Lock, AlertCircle, Chrome } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleUserRedirect(userCredential.user.uid, userCredential.user.email);
    } catch (error: any) {
      console.error('Login failed', error);
      if (error.code === 'auth/operation-not-allowed') {
        setError('Login dengan Email/Password belum diaktifkan di Firebase Console. Silakan hubungi admin atau gunakan Google Login.');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Email atau password salah.');
      } else {
        setError('Gagal masuk. Silakan coba lagi nanti.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        const isSuperAdmin = result.user.email === 'darusyifa.awn@gmail.com';
        if (isSuperAdmin) {
          await setDoc(doc(db, 'users', result.user.uid), {
            name: result.user.displayName || 'Admin',
            email: result.user.email,
            role: 'admin',
            createdAt: serverTimestamp()
          });
          navigate('/admin-dashboard');
        } else {
          await auth.signOut();
          setError('Akun Anda belum didaftarkan oleh Admin. Silakan hubungi admin sekolah.');
        }
      } else {
        await handleUserRedirect(result.user.uid, result.user.email);
      }
    } catch (error: any) {
      console.error('Google login failed', error);
      setError('Gagal masuk dengan Google. Pastikan popup tidak terblokir.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserRedirect = async (uid: string, email?: string | null) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      let role = userDoc.data().role;
      
      // Force update to admin if email matches the super admin email
      if (email === 'darusyifa.awn@gmail.com' && role !== 'admin') {
        role = 'admin';
        await setDoc(doc(db, 'users', uid), { role: 'admin' }, { merge: true });
      }
      
      navigate(`/${role}-dashboard`);
    } else {
      await auth.signOut();
      setError('Akun Anda belum didaftarkan oleh Admin. Silakan hubungi admin sekolah.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-green-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-green-200">RA</div>
          <h2 className="text-2xl font-bold text-gray-800">Portal Darusyifa</h2>
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
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : <><LogIn size={20} /> Masuk Portal</>}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">Atau masuk dengan</span></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <Chrome size={20} className="text-blue-500" /> Google Login
        </button>

        <p className="mt-8 text-center text-xs text-gray-400">
          Lupa password? Silakan hubungi bagian Administrasi Sekolah.
        </p>
      </div>
    </div>
  );
}
