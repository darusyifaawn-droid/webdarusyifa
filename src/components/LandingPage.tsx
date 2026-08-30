import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Users, BookOpen, Home, Award, Calendar, MessageCircle, MapPin, Shield, Heart, Menu, X, Star } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';

export default function LandingPage() {
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 const [settings, setSettings] = useState<any>(null);

 useEffect(() => {
 const fetchSettings = async () => {
 try {
 const docRef = doc(db, 'settings', 'landingPage');
 const docSnap = await getDoc(docRef);
 if (docSnap.exists()) {
 setSettings(docSnap.data());
 }
 } catch (error) {
 console.error("Error fetching settings:", error);
 }
 };
 fetchSettings();
 }, []);

 const defaultGalleryImages = [
 "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
 "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
 "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80",
 "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
 "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80",
 "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80",
 "https://images.unsplash.com/photo-1603354350317-6f7aaa5911c5?auto=format&fit=crop&w=800&q=80",
 "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
 "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80",
 ];

 const galleryImages = settings?.galleryImages?.length > 0 ? settings.galleryImages : defaultGalleryImages;
 const logoUrl = settings?.logoUrl || "https://ui-avatars.com/api/?name=RA+Darusyifa&background=16a34a&color=fff&size=128";
 const heroImageUrl = settings?.heroImageUrl || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1000&q=80";
 const accreditationText = settings?.accreditationText || "Terakreditasi B";
 const schoolName = settings?.schoolName || "RA Darusyifa Arjawinangun";
 const aboutTitle = settings?.aboutTitle || "Membangun Generasi Cerdas & Berakhlak Mulia";
 const aboutText = settings?.aboutText || "RA Darusyifa Arjawinangun hadir untuk memberikan pendidikan anak usia dini yang berkualitas dengan nilai-nilai Islami yang kuat dan menyenangkan.";
 const address = settings?.address || "Jl. Raya Arjawinangun No. 123, Cirebon, Jawa Barat.";
 const whatsappNumber = settings?.whatsappNumber || "6283199863444";
 const whatsappLink = `https://wa.me/${whatsappNumber}`;

 return (
 <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
 {/* Floating WhatsApp Button */}
 <a 
 href={whatsappLink} 
 target="_blank" 
 rel="noopener noreferrer"
 className="fixed bottom-6 right-6 bg-emerald-500 text-white p-4 rounded-2xl shadow-[0_20px_50px_-12px_rgba(16,185,129,0.4)] z-[100] hover:bg-emerald-600 transition-all hover:scale-110 flex items-center gap-3 active:scale-95"
 >
 <MessageCircle size={24} />
 <span className="hidden sm:inline font-bold tracking-tight">Hubungi Kami</span>
 </a>

 {/* Navigation */}
 <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-100">
 <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-emerald-600/10 shadow-sm">
 <img 
 src={logoUrl} 
 alt="Logo RA Darusyifa Arjawinangun" 
 className="w-full h-full object-contain"
 onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=RA+Darusyifa&background=16a34a&color=fff'; }}
 referrerPolicy="no-referrer"
 />
 </div>
 <div className="hidden sm:block">
 <h1 className="text-lg font-display font-black text-emerald-900 leading-none tracking-tight">{schoolName}</h1>
 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1">Cerdas & Berakhlak</p>
 </div>
 </div>
 
 {/* Desktop Nav */}
 <div className="hidden md:flex items-center gap-10">
 {['Profil', 'Program', 'Galeri'].map((item) => (
 <a 
 key={item}
 href={`#${item.toLowerCase()}`} 
 className="text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors uppercase tracking-widest"
 >
 {item}
 </a>
 ))}
 <Link to="/login" className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95">
 Masuk Portal
 </Link>
 </div>

 {/* Mobile Menu Toggle */}
 <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-slate-600 hover:text-emerald-600 transition-colors bg-slate-50 rounded-xl">
 {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
 </button>
 </nav>

 {/* Mobile Menu Overlay */}
 {isMenuOpen && (
 <div className="md:hidden bg-white border-b border-slate-100 p-8 space-y-6 animate-in slide-in-from-top duration-500">
 {['Profil', 'Program', 'Galeri'].map((item) => (
 <a 
 key={item}
 href={`#${item.toLowerCase()}`} 
 onClick={() => setIsMenuOpen(false)} 
 className="block text-xl font-display font-bold text-slate-800 hover:text-emerald-600"
 >
 {item}
 </a>
 ))}
 <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block w-full bg-emerald-600 text-white text-center py-4 rounded-2xl font-bold shadow-xl shadow-emerald-100">
 Masuk Portal
 </Link>
 </div>
 )}
 </header>

 {/* Hero Section */}
 <section className="pt-40 pb-24 px-4 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/50 via-white to-white">
 <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
 <div className="flex-1 text-center lg:text-left">
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-emerald-100 shadow-sm"
 >
 <Award size={14} />
 {accreditationText}
 </motion.div>
 <motion.h2 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="text-5xl lg:text-7xl font-display font-extrabold text-slate-900 leading-[1.1] mb-8 tracking-tight whitespace-pre-line"
 >
 {aboutTitle}
 </motion.h2>
 <motion.p 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
 >
 {aboutText}
 </motion.p>
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start"
 >
 <Link to="/login" className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 hover:-translate-y-1 active:translate-y-0">
 Masuk Portal Siswa
 </Link>
 <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="bg-white text-emerald-700 border-2 border-emerald-100 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 hover:border-emerald-600 shadow-sm">
 <MessageCircle size={24} className="text-emerald-500" /> 
 <span>Hubungi WA</span>
 </a>
 </motion.div>
 </div>
 <motion.div 
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: 0.2, duration: 0.8 }}
 className="flex-1 relative"
 >
 <div className="absolute -top-12 -left-12 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl" />
 <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-yellow-200/30 rounded-full blur-3xl" />
 <div className="relative z-10 p-4 bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-100">
 <img 
 src={heroImageUrl} 
 alt="RA Darusyifa Arjawinangun Activities" 
 className="rounded-[2rem] object-cover w-full h-[450px] lg:h-[600px] shadow-inner"
 referrerPolicy="no-referrer"
 />
 </div>
 </motion.div>
 </div>
 </section>

 {/* Features/Stats Section */}
 <section className="py-24 bg-white border-y border-slate-50">
 <div className="max-w-7xl mx-auto px-4">
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
 {[
 { label: 'Siswa Aktif', value: '150+', icon: Users, color: 'bg-emerald-500' },
 { label: 'Guru Berpengalaman', value: '15+', icon: Award, color: 'bg-blue-500' },
 { label: 'Tahun Berdiri', value: '10+', icon: Calendar, color: 'bg-amber-500' },
 { label: 'Program Unggulan', value: '8+', icon: Star, color: 'bg-rose-500' },
 ].map((stat, i) => (
 <div key={i} className="text-center group">
 <div className={`w-16 h-16 ${stat.color} text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
 <stat.icon size={32} />
 </div>
 <h3 className="text-4xl font-display font-black text-slate-800 mb-1">{stat.value}</h3>
 <p className="text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Profil & Visi Misi */}
 <section id="profil" className="py-32 px-4 bg-white relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
 <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
 <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#grid)" />
 <defs>
 <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
 <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
 </pattern>
 </defs>
 </svg>
 </div>

 <div className="max-w-7xl mx-auto relative z-10">
 <div className="text-center mb-20">
 <h3 className="text-4xl md:text-5xl font-display font-black text-slate-900 mb-6 tracking-tight">Visi & Misi Kami</h3>
 <div className="w-24 h-2 bg-emerald-500 mx-auto rounded-full shadow-lg shadow-emerald-100"></div>
 </div>
 <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
 <motion.div 
 initial={{ opacity: 0, x: -20 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 className="bg-emerald-50/30 p-12 rounded-[3rem] border border-emerald-100 relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500"
 >
 <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-200/20 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>
 <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-100">
 <Award size={32} />
 </div>
 <h4 className="text-3xl font-display font-black text-emerald-900 mb-6">Visi Sekolah</h4>
 <p className="text-2xl text-emerald-800/80 leading-relaxed font-medium italic relative z-10 font-display">
 "Terwujudnya insan akademis yang beriman, terampil, ceria, kreatif, dan mandiri."
 </p>
 </motion.div>

 <motion.div 
 initial={{ opacity: 0, x: 20 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 className="bg-slate-50/50 p-12 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500"
 >
 <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-100">
 <CheckCircle size={32} />
 </div>
 <h4 className="text-3xl font-display font-black text-slate-900 mb-8 tracking-tight">Misi Utama</h4>
 <ul className="space-y-6">
 {[
 "Menanamkan nilai-nilai keimanan dan ketaqwaan sejak dini.",
 "Mengembangkan potensi anak melalui kegiatan yang menyenangkan.",
 "Membentuk karakter anak yang mandiri dan kreatif."
 ].map((misi, i) => (
 <li key={i} className="flex gap-5 group/item">
 <div className="bg-emerald-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 mt-1 shadow-md shadow-emerald-100 group-hover/item:scale-110 transition-transform">
 {i+1}
 </div>
 <span className="text-lg text-slate-600 font-medium leading-relaxed group-hover/item:text-slate-900 transition-colors">
 {misi}
 </span>
 </li>
 ))}
 </ul>
 </motion.div>
 </div>
 </div>
 </section>

 {/* Program Unggulan */}
 <section id="program" className="py-32 px-4 bg-slate-900 text-white overflow-hidden relative">
 <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
 <div className="absolute -top-24 -left-24 w-96 h-96 border-[40px] border-emerald-500 rounded-full" />
 <div className="absolute -bottom-24 -right-24 w-96 h-96 border-[40px] border-blue-500 rounded-full opacity-50" />
 </div>
 <div className="max-w-7xl mx-auto relative z-10">
 <div className="text-center mb-20">
 <h3 className="text-4xl md:text-5xl font-display font-black mb-6 tracking-tight">Keunggulan Kurikulum</h3>
 <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto">Standar pendidikan terbaik untuk membangun karakter Islami sejak usia dini.</p>
 </div>
 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
 {[
 { icon: <BookOpen size={32} />, title: "Kurikulum Terpadu", desc: "Integrasi pendidikan nasional dengan nilai-nilai agama Islam yang mendalam.", color: 'bg-emerald-500' },
 { icon: <Heart size={32} />, title: "Karakter Mulia", desc: "Fokus pada pembentukan akhlakul karimah dan karakter Islami yang kuat.", color: 'bg-rose-500' },
 { icon: <Users size={32} />, title: "Hafalan Qur'an", desc: "Pembiasaan hafalan surat pendek, doa harian, dan praktik ibadah sejak dini.", color: 'bg-blue-500' },
 { icon: <Shield size={32} />, title: "Fasilitas Modern", desc: "Kelas nyaman ber-AC dengan pemantauan CCTV untuk keamanan maksimal.", color: 'bg-amber-500' }
 ].map((item, i) => (
 <motion.div 
 key={i} 
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5, delay: i * 0.1 }}
 className="bg-white/5 backdrop-blur-lg p-10 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-all group"
 >
 <div className={`w-16 h-16 ${item.color} text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform group-hover:rotate-6`}>
 {item.icon}
 </div>
 <h5 className="text-2xl font-display font-black mb-4 tracking-tight group-hover:text-emerald-400 transition-colors">{item.title}</h5>
 <p className="text-slate-400 text-sm leading-relaxed font-medium">{item.desc}</p>
 </motion.div>
 ))}
 </div>
 </div>
 </section>

 {/* Galeri Kegiatan */}
 <section id="galeri" className="py-32 px-4 bg-white">
 <div className="max-w-7xl mx-auto">
 <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
 <div className="text-left">
 <h3 className="text-4xl md:text-5xl font-display font-black text-slate-900 mb-6 tracking-tight">Momen Berharga</h3>
 <div className="w-24 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-100"></div>
 </div>
 <p className="text-slate-500 text-lg font-medium max-w-md">Dokumentasi kegiatan belajar, bermain, dan kreativitas santri RA Darusyifa.</p>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
 {galleryImages.map((img, i) => (
 <motion.div 
 key={i} 
 initial={{ opacity: 0, scale: 0.95 }}
 whileInView={{ opacity: 1, scale: 1 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.1 }}
 className="group relative overflow-hidden rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all aspect-[4/3] cursor-pointer"
 >
 <img 
 src={img} 
 alt={`Kegiatan RA Darusyifa Arjawinangun ${i + 1}`} 
 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
 referrerPolicy="no-referrer"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
 <div className="text-white">
 <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Kegiatan Siswa</p>
 <p className="text-xl font-display font-bold">RA Darusyifa Arjawinangun</p>
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 </section>

 {/* Footer */}
 <footer className="bg-slate-50 border-t border-slate-200 text-slate-800 py-24 px-4 relative overflow-hidden">
 <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-16 relative z-10">
 <div className="space-y-8">
 <div className="flex items-center gap-4">
 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 border-2 border-emerald-600/10 shadow-sm">
 <img 
 src={logoUrl} 
 alt="Logo RA Darusyifa Arjawinangun" 
 className="w-full h-full object-contain"
 onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=RA+Darusyifa&background=16a34a&color=fff'; }}
 referrerPolicy="no-referrer"
 />
 </div>
 <div>
 <h4 className="text-xl font-display font-black text-emerald-900 tracking-tight leading-none">{schoolName}</h4>
 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Portal Digital</p>
 </div>
 </div>
 <p className="text-slate-500 text-base font-medium leading-relaxed">
 Membangun generasi cerdas, berakhlak mulia, dan berwawasan islami melalui pendidikan anak usia dini yang berkualitas dan menyenangkan.
 </p>
 <div className="space-y-4">
 <div className="flex items-start gap-4 group">
 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
 <MapPin size={20} />
 </div>
 <span className="text-sm font-bold text-slate-600 leading-relaxed mt-2">{address}</span>
 </div>
 <div className="flex items-center gap-4 group">
 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
 <MessageCircle size={20} />
 </div>
 <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-sm font-black text-slate-800 hover:text-emerald-600 transition-colors">{whatsappNumber}</a>
 </div>
 </div>
 </div>

 <div>
 <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Tautan Penting</h4>
 <ul className="space-y-5">
 {['Beranda', 'Profil Sekolah', 'Program Kurikulum', 'Galeri Kegiatan'].map((item) => (
 <li key={item}>
 <a href={`#${item.split(' ')[0].toLowerCase()}`} className="text-base font-bold text-slate-600 hover:text-emerald-600 transition-colors flex items-center gap-3 group">
 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
 {item}
 </a>
 </li>
 ))}
 <li>
 <a href="https://share.google/fSo0QoTWvc8t6csYc" target="_blank" rel="noopener noreferrer" className="text-base font-bold text-slate-600 hover:text-emerald-600 transition-colors flex items-center gap-3 group">
 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
 Lokasi Maps
 </a>
 </li>
 </ul>
 </div>

 <div className="space-y-10">
 <div>
 <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Ikuti Kami</h4>
 <div className="flex gap-4">
 {[
 { name: 'FB', link: 'https://web.facebook.com/radarusyifa.arjawinangun.5?_rdc=1&_rdr#' },
 { name: 'IG', link: 'https://www.instagram.com/ra.darusyifa.arjawinangun/' },
 { name: 'TK', link: 'https://www.tiktok.com/@ra.darusyifaarjawinangun' }
 ].map((social) => (
 <a 
 key={social.name}
 href={social.link} 
 target="_blank" 
 rel="noopener noreferrer" 
 className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-sm font-black text-slate-400 hover:bg-emerald-600 hover:text-white hover:shadow-xl hover:shadow-emerald-100 transition-all border border-slate-200"
 >
 {social.name}
 </a>
 ))}
 </div>
 </div>
 <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 group">
 <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Butuh Bantuan?</p>
 <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex w-full bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 items-center justify-center gap-3 active:scale-95">
 <MessageCircle size={20} />
 <span>Chat WhatsApp</span>
 </a>
 </div>
 </div>
 </div>
 <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
 &copy; 2024 RA Darusyifa Arjawinangun. Built with Excellence.
 </p>
 <div className="flex gap-8">
 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Privacy Policy</span>
 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Terms of Service</span>
 </div>
 </div>
 </footer>
 </div>
 );
}
