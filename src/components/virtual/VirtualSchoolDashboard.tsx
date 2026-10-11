/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VirtualSchoolDashboard.tsx
 * Modern Interactive 2.5D Isometric Simulation Dashboard for RA Darusyifa Digital Portal.
 * Complies with the Frontend Design Constitution & Zero-Slop principles.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  VirtualSchoolSimulator, 
  SCHOOL_ROOMS, 
  AvatarEntity,
  SimulationEvent 
} from './VirtualSchoolEngine';
import { VirtualSchoolCanvas } from './VirtualSchoolCanvas';
import { 
  Play, 
  Pause, 
  Sparkles, 
  UserCheck, 
  BookOpen, 
  Wallet, 
  Smile, 
  Activity, 
  Layers, 
  Compass, 
  Radio, 
  ArrowLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

export default function VirtualSchoolDashboard() {
  const navigate = useNavigate();
  const simulator = useMemo(() => new VirtualSchoolSimulator(), []);

  const [selectedAvatar, setSelectedAvatar] = useState<AvatarEntity | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string>('classroom_a');
  const [isAutoSimulate, setIsAutoSimulate] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [eventsList, setEventsList] = useState<SimulationEvent[]>([]);
  const [, setTickCounter] = useState<number>(0);

  // Synchronize events and state with simulator
  useEffect(() => {
    setEventsList([...simulator.events]);
    simulator.setOnUpdate(() => {
      setEventsList([...simulator.events]);
      setTickCounter(c => c + 1);
    });
  }, [simulator]);

  // Handle auto simulation toggle
  const toggleAutoSimulate = () => {
    const nextState = !isAutoSimulate;
    setIsAutoSimulate(nextState);
    simulator.autoSimulate = nextState;
  };

  const handleSpeedChange = (spd: number) => {
    setSimSpeed(spd);
    simulator.simSpeed = spd;
  };

  // KPI Computations
  const totalStudents = 28;
  const presentStudents = 24;
  const activeStaff = 4;
  const activeActivitiesCount = eventsList.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. TOP BAR (Complies with Top Bar Contract: 3 Zones, 1 line each) */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-md">
            RA
          </div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            RA Darusyifa · Digital Campus 3D
          </span>
        </div>

        {/* Zone 2: Single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button 
            onClick={() => setActiveRoomId('classroom_a')}
            className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${activeRoomId === 'classroom_a' ? 'text-sky-400' : ''}`}
          >
            Ruang Kelas
          </button>
          <button 
            onClick={() => setActiveRoomId('admin_office')}
            className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${activeRoomId === 'admin_office' ? 'text-emerald-400' : ''}`}
          >
            Tata Usaha
          </button>
          <button 
            onClick={() => setActiveRoomId('library')}
            className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${activeRoomId === 'library' ? 'text-amber-400' : ''}`}
          >
            Pojok Baca
          </button>
          <button 
            onClick={() => setActiveRoomId('playground')}
            className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${activeRoomId === 'playground' ? 'text-teal-400' : ''}`}
          >
            Area Bermain
          </button>
          <button 
            onClick={() => setActiveRoomId('gate')}
            className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${activeRoomId === 'gate' ? 'text-indigo-400' : ''}`}
          >
            Gerbang Presensi
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl transition-all border border-slate-700 whitespace-nowrap cursor-pointer active:scale-95"
          >
            <ArrowLeft size={14} />
            Kembali ke Portal
          </button>
        </div>
      </header>

      {/* 2. LIVE METRICS STRIP (Tabular figures, Clean unboxed metadata) */}
      <section className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-500 font-medium">Siswa Presensi:</span>
              <span className="font-bold text-emerald-400 tabular-nums">{presentStudents} / {totalStudents}</span>
              <span className="text-[10px] text-slate-500">(86% Hadir)</span>
            </div>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-500 font-medium">Guru & Staff:</span>
              <span className="font-bold text-sky-400 tabular-nums">{activeStaff} Aktif</span>
            </div>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-500 font-medium">Aktivitas Hari Ini:</span>
              <span className="font-bold text-amber-400 tabular-nums">{activeActivitiesCount + 124} Log</span>
            </div>
          </div>

          {/* Real-time simulation controller switch */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-800/90 rounded-lg border border-slate-700/60">
              <button
                onClick={() => handleSpeedChange(1)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${simSpeed === 1 ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
              >
                1x
              </button>
              <button
                onClick={() => handleSpeedChange(2)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${simSpeed === 2 ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
              >
                2x
              </button>
              <button
                onClick={() => handleSpeedChange(3)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${simSpeed === 3 ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
              >
                3x
              </button>
            </div>

            <button
              onClick={toggleAutoSimulate}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                isAutoSimulate 
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {isAutoSimulate ? <Pause size={13} /> : <Play size={13} />}
              <span>{isAutoSimulate ? 'Simulasi Otomatis Aktif' : 'Simulasi Dijeda'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. MAIN WORKSPACE: 2-Zone Interactive Sandbox Layout */}
      <main className="flex-1 max-w-[1520px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* LEFT / STAGE ZONE (Canvas + Live Action Triggers, ~8 cols) */}
        <section className="lg:col-span-8 flex flex-col gap-4 min-h-[580px] lg:min-h-0">
          {/* Interactive Isometric Canvas Viewport */}
          <div className="flex-1 min-h-[500px] w-full relative">
            <VirtualSchoolCanvas
              simulator={simulator}
              selectedAvatar={selectedAvatar}
              onSelectAvatar={setSelectedAvatar}
              activeRoomId={activeRoomId}
            />
          </div>

          {/* Real-time Simulation Action Dispatcher Bar */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-sky-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Pemicu Aktivitas Real-Time
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Klik tombol di bawah untuk menggerakkan avatar peran secara langsung
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <button
                onClick={() => simulator.triggerTeacherGradeInput()}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-sky-950/60 hover:bg-sky-900 text-sky-200 border border-sky-800/60 transition-all text-center cursor-pointer group active:scale-95"
              >
                <GraduationCap size={18} className="text-sky-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold leading-tight">Guru Input Nilai</span>
                <span className="text-[9px] text-sky-400/80 mt-0.5">Ustadzah Nurul</span>
              </button>

              <button
                onClick={() => simulator.triggerAttendanceScan()}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 text-indigo-200 border border-indigo-800/60 transition-all text-center cursor-pointer group active:scale-95"
              >
                <UserCheck size={18} className="text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold leading-tight">Presensi QR Siswa</span>
                <span className="text-[9px] text-indigo-400/80 mt-0.5">Gerbang Checkpoint</span>
              </button>

              <button
                onClick={() => simulator.triggerSavingsDeposit()}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900 text-amber-200 border border-amber-800/60 transition-all text-center cursor-pointer group active:scale-95"
              >
                <Wallet size={18} className="text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold leading-tight">Setor Tabungan</span>
                <span className="text-[9px] text-amber-400/80 mt-0.5">Kasir Tata Usaha</span>
              </button>

              <button
                onClick={() => simulator.triggerClassTeaching()}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-900 text-blue-200 border border-blue-800/60 transition-all text-center cursor-pointer group active:scale-95"
              >
                <Sparkles size={18} className="text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold leading-tight">Mulai Belajar</span>
                <span className="text-[9px] text-blue-400/80 mt-0.5">Smartboard Kelas</span>
              </button>

              <button
                onClick={() => simulator.triggerPlaytime()}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-800/60 transition-all text-center cursor-pointer group active:scale-95"
              >
                <Smile size={18} className="text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold leading-tight">Waktu Bermain</span>
                <span className="text-[9px] text-emerald-400/80 mt-0.5">Playzone Perosotan</span>
              </button>

              <button
                onClick={() => simulator.triggerLibraryReading()}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-orange-950/60 hover:bg-orange-900 text-orange-200 border border-orange-800/60 transition-all text-center cursor-pointer group active:scale-95"
              >
                <BookOpen size={18} className="text-orange-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold leading-tight">Pojok Membaca</span>
                <span className="text-[9px] text-orange-400/80 mt-0.5">Perpustakaan Cilik</span>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT / CONTROL & CONCEPT DECK (Inspector + Room Switcher + Live Feed, ~4 cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          {/* 1. Avatar Inspector Card */}
          <div className="p-4 bg-slate-900/95 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Compass size={14} className="text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Inspeksi Avatar Karakter
                </h4>
              </div>
              <span className="text-[10px] text-slate-400">Klik karakter di peta</span>
            </div>

            {selectedAvatar ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-sky-500/50 flex items-center justify-center text-xl shrink-0">
                    {selectedAvatar.role === 'Guru Kelas' && '👩‍🏫'}
                    {selectedAvatar.role === 'Tata Usaha' && '👨‍💼'}
                    {selectedAvatar.role === 'Siswa Hadir' && '🎒'}
                    {selectedAvatar.role === 'Wali Murid' && '🧕'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">{selectedAvatar.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30">
                        {selectedAvatar.role}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        ● {selectedAvatar.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Posisi Grid:</span>
                    <span className="font-mono text-slate-200">X: {selectedAvatar.x.toFixed(1)}, Y: {selectedAvatar.y.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Afiliasi / Kelas:</span>
                    <span className="text-slate-200">{selectedAvatar.stats.classGroup || 'Umum'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Aktivitas:</span>
                    <span className="font-bold text-amber-400">{selectedAvatar.stats.actionsCount} Kali</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Terakhir Aktif:</span>
                    <span className="text-slate-300">{selectedAvatar.stats.lastActive}</span>
                  </div>
                </div>

                {/* Quick actions for selected avatar */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      if (selectedAvatar.role === 'Guru Kelas') simulator.triggerTeacherGradeInput();
                      else if (selectedAvatar.role === 'Tata Usaha') simulator.triggerSavingsDeposit();
                      else simulator.triggerClassTeaching();
                    }}
                    className="flex-1 py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    Tugaskan Aktivitas
                  </button>
                  <button
                    onClick={() => setSelectedAvatar(null)}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-center">
                <p className="text-xs text-slate-400 font-medium">
                  Belum ada karakter yang dipilih
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Arahkan mouse dan klik avatar guru, TU, atau murid di kanvas untuk melihat data real-time mereka.
                </p>
              </div>
            )}
          </div>

          {/* 2. Room Directory Quick Navigation */}
          <div className="p-4 bg-slate-900/95 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-sky-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Navigasi Ruang Sekolah
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {SCHOOL_ROOMS.map(room => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoomId(room.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                    activeRoomId === room.id
                      ? 'bg-sky-950/80 border-sky-500/50 text-white shadow-xs'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: room.color }} 
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold leading-tight truncate">{room.name}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{room.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* 3. Live Simulation Event Feed */}
          <div className="flex-1 p-4 bg-slate-900/95 rounded-2xl border border-slate-800 shadow-md flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Feed Aktivitas Real-Time
                </h4>
              </div>
              <span className="text-[10px] text-slate-500 tabular-nums">
                {eventsList.length} Entri
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px] scrollbar-thin">
              {eventsList.map(evt => (
                <div 
                  key={evt.id}
                  className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-slate-200 truncate">{evt.avatarName}</span>
                    <span className="text-[10px] text-slate-500 tabular-nums shrink-0">{evt.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{evt.actionTitle}</p>
                  <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-900 text-[10px]">
                    <span 
                      className="px-1.5 py-0.5 rounded font-bold"
                      style={{ 
                        backgroundColor: `${evt.badgeColor}22`,
                        color: evt.badgeColor
                      }}
                    >
                      {evt.status}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500 truncate">{evt.roomName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* 4. FOOTER (Quiet copyright and school motto) */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 px-6 py-3 text-center text-xs text-slate-500">
        <p>
          Portal Sekolah Digital RA Darusyifa Arjawinangun &copy; 2024 · Real-time Simulation & Virtual Twin Engine
        </p>
      </footer>
    </div>
  );
}
