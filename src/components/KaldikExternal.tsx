import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const KaldikExternal: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar Header */}
      <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-600"
            title="Kembali"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="font-bold text-lg text-gray-800">Kalender Pendidikan</h1>
            <p className="text-xs text-gray-400 font-medium">RA Darusyifa Arjawinangun</p>
          </div>
        </div>
        <a 
          href="https://kaldikradarusyifa.netlify.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100 transition-all border border-green-100"
        >
          <ExternalLink size={14} />
          <span>Buka di Tab Baru</span>
        </a>
      </div>

      {/* Main Iframe Content */}
      <div className="flex-1 w-full relative">
        <iframe 
          src="https://kaldikradarusyifa.netlify.app/" 
          className="absolute inset-0 w-full h-full border-none"
          title="Kalender Pendidikan External"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default KaldikExternal;
