import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { LogIn, Mail, Lock, AlertCircle, ArrowLeft, BookOpen, Eye, EyeOff, Sparkles, Shield, X } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  // Initial Master Admin Registration States
  const [hasAdminAccount, setHasAdminAccount] = useState<boolean | null>(null);
  const [showRegisterAdminModal, setShowRegisterAdminModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'landingPage'), (snap) => {
      if (snap.exists()) {
        setLogoUrl(snap.data().logoUrl);
      }
    }, (error) => {
      console.error("Error fetching landing page settings:", error);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const checkAdmins = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'admin'));
        const snap = await getDocs(q);
        setHasAdminAccount(!snap.empty);
      } catch (err) {
        console.error("Error checking admin accounts:", err);
        setHasAdminAccount(true); // default safe fallback
      }
    };
    checkAdmins();
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
      
      // Auto-create admin account if superadmin credentials match
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
        const cleanEmail = email.trim().toLowerCase();
        let healed = false;
        try {
          const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const userDoc = snap.docs[0];
            const uData = userDoc.data();
            const storedPassword = uData.plainPassword || uData.password;

            if (storedPassword && storedPassword === password) {
              if (errorCode === 'auth/user-not-found') {
                const { createUserWithEmailAndPassword } = await import('firebase/auth');
                const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
                await handleUserRedirect(userCredential.user.uid, cleanEmail);
                healed = true;
                return;
              } else {
                const candidates = [
                  '123456',
                  'DARUSYIFA123',
                  uData.previousPassword,
                  'admin123'
                ].filter((p): p is string => Boolean(p) && p !== password);

                for (const oldPass of candidates) {
                  try {
                    const cred = await signInWithEmailAndPassword(auth, cleanEmail, oldPass);
                    const { updatePassword } = await import('firebase/auth');
                    try {
                      await updatePassword(cred.user, password);
                    } catch (syncErr) {
                      console.warn("Could not sync updated password to Auth:", syncErr);
                    }
                    await handleUserRedirect(cred.user.uid, cred.user.email);
                    healed = true;
                    return;
                  } catch {
                    // Coba kandidat berikutnya
                  }
                }
              }
            }
          }
        } catch (recoveryErr) {
          console.error("Smart login recovery error:", recoveryErr);
        }

        if (!healed) {
          setError('Email atau password salah. Pastikan anda sudah terdaftar dan memasukkan password yang benar.');
        }
      } else {
        setError('Gagal masuk. ' + (error.message || 'Coba lagi nanti.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterFirstAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegLoading(true);
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const cred = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword);
      const uid = cred.user.uid;

      const adminData = {
        id: uid,
        name: regName.trim() || 'Master Admin',
        email: regEmail.trim().toLowerCase(),
        whatsapp: regWhatsapp.trim(),
        role: 'admin',
        plainPassword: regPassword,
        createdAt: new Date().toISOString(),
        isOnline: true,
        lastActiveAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', uid), adminData);
      try {
        localStorage.setItem('darusyifa_auth_cache', JSON.stringify(adminData));
      } catch {}

      alert('Alhamdulillah, Akun Master Admin pertama sekolah berhasil dibuat! Anda akan otomatis masuk ke Portal Admin.');
      setShowRegisterAdminModal(false);
      setHasAdminAccount(true);
      navigate('/admin-dashboard', { replace: true });
    } catch (err: any) {
      console.error("Failed to create first admin:", err);
      if (err.code === 'auth/email-already-in-use') {
        setRegError('Email ini sudah terdaftar. Silakan langsung login atau reset password.');
      } else {
        setRegError('Gagal membuat akun Admin: ' + (err.message || 'Coba lagi nanti.'));
      }
    } finally {
      setRegLoading(false);
    }
  };

  const handleUserRedirect = async (uid: string, email?: string | null) => {
    try {
      let userDoc = await getDoc(doc(db, 'users', uid));
      let docId = uid;

      if (!userDoc.exists() && email) {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          userDoc = snap.docs[0];
          docId = userDoc.id;
        }
      }
      
      if (email === 'darusyifa.awn@gmail.com') {
        const adminData = { 
          id: uid,
          role: 'admin',
          email: email,
          name: 'Super Admin',
          isOnline: true,
          lastActiveAt: new Date().toISOString(),
          lastActiveTimestamp: Date.now(),
          deviceType: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop'
        };
        try {
          localStorage.setItem('darusyifa_auth_cache', JSON.stringify(adminData));
        } catch {}
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          setDoc(doc(db, 'users', uid), { ...adminData, createdAt: new Date() }, { merge: true }).catch(() => {});
        }
        navigate('/admin-dashboard', { replace: true });
        return;
      }

      if (userDoc.exists()) {
        const isMobile = typeof window !== 'undefined' && (
          window.innerWidth < 768 || 
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        );

        updateDoc(doc(db, 'users', docId), {
          isOnline: true,
          lastActiveAt: new Date().toISOString(),
          lastActiveTimestamp: Date.now(),
          lastActiveDevice: isMobile ? 'Mobile' : 'Desktop',
          deviceType: isMobile ? 'mobile' : 'desktop'
        }).catch(() => {});

        const uData = { id: docId, ...userDoc.data() };
        try {
          localStorage.setItem('darusyifa_auth_cache', JSON.stringify(uData));
        } catch {}

        const role = userDoc.data().role;
        const targetPath = role === 'parent' ? '/parent-dashboard' : `/${role}-dashboard`;
        navigate(targetPath, { replace: true });
      } else {
        await auth.signOut();
        localStorage.removeItem('darusyifa_auth_cache');
        setError('Akun Anda belum didaftarkan oleh Admin. Silakan hubungi admin sekolah.');
      }
    } catch (err: any) {
      console.error("Error in handleUserRedirect:", err);
      throw err;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden">
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
          <p className="text-slate-500 text-sm mt-2 font-medium">Sistem Informasi Manajemen RA</p>
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
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] outline-none focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-700 placeholder:text-slate-300" 
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 focus:text-emerald-600 transition-colors p-1"
                title={showPassword ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
                aria-label={showPassword ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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

        {/* Initial Master Admin Setup Prompt if DB is empty */}
        {hasAdminAccount === false && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center animate-in fade-in slide-in-from-bottom-2">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Sparkles size={20} />
            </div>
            <p className="text-xs font-black text-emerald-800 uppercase tracking-tight mb-1">
              Database Sekolah Baru Terdeteksi!
            </p>
            <p className="text-[11px] text-emerald-600 mb-3 leading-relaxed font-medium">
              Belum ada akun Administrator di database ini. Silakan daftarkan akun Master Admin pertama untuk mengaktifkan portal sekolah Anda.
            </p>
            <button
              onClick={() => setShowRegisterAdminModal(true)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-200 transition-all cursor-pointer active:scale-95"
            >
              Registrasi Master Admin Pertama
            </button>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-slate-50 space-y-3">
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
      </div>

      {/* Modal Registrasi Master Admin Pertama */}
      {showRegisterAdminModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowRegisterAdminModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Shield size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-800">Registrasi Master Admin</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Buat akun pengelola utama pertama untuk portal RA ini</p>
            </div>

            {regError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs flex gap-2 items-center">
                <AlertCircle size={16} />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterFirstAdmin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Nama Administrator / Kepala Sekolah</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: H. Ahmad Subagja, S.Pd"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Email Resmi Admin</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="admin@rasekolah.com"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Kata Sandi / Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">No. WhatsApp Admin</label>
                <input
                  type="text"
                  required
                  value={regWhatsapp}
                  onChange={(e) => setRegWhatsapp(e.target.value)}
                  placeholder="08123456789"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  {regLoading ? 'Memproses Registrasi...' : 'Aktifkan Akun Master Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
