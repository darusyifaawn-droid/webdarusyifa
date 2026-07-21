import React from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

export default function KaldikIframe() {
  const kaldikUrl = "https://kaldikradarusyifa.netlify.app/";

  return (
    <div className="flex flex-col h-[80vh] w-full bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 md:p-8 bg-white border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Kalender Pendidikan</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">RA Darusyifa Arjawinangun • Tahun Pelajaran 2024/2025</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => window.location.reload()} 
            className="flex-1 md:flex-none px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-100 hover:bg-slate-100 transition-all"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <a 
            href={kaldikUrl} 
            target="_blank" 
            rel="noreferrer"
            className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
          >
            <ExternalLink size={14} /> Buka Tab Baru
          </a>
        </div>
      </div>
      
      <div className="flex-1 relative bg-slate-50">
        <iframe 
          src={kaldikUrl} 
          className="w-full h-full border-none"
          title="Kalender Pendidikan"
        />
        {/* Simple loader overlay that disappears once iframe loads (ideally) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <p className="font-black text-4xl uppercase tracking-[1rem] text-slate-400 rotate-12">Darusyifa</p>
        </div>
      </div>
    </div>
  );
}
