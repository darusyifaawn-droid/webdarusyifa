import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Users, BookOpen, Home, Award, Calendar, MessageCircle, MapPin, Shield, Heart, Menu, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Floating WhatsApp Button */}
      <a 
        href={whatsappLink} 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl z-[100] hover:bg-green-600 transition-all hover:scale-110 flex items-center gap-2"
      >
        <MessageCircle size={24} />
        <span className="hidden sm:inline font-bold">Hubungi Kami</span>
      </a>

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-green-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-green-600">
              <img 
                src={logoUrl} 
                alt="Logo RA Darusyifa" 
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=RA+Darusyifa&background=16a34a&color=fff'; }}
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-xl font-bold text-green-800 hidden sm:block">{schoolName}</h1>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#profil" className="text-gray-600 hover:text-green-600 font-medium transition-colors">Profil</a>
            <a href="#program" className="text-gray-600 hover:text-green-600 font-medium transition-colors">Program</a>
            <a href="#galeri" className="text-gray-600 hover:text-green-600 font-medium transition-colors">Galeri</a>
            <Link to="/login" className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-700 transition-all shadow-lg shadow-green-200">
              Masuk Portal
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-gray-600 hover:text-green-600 transition-colors">
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </nav>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-green-100 p-6 space-y-4 animate-in slide-in-from-top duration-300">
            <a href="#profil" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-gray-700 hover:text-green-600">Profil</a>
            <a href="#program" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-gray-700 hover:text-green-600">Program</a>
            <a href="#galeri" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-gray-700 hover:text-green-600">Galeri</a>
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block w-full bg-green-600 text-white text-center py-3 rounded-xl font-bold shadow-lg shadow-green-200">
              Masuk Portal
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold mb-6">{accreditationText}</span>
            <h2 className="text-5xl lg:text-6xl font-extrabold text-green-900 leading-tight mb-6 whitespace-pre-line">
              {aboutTitle}
            </h2>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed whitespace-pre-line">
              {aboutText}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/login" className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-xl shadow-green-200">
                Masuk Portal Siswa
              </Link>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="bg-white text-green-700 border-2 border-green-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-50 transition-all flex items-center justify-center gap-2">
                <MessageCircle size={20} /> Hubungi WA
              </a>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <img 
              src={heroImageUrl} 
              alt="RA Darusyifa Activities" 
              className="rounded-3xl shadow-2xl relative z-10 border-8 border-white object-cover w-full h-[400px] lg:h-[500px]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Profil & Visi Misi */}
      <section id="profil" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-green-900 mb-4">Visi & Misi Kami</h3>
            <div className="w-20 h-1.5 bg-green-600 mx-auto rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-green-50 p-10 rounded-3xl border border-green-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
              <h4 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
                <Award className="text-green-600" /> Visi
              </h4>
              <p className="text-lg text-gray-700 leading-relaxed italic relative z-10">
                "Terwujudnya insan akademis yang beriman, terampil, ceria, kreatif, dan mandiri."
              </p>
            </div>
            <div className="bg-green-50 p-10 rounded-3xl border border-green-100">
              <h4 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
                <CheckCircle className="text-green-600" /> Misi
              </h4>
              <ul className="space-y-4 text-gray-700">
                {[
                  "Menanamkan nilai-nilai keimanan dan ketaqwaan sejak dini.",
                  "Mengembangkan potensi anak melalui kegiatan yang menyenangkan.",
                  "Membentuk karakter anak yang mandiri dan kreatif."
                ].map((misi, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-1">{i+1}</span>
                    <span>{misi}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Program Unggulan */}
      <section id="program" className="py-24 px-4 bg-green-50 text-gray-900 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 border-4 border-green-600 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 border-4 border-green-600 rounded-full"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4 text-green-900">Program Kurikulum RA</h3>
            <p className="text-green-700">Keunggulan pendidikan yang kami tawarkan untuk masa depan buah hati Anda.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <BookOpen />, title: "Kurikulum RA", desc: "Kurikulum nasional terintegrasi dengan pendidikan agama Islam yang komprehensif." },
              { icon: <Heart />, title: "Karakter Islami", desc: "Pembentukan karakter berdasarkan nilai-nilai Islam dan akhlakul karimah." },
              { icon: <Users />, title: "Pembiasaan Ibadah", desc: "Praktik ibadah harian, doa, dan hafalan surat-surat pendek Al-Qur'an." },
              { icon: <Shield />, title: "Ruang Ber-AC & CCTV", desc: "Kelas nyaman ber-AC dengan sistem CCTV untuk keamanan dan kenyamanan belajar anak." }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-green-100 hover:shadow-xl transition-all group shadow-sm">
                <div className="text-green-600 mb-6 group-hover:scale-110 transition-transform">{item.icon}</div>
                <h5 className="text-xl font-bold mb-3 text-green-800">{item.title}</h5>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galeri Kegiatan */}
      <section id="galeri" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-green-900 mb-4">Galeri Kegiatan</h3>
            <div className="w-20 h-1.5 bg-green-600 mx-auto rounded-full"></div>
            <p className="mt-4 text-gray-600">Momen-momen berharga dalam proses belajar dan bermain di RA Darusyifa.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((img, i) => (
              <div key={i} className="group overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all aspect-video">
                <img 
                  src={img} 
                  alt={`Kegiatan RA Darusyifa ${i + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-green-100 text-gray-800 py-16 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1 border border-green-600">
                <img 
                  src={logoUrl} 
                  alt="Logo RA Darusyifa" 
                  className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=RA+Darusyifa&background=16a34a&color=fff'; }}
                  referrerPolicy="no-referrer"
                />
              </div>
              <h4 className="text-xl font-bold text-green-700">RA Darusyifa Arjawinangun</h4>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Membangun generasi cerdas, berakhlak mulia, dan berwawasan islami melalui pendidikan anak usia dini yang berkualitas.
            </p>
            <div className="space-y-3 text-sm text-gray-500">
              <p className="flex items-start gap-3">
                <MapPin className="text-green-600 shrink-0" size={18} />
                <span>{address}</span>
              </p>
              <p className="flex items-center gap-3">
                <MessageCircle className="text-green-600 shrink-0" size={18} />
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">{whatsappNumber}</a>
              </p>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold text-green-800 mb-6">Tautan Cepat</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><a href="#" className="hover:text-green-600 transition-colors">Beranda</a></li>
              <li><a href="#profil" className="hover:text-green-600 transition-colors">Profil Sekolah</a></li>
              <li><a href="#program" className="hover:text-green-600 transition-colors">Program Kurikulum</a></li>
              <li><a href="#galeri" className="hover:text-green-600 transition-colors">Galeri Kegiatan</a></li>
              <li><a href="https://share.google/fSo0QoTWvc8t6csYc" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors flex items-center gap-2"><MapPin size={14} /> Lokasi Google Maps</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold text-green-800 mb-6">Media Sosial</h4>
            <div className="flex gap-4 mb-8">
              <a href="https://web.facebook.com/radarusyifa.arjawinangun.5?_rdc=1&_rdr#" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 hover:bg-green-600 hover:text-white transition-all cursor-pointer border border-green-200">FB</a>
              <a href="https://www.instagram.com/ra.darusyifa.arjawinangun/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 hover:bg-green-600 hover:text-white transition-all cursor-pointer border border-green-200">IG</a>
              <a href="https://www.tiktok.com/@ra.darusyifaarjawinangun" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 hover:bg-green-600 hover:text-white transition-all cursor-pointer border border-green-200">TK</a>
            </div>
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
              <p className="text-sm font-bold text-green-800 mb-2">Butuh Bantuan?</p>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-block bg-green-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-green-700 transition-all shadow-md shadow-green-100">
                Chat WhatsApp
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-green-100 text-center text-gray-400 text-xs">
          &copy; 2024 RA Darusyifa Arjawinangun. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
