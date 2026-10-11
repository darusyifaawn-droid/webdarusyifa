/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VirtualOffice3DBuilding.tsx
 * Real 3D Isometric Cutaway Campus Viewer for RA Darusyifa Virtual Office.
 * Features 8 specialized rooms, realistic walking character avatars with live paths,
 * dynamic activity speech bubbles, zoom/pan controls, and 2D CAD architectural plan.
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  RoomEntity, 
  AgentEntity 
} from './VirtualOfficeRepository';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Compass, 
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Users,
  ShieldCheck,
  BookOpen,
  DollarSign,
  Megaphone,
  Archive,
  Bot,
  MapPin,
  ChevronRight,
  Play,
  Pause,
  Activity,
  HeartHandshake,
  Volume2,
  X
} from 'lucide-react';

interface VirtualOffice3DBuildingProps {
  rooms: RoomEntity[];
  agents: AgentEntity[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onEnterRoomModule: (roomId: string) => void;
}

interface RoomHotspot {
  id: string;
  name: string;
  floor: string;
  subText: string;
  leftPercent: number; // percentage of image width
  topPercent: number;  // percentage of image height
  color: string;
  iconName: string;
}

const ROOM_HOTSPOTS: RoomHotspot[] = [
  {
    id: 'room_komando',
    name: 'Ruang Admin & Operator',
    floor: 'Lantai 2 (Sayap Kiri)',
    subText: 'Online • 2 Agen',
    leftPercent: 27.5,
    topPercent: 39.5,
    color: '#0F9E66',
    iconName: 'ShieldCheck'
  },
  {
    id: 'room_guru',
    name: 'Ruang Guru',
    floor: 'Lantai 1 (Sayap Kiri)',
    subText: 'Online • 4 Agen',
    leftPercent: 24.5,
    topPercent: 63.5,
    color: '#2563EB',
    iconName: 'Users'
  },
  {
    id: 'room_pengumuman',
    name: 'Studio Pengumuman',
    floor: 'Lantai 2 (Tengah)',
    subText: 'Online • 2 Agen',
    leftPercent: 54.5,
    topPercent: 33.5,
    color: '#9333EA',
    iconName: 'Megaphone'
  },
  {
    id: 'room_siswa',
    name: 'Area Siswa & Absensi',
    floor: 'Lantai 1 (Tengah)',
    subText: 'Online • 42 Siswa',
    leftPercent: 54.0,
    topPercent: 65.5,
    color: '#0D9488',
    iconName: 'Users'
  },
  {
    id: 'room_bendahara',
    name: 'Ruang Bendahara',
    floor: 'Lantai 2 (Sayap Kanan)',
    subText: 'Online • 2 Agen',
    leftPercent: 70.0,
    topPercent: 39.5,
    color: '#D97706',
    iconName: 'DollarSign'
  },
  {
    id: 'room_arsip',
    name: 'Ruang Arsip & Dokumen',
    floor: 'Lantai 2 (Sudut Kanan)',
    subText: 'Online • 2 Agen',
    leftPercent: 83.5,
    topPercent: 41.5,
    color: '#E11D48',
    iconName: 'Archive'
  },
  {
    id: 'room_hafalan',
    name: 'Ruang Hafalan (Tahfidz)',
    floor: 'Lantai 1 (Sayap Kanan)',
    subText: 'Online • 2 Guru Tahfidz',
    leftPercent: 77.0,
    topPercent: 72.5,
    color: '#10B981',
    iconName: 'BookOpen'
  },
  {
    id: 'room_ai',
    name: 'Ruang AI Assistant',
    floor: 'Pusat Server & Otomasi',
    subText: 'Online • 5 AI Agents',
    leftPercent: 44.0,
    topPercent: 17.0,
    color: '#0284C7',
    iconName: 'Bot'
  }
];

// Interactive walking characters on campus
interface WalkingCharacter {
  id: string;
  name: string;
  role: string;
  avatarBg: string;
  avatarText: string;
  avatarIcon: string;
  animationClass: string;
  speech: string;
  actionDetails: string;
  linkedRoomId: string;
  bubbleColor: string;
}

const WALKING_CHARACTERS: WalkingCharacter[] = [
  {
    id: 'char_ustadzah',
    name: 'Ustadzah Syarifah',
    role: 'Guru Tahfidz & Wali Kelas',
    avatarBg: 'bg-emerald-600',
    avatarText: '🧕',
    avatarIcon: 'BookOpen',
    animationClass: 'animate-walk-ustadzah',
    speech: 'Menuju Ruang Hafalan untuk munaqasyah Al-Humazah 📖',
    actionDetails: 'Membawa mushaf dan lembar penilaian tajwid santri kelompok A',
    linkedRoomId: 'room_hafalan',
    bubbleColor: 'border-emerald-300 text-emerald-900 bg-white/95'
  },
  {
    id: 'char_admin',
    name: 'M. Nugi Andri, S.H',
    role: 'Operator & Tata Usaha',
    avatarBg: 'bg-blue-600',
    avatarText: '👨‍💼',
    avatarIcon: 'ShieldCheck',
    animationClass: 'animate-walk-admin',
    speech: 'Mengantar berkas EMIS 4.0 ke Ruang Arsip 📂',
    actionDetails: 'Membawa dokumen NIK santri baru untuk sinkronisasi Kemenag',
    linkedRoomId: 'room_arsip',
    bubbleColor: 'border-blue-300 text-blue-900 bg-white/95'
  },
  {
    id: 'char_bendahara',
    name: 'Dewi Sartika, S.E',
    role: 'Bendahara Madrasah',
    avatarBg: 'bg-amber-600',
    avatarText: '👩‍💼',
    avatarIcon: 'DollarSign',
    animationClass: 'animate-walk-bendahara',
    speech: 'Rekapitulasi mutasi kas masuk SPP Oktober 💳',
    actionDetails: 'Verifikasi slip bukti transfer bank santri di loket administrasi',
    linkedRoomId: 'room_bendahara',
    bubbleColor: 'border-amber-300 text-amber-900 bg-white/95'
  },
  {
    id: 'char_santri',
    name: 'Santri Ahmad & Fatimah',
    role: 'Santri RA Kelompok A',
    avatarBg: 'bg-teal-600',
    avatarText: '🧒',
    avatarIcon: 'Users',
    animationClass: 'animate-walk-santri',
    speech: 'Assalamu\'alaikum! Berbaris masuk ruang kelas 🎒',
    actionDetails: 'Santri ceria memasuki area belajar untuk kegiatan doa & tilawah pagi',
    linkedRoomId: 'room_siswa',
    bubbleColor: 'border-teal-300 text-teal-900 bg-white/95'
  },
  {
    id: 'char_ai_drone',
    name: 'AI Agent Assistant',
    role: 'Automated School Engine',
    avatarBg: 'bg-sky-500',
    avatarText: '🤖',
    avatarIcon: 'Bot',
    animationClass: 'animate-hover-ai-drone',
    speech: 'Sinkronisasi data presensi & tagihan real-time ⚡',
    actionDetails: 'Memantau integritas database seluruh ruangan dan menyiapkan notifikasi',
    linkedRoomId: 'room_ai',
    bubbleColor: 'border-sky-300 text-sky-900 bg-white/95'
  }
];

export function VirtualOffice3DBuilding({
  rooms,
  agents,
  selectedRoomId,
  onSelectRoom,
  onEnterRoomModule
}: VirtualOffice3DBuildingProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport navigation states
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  // Live walking activities simulation states
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [activeSpeechIdx, setActiveSpeechIdx] = useState<number>(0);
  const [clickedCharacter, setClickedCharacter] = useState<WalkingCharacter | null>(null);

  // Rotate speech bubbles dynamically every 4 seconds to make the campus feel bustling
  useEffect(() => {
    if (!isLiveActive) return;
    const interval = setInterval(() => {
      setActiveSpeechIdx(prev => (prev + 1) % WALKING_CHARACTERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isLiveActive]);

  const handleZoomIn = () => setZoom(z => Math.min(1.8, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom(z => Math.max(0.7, +(z - 0.15).toFixed(2)));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setHoveredRoomId(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with left click
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.06 : 0.06;
    setZoom(z => Math.max(0.7, Math.min(1.8, +(z + delta).toFixed(2))));
  };

  // Helper for room icons
  const getRoomIcon = (id: string) => {
    switch (id) {
      case 'room_komando': return <ShieldCheck size={14} className="text-emerald-600" />;
      case 'room_guru': return <Users size={14} className="text-blue-600" />;
      case 'room_pengumuman': return <Megaphone size={14} className="text-purple-600" />;
      case 'room_siswa': return <Users size={14} className="text-teal-600" />;
      case 'room_bendahara': return <DollarSign size={14} className="text-amber-600" />;
      case 'room_arsip': return <Archive size={14} className="text-rose-600" />;
      case 'room_hafalan': return <BookOpen size={14} className="text-emerald-600" />;
      case 'room_ai': return <Bot size={14} className="text-sky-600" />;
      default: return <MapPin size={14} className="text-emerald-600" />;
    }
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  return (
    <div className="relative w-full h-[540px] md:h-[600px] lg:h-[650px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 shadow-md select-none">
      {/* CSS Injected Keyframes for realistic walking paths and isometric bobs */}
      <style>{`
        @keyframes walkUstadzah {
          0%   { left: 23%; top: 67%; transform: scaleX(1); }
          45%  { left: 74%; top: 73%; transform: scaleX(1); }
          50%  { left: 74%; top: 73%; transform: scaleX(-1); }
          95%  { left: 23%; top: 67%; transform: scaleX(-1); }
          100% { left: 23%; top: 67%; transform: scaleX(1); }
        }
        @keyframes walkAdmin {
          0%   { left: 28%; top: 43%; transform: scaleX(1); }
          45%  { left: 79%; top: 44%; transform: scaleX(1); }
          50%  { left: 79%; top: 44%; transform: scaleX(-1); }
          95%  { left: 28%; top: 43%; transform: scaleX(-1); }
          100% { left: 28%; top: 43%; transform: scaleX(1); }
        }
        @keyframes walkBendahara {
          0%   { left: 71%; top: 43%; transform: scaleX(-1); }
          45%  { left: 34%; top: 42%; transform: scaleX(-1); }
          50%  { left: 34%; top: 42%; transform: scaleX(1); }
          95%  { left: 71%; top: 43%; transform: scaleX(1); }
          100% { left: 71%; top: 43%; transform: scaleX(-1); }
        }
        @keyframes walkSantri {
          0%   { left: 36%; top: 88%; transform: scaleX(1); }
          40%  { left: 56%; top: 84%; transform: scaleX(1); }
          50%  { left: 53%; top: 69%; transform: scaleX(1); }
          55%  { left: 53%; top: 69%; transform: scaleX(-1); }
          90%  { left: 36%; top: 88%; transform: scaleX(-1); }
          100% { left: 36%; top: 88%; transform: scaleX(1); }
        }
        @keyframes hoverAIDrone {
          0%   { left: 44%; top: 18%; }
          25%  { left: 69%; top: 32%; }
          50%  { left: 53%; top: 48%; }
          75%  { left: 29%; top: 32%; }
          100% { left: 44%; top: 18%; }
        }
        @keyframes avatarFootsteps {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25%  { transform: translateY(-3px) rotate(2deg); }
          50%  { transform: translateY(0px) rotate(0deg); }
          75%  { transform: translateY(-3px) rotate(-2deg); }
        }

        .animate-walk-ustadzah {
          animation: walkUstadzah 24s ease-in-out infinite;
        }
        .animate-walk-admin {
          animation: walkAdmin 20s ease-in-out infinite;
        }
        .animate-walk-bendahara {
          animation: walkBendahara 22s ease-in-out infinite;
        }
        .animate-walk-santri {
          animation: walkSantri 18s ease-in-out infinite;
        }
        .animate-hover-ai-drone {
          animation: hoverAIDrone 16s ease-in-out infinite;
        }
        .animate-footstep {
          animation: avatarFootsteps 0.6s ease-in-out infinite;
        }
        .animate-drone-bob {
          animation: avatarFootsteps 2s ease-in-out infinite;
        }
      `}</style>

      {/* 1. TOP CONTROLS TOOLBAR */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: View Mode Toggle & Live Activity Toggle */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setViewMode('3D')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === '3D'
                ? 'bg-[#0F9E66] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers size={13} />
            <span>Mode 3D Nyata</span>
          </button>
          <button
            onClick={() => setViewMode('2D')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === '2D'
                ? 'bg-[#0F9E66] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Compass size={13} />
            <span>Mode Denah 2D</span>
          </button>

          {/* Live Animation Toggle Button */}
          {viewMode === '3D' && (
            <button
              onClick={() => setIsLiveActive(prev => !prev)}
              className={`ml-1 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isLiveActive 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title={isLiveActive ? "Jeda aktivitas bergerak" : "Jalankan aktivitas bergerak"}
            >
              {isLiveActive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Pause size={11} className="text-emerald-700" />
                  <span className="hidden sm:inline">Aktivitas Hidup</span>
                </>
              ) : (
                <>
                  <Play size={11} className="text-slate-600" />
                  <span className="hidden sm:inline">Jalankan Simulasi</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Right: Zoom & Reset Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Perbesar Tampilan"
          >
            <ZoomIn size={16} />
          </button>
          <span className="text-[11px] font-mono text-slate-500 px-1 font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Perkecil Tampilan"
          >
            <ZoomOut size={16} />
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <button
            onClick={handleResetView}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold px-2"
            title="Reset Posisi & Sudut Pandang"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN INTERACTIVE VIEWPORT */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#090D16]"
      >
        {/* Subtle architectural isometric grid pattern */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(15, 158, 102, 0.25) 0%, transparent 70%),
              linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 32px 32px, 32px 32px'
          }}
        />

        {/* Scalable Transform Canvas wrapper */}
        <div
          className="relative transition-transform duration-75 ease-out select-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          {viewMode === '3D' ? (
            /* ====================================================
               A. REAL 3D ISOMETRIC BUILDING CUTAWAY + WALKING CHARACTERS
               ==================================================== */
            <div className="relative w-[1000px] md:w-[1140px] lg:w-[1240px] max-w-none">
              {/* High-Resolution 3D Isometric Cutaway Building Render */}
              <img
                src="/virtual_office_3d.png"
                alt="3D Isometric RA Darusyifa School Building"
                className="w-full h-auto object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.65)] pointer-events-none"
                draggable={false}
              />

              {/* Real-time ambient room status indicators */}
              {/* 1. Studio Pengumuman On-Air Badge */}
              <div 
                style={{ left: '55%', top: '25.5%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-25 pointer-events-none"
              >
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600/90 text-white text-[9.5px] font-black uppercase tracking-wider shadow-md animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>ON AIR</span>
                </div>
              </div>

              {/* 2. Tahfidz Hafalan Active Aura */}
              <div 
                style={{ left: '76.5%', top: '65%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-25 pointer-events-none"
              >
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-700/85 text-emerald-100 text-[9.5px] font-bold shadow-md">
                  <span>📖 Munaqasyah</span>
                </div>
              </div>

              {/* 3. Server AI Cyber Indicator */}
              <div 
                style={{ left: '44%', top: '10%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-25 pointer-events-none"
              >
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-500/30 text-[9px] font-mono shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                  <span>SYNC ONLINE</span>
                </div>
              </div>

              {/* ========================================================
                  ANIMATED WALKING CHARACTERS (AVATAR BERJALAN & DINAMIS)
                  ======================================================== */}
              {isLiveActive && WALKING_CHARACTERS.map((char, index) => {
                const isSpeechActive = activeSpeechIdx === index;
                const isHovered = clickedCharacter?.id === char.id;

                return (
                  <div
                    key={char.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setClickedCharacter(char);
                    }}
                    className={`
                      absolute z-35 cursor-pointer -translate-x-1/2 -translate-y-1/2
                      transition-opacity duration-300 group
                      ${char.animationClass}
                    `}
                    title={`${char.name} (${char.role}) - Klik untuk periksa aktivitas`}
                  >
                    {/* Shadow on floor beneath character */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-2.5 bg-black/40 rounded-full blur-[2px] pointer-events-none" />

                    {/* Animated walking figure body with feet bob */}
                    <div className={`relative flex flex-col items-center select-none ${char.id === 'char_ai_drone' ? 'animate-drone-bob' : 'animate-footstep'}`}>
                      {/* Character Avatar Pin */}
                      <div className={`
                        w-8 h-8 rounded-full ${char.avatarBg} text-white flex items-center justify-center text-sm
                        shadow-md border-2 border-white ring-2 ring-black/10 transition-transform group-hover:scale-125
                      `}>
                        <span>{char.avatarText}</span>
                      </div>

                      {/* Directional foot indicator */}
                      <div className="w-1.5 h-1 bg-white/70 rounded-full mt-0.5" />
                    </div>

                    {/* Floating Speech / Action Bubble (Tampil Bergantian atau saat Hover) */}
                    <div className={`
                      absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-2xl
                      shadow-xl border pointer-events-none transition-all duration-300 whitespace-nowrap z-50
                      ${char.bubbleColor}
                      ${isSpeechActive || isHovered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-1 pointer-events-none'}
                    `}>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-extrabold text-slate-900">{char.name}:</span>
                        <span className="text-[10.5px] font-semibold text-slate-700">{char.speech}</span>
                      </div>
                      {/* Speech bubble beak */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white" />
                    </div>
                  </div>
                );
              })}

              {/* ========================================================
                  FLOATING ROOM PILL BADGES (8 RUANGAN)
                  ======================================================== */}
              {ROOM_HOTSPOTS.map((hotspot) => {
                const isSelected = selectedRoomId === hotspot.id;
                const isHovered = hoveredRoomId === hotspot.id;
                const roomData = rooms.find(r => r.id === hotspot.id);
                const assignedCount = roomData?.assignedAgentIds?.length || 1;

                return (
                  <div
                    key={hotspot.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRoom(hotspot.id);
                    }}
                    onMouseEnter={() => setHoveredRoomId(hotspot.id)}
                    onMouseLeave={() => setHoveredRoomId(null)}
                    style={{
                      left: `${hotspot.leftPercent}%`,
                      top: `${hotspot.topPercent}%`
                    }}
                    className={`
                      absolute -translate-x-1/2 -translate-y-1/2 z-30
                      transition-all duration-200 cursor-pointer
                      ${isSelected ? 'scale-110 z-40' : isHovered ? 'scale-105 z-35' : 'scale-100'}
                    `}
                  >
                    {/* Glowing highlight indicator under pill */}
                    {isSelected && (
                      <span className="absolute inset-0 -m-1.5 rounded-2xl bg-emerald-400/40 blur-md animate-pulse" />
                    )}

                    {/* Floating Pill Badge */}
                    <div className={`
                      relative flex flex-col items-center justify-center
                      px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md
                      border transition-all shadow-lg
                      ${isSelected 
                        ? 'border-emerald-500 ring-4 ring-emerald-500/25 shadow-emerald-500/20' 
                        : isHovered 
                        ? 'border-emerald-400 shadow-md' 
                        : 'border-slate-200/90 hover:border-emerald-300'
                      }
                    `}>
                      {/* Top badge row: Icon + Name */}
                      <div className="flex items-center gap-1.5">
                        {getRoomIcon(hotspot.id)}
                        <span className="text-xs md:text-[13px] font-black text-slate-900 tracking-tight whitespace-nowrap">
                          {hotspot.name}
                        </span>
                      </div>

                      {/* Online Status + Floor/Agent count */}
                      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-500 whitespace-nowrap mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs animate-pulse" />
                        <span className="text-emerald-700 font-bold">Online</span>
                        <span className="text-slate-300">•</span>
                        <span>{assignedCount} Agen</span>
                      </div>
                    </div>

                    {/* Hover tooltip */}
                    {isHovered && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-3 py-1 rounded-xl bg-slate-900/95 text-white text-[10px] font-bold whitespace-nowrap pointer-events-none shadow-xl border border-slate-800 z-50">
                        {hotspot.floor} — Klik untuk periksa ruangan
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ====================================================
               B. 2D ARCHITECTURAL CAD DENAH FLOOR PLAN
               ==================================================== */
            <div className="w-[920px] bg-slate-900/95 rounded-3xl border border-slate-700 p-7 shadow-2xl backdrop-blur-lg flex flex-col gap-6 text-white">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Denah Tata Ruang Arsitektur RA Darusyifa Arjawinangun
                  </h3>
                  <p className="text-xs text-slate-400">Peta Zonasi Ruang Kerja Guru, Santri, dan Tata Usaha</p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  CAD-2D BLUEPRINT
                </span>
              </div>

              {/* Lantai 2 Group */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[11px] font-bold">
                    LANTAI 2
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Zonasi Administrasi, Studio & Manajemen</span>
                </div>
                <div className="grid grid-cols-4 gap-3.5">
                  {ROOM_HOTSPOTS.filter(h => h.floor.includes('Lantai 2') || h.id === 'room_ai').map((hotspot) => {
                    const isSelected = selectedRoomId === hotspot.id;
                    return (
                      <div
                        key={hotspot.id}
                        onClick={() => onSelectRoom(hotspot.id)}
                        className={`
                          p-4 rounded-2xl border-2 transition-all cursor-pointer text-left
                          ${isSelected 
                            ? 'border-emerald-500 bg-emerald-950/40 shadow-lg' 
                            : 'border-slate-800 bg-slate-800/60 hover:border-emerald-500/50 hover:bg-slate-800'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            {getRoomIcon(hotspot.id)}
                            <span className="text-xs font-extrabold text-white">{hotspot.name}</span>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                        <p className="text-[11px] text-emerald-400 font-semibold mb-2">{hotspot.subText}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{hotspot.floor}</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                            Buka <ChevronRight size={10} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lantai 1 Group */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                    LANTAI 1
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Zonasi Belajar, Tahfidz Al-Qur'an & Dewan Guru</span>
                </div>
                <div className="grid grid-cols-3 gap-3.5">
                  {ROOM_HOTSPOTS.filter(h => h.floor.includes('Lantai 1')).map((hotspot) => {
                    const isSelected = selectedRoomId === hotspot.id;
                    return (
                      <div
                        key={hotspot.id}
                        onClick={() => onSelectRoom(hotspot.id)}
                        className={`
                          p-4 rounded-2xl border-2 transition-all cursor-pointer text-left
                          ${isSelected 
                            ? 'border-emerald-500 bg-emerald-950/40 shadow-lg' 
                            : 'border-slate-800 bg-slate-800/60 hover:border-emerald-500/50 hover:bg-slate-800'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            {getRoomIcon(hotspot.id)}
                            <span className="text-xs font-extrabold text-white">{hotspot.name}</span>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                        <p className="text-[11px] text-emerald-400 font-semibold mb-2">{hotspot.subText}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{hotspot.floor}</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                            Buka <ChevronRight size={10} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Pintu Masuk Utama: Gerbang Kampus RA Darusyifa Arjawinangun</span>
                <span>8 Ruangan Aktif Terkoneksi Sistem</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popover Detail Modal Saat Karakter Berjalan Diklik */}
      {clickedCharacter && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-white/98 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-full ${clickedCharacter.avatarBg} text-white flex items-center justify-center text-base shadow-xs`}>
                {clickedCharacter.avatarText}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 leading-tight">
                  {clickedCharacter.name}
                </h4>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  {clickedCharacter.role}
                </p>
              </div>
            </div>
            <button
              onClick={() => setClickedCharacter(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
            >
              <X size={14} />
            </button>
          </div>

          <div className="py-2.5 space-y-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Aktivitas Saat Ini:
              </span>
              <p className="text-xs font-semibold text-slate-800 bg-slate-50 p-2 rounded-xl border border-slate-100">
                {clickedCharacter.speech}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {clickedCharacter.actionDetails}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                onSelectRoom(clickedCharacter.linkedRoomId);
                setClickedCharacter(null);
              }}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Ruang Tugas</span>
              <ChevronRight size={13} />
            </button>
            <button
              onClick={() => setClickedCharacter(null)}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Selected Room Floating Action Pill (Pojok Kanan Bawah Sederhana & Bersih) */}
      {selectedRoom && (
        <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-200 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs animate-pulse" />
            <span className="text-xs font-extrabold text-slate-900 max-w-[150px] truncate">
              {selectedRoom.name}
            </span>
            <button
              onClick={() => onEnterRoomModule(selectedRoom.id)}
              className="px-3 py-1 bg-[#0F9E66] hover:bg-[#0c8a58] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <span>Buka Modul</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
