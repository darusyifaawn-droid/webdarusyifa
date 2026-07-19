import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { LogIn, Mail, Lock, AlertCircle, ArrowLeft, BookOpen } from 'lucide-react';

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
      
      const errorCode = error.code || '';
      
      // Auto-create admin account if it doesn't exist
      if (email === 'darusyifa.awn@gmail.com' && (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password')) {
        try {
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await handleUserRedirect(userCredential.user.uid, userCredential.user.email);
          return; // Success!
        } catch (createError: any) {
          const createErrCode = createError.code || '';
          if (createErrCode === 'auth/email-already-in-use') {
            setError('Email sudah terdaftar. Password yang Anda masukkan salah. Gunakan fitur "Lupa Password?" jika perlu.');
          } else {
            setError('Masalah kredensial. Periksa kembali email dan password Anda.');
          }
          setLoading(false);
          return;
        }
      }

      if (errorCode === 'auth/operation-not-allowed') {
        setError('Login dengan Email/Password belum diaktifkan di Firebase Console. Silakan hubungi admin.');
      } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        setError('Email atau password salah. Pastikan anda sudah terdaftar dan memasukkan password yang benar.');
      } else {
        setError('Gagal masuk. ' + (error.message || 'Coba lagi nanti.'));
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
        const targetPath = role === 'parent' ? '/parent-dashboard' : `/${role}-dashboard`;
        navigate(targetPath);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-50/50 rounded-full blur-3xl" />
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] w-full max-w-md border border-slate-100 relative z-10">
        <div className="text-center mb-10">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold text-xs uppercase tracking-widest mb-8 transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Beranda Utama</span>
          </Link>

          {logoUrl ? (
            <div className="w-24 h-24 mx-auto mb-6 overflow-hidden rounded-[2rem] border-4 border-emerald-50 p-2 bg-white shadow-inner">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 shadow-xl shadow-emerald-100">RA</div>
          )}
          <h2 className="text-3xl font-display font-extrabold text-slate-800 tracking-tight">Portal Digital</h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">RA Darusyifa Arjawinangun</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-4">Alamat Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="email@sekolah.com" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] outline-none focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-700 placeholder:text-slate-300" 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-4">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Kata Sandi</label>
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
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-tighter"
              >
                Lupa Password?
              </button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] outline-none focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-700 placeholder:text-slate-300" 
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-[1.25rem] font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><LogIn size={20} /> <span className="tracking-tight">Masuk Portal</span></>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50">
          <Link 
            to="/juknis" 
            className="group flex items-center justify-between p-4 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl transition-all border border-emerald-100/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <BookOpen size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/50 leading-none mb-1">Panduan Pengguna</p>
                <p className="text-xs font-bold text-emerald-700">Petunjuk Wali Murid</p>
              </div>
            </div>
            <ArrowLeft size={16} className="text-emerald-300 rotate-180 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          RA Darusyifa Arjawinangun &copy; 2024
        </p>
      </div>
    </div>
  );
}
