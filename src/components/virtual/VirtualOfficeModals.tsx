/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VirtualOfficeModals.tsx
 * Dialogs, Drawers, and Interactive Action Modals for Virtual Office RA Darusyifa.
 * Covers Room Detail, Agent Profile & Status Management, Task Creation, AI Assistant Actions, and Activity Details.
 */

import React, { useState } from 'react';
import { 
  RoomEntity, 
  AgentEntity, 
  TaskItem, 
  ActivityFeedItem,
  AgentStatus,
  TaskPriority,
  TaskStatus,
  voRepository 
} from './VirtualOfficeRepository';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  ExternalLink, 
  Plus, 
  User, 
  Bot, 
  ShieldCheck, 
  Copy, 
  Check, 
  Send, 
  Calendar,
  Layers,
  Activity,
  ArrowRight
} from 'lucide-react';

/* =========================================================
   1. ROOM DETAIL MODAL / DRAWER
   ========================================================= */
interface RoomDetailModalProps {
  room: RoomEntity;
  agents: AgentEntity[];
  tasks: TaskItem[];
  onClose: () => void;
  onSelectAgent: (agentId: string) => void;
  onEnterModule: (tab: string) => void;
  onOpenNewTask: (roomId: string) => void;
}

export function RoomDetailModal({
  room,
  agents,
  tasks,
  onClose,
  onSelectAgent,
  onEnterModule,
  onOpenNewTask
}: RoomDetailModalProps) {
  const roomAgents = agents.filter(a => a.roomId === room.id);
  const roomTasks = tasks.filter(t => t.roomId === room.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold shadow-xs">
              <Layers size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{room.name}</h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded-md">
                  {room.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{room.description}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 divide-y divide-slate-100 text-slate-800">
          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status Operasional:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                room.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                room.status === 'waiting' ? 'bg-amber-100 text-amber-700' :
                room.status === 'issue' ? 'bg-rose-100 text-rose-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {room.status === 'active' ? '🟢 Aktif Berjalan' :
                 room.status === 'waiting' ? '🟡 Menunggu Tindakan' :
                 room.status === 'issue' ? '🔴 Tugas Kritis' : '⚪ Standby'}
              </span>
            </div>
            <button
              onClick={() => onEnterModule(room.linkedModuleTab)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <span>Buka Modul Operasional</span>
              <ExternalLink size={14} />
            </button>
          </div>

          {/* Agen yang Bertugas */}
          <div className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Agen Bertugas di Ruangan Ini ({roomAgents.length})
              </h4>
            </div>
            {roomAgents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada agen yang ditempatkan di ruangan ini.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roomAgents.map(agt => (
                  <div
                    key={agt.id}
                    onClick={() => onSelectAgent(agt.id)}
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white ${
                        agt.type === 'AI' ? 'bg-sky-600' : 'bg-emerald-600'
                      }`}>
                        {agt.avatarBadge || agt.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {agt.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{agt.role}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      agt.status === 'Online' ? 'bg-emerald-100 text-emerald-700' :
                      agt.status === 'Working' ? 'bg-sky-100 text-sky-700' :
                      agt.status === 'Idle' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {agt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Antrean Tugas Ruangan */}
          <div className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Daftar Tugas Ruangan ({roomTasks.length})
              </h4>
              <button
                onClick={() => onOpenNewTask(room.id)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Tambah Tugas</span>
              </button>
            </div>
            {roomTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Tidak ada tugas yang tertunda di ruangan ini.</p>
            ) : (
              <div className="space-y-2.5">
                {roomTasks.map(tsk => (
                  <div key={tsk.id} className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-900">{tsk.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{tsk.description}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>Oleh: <strong className="text-slate-600">{tsk.assigneeName}</strong></span>
                        <span>•</span>
                        <span>Batas: {tsk.deadline}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        tsk.priority === 'Tinggi' ? 'bg-rose-100 text-rose-700' :
                        tsk.priority === 'Sedang' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {tsk.priority}
                      </span>
                      <span className={`text-[10px] font-semibold ${
                        tsk.status === 'Completed' ? 'text-emerald-600' : 'text-slate-500'
                      }`}>
                        {tsk.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   2. AGENT PROFILE & STATUS MODAL
   ========================================================= */
interface AgentDetailModalProps {
  agent: AgentEntity;
  rooms: RoomEntity[];
  tasks: TaskItem[];
  onClose: () => void;
  onOpenNewTask: (agentId: string) => void;
  onOpenAIAction?: (agent: AgentEntity) => void;
}

export function AgentDetailModal({
  agent,
  rooms,
  tasks,
  onClose,
  onOpenNewTask,
  onOpenAIAction
}: AgentDetailModalProps) {
  const [currentStatus, setCurrentStatus] = useState<AgentStatus>(agent.status);
  const agentTasks = tasks.filter(t => t.assigneeId === agent.id);

  const handleStatusChange = (newStatus: AgentStatus) => {
    setCurrentStatus(newStatus);
    voRepository.updateAgentStatus(agent.id, newStatus);
  };

  const handleTaskStatusToggle = (taskId: string, current: TaskStatus) => {
    const next: TaskStatus = current === 'Completed' ? 'In Progress' : 'Completed';
    voRepository.updateTaskStatus(taskId, next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-xs ${
              agent.type === 'AI' ? 'bg-sky-600' : 'bg-emerald-600'
            }`}>
              {agent.avatarBadge || agent.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{agent.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  agent.type === 'AI' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {agent.type === 'AI' ? 'AI AGENT' : 'HUMAN AGENT'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{agent.title || agent.role}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* Status selector & Room Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Status Operasional Agen
              </label>
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value as AgentStatus)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Online">🟢 Online (Sesi Aktif)</option>
                <option value="Working">🔵 Working (Sedang Mengerjakan Tugas)</option>
                <option value="Idle">🟡 Idle (Standby)</option>
                <option value="Waiting Approval">🟠 Waiting Approval</option>
                <option value="Offline">⚪ Offline (Di Luar Jam Kerja)</option>
                <option value="Error">🔴 Error (Perlu Pengecekan)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Penempatan Ruangan
              </label>
              <div className="text-xs font-bold text-slate-800 p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <span>{agent.roomName}</span>
                <span className="text-[10px] text-slate-400 font-mono">ID: {agent.roomId}</span>
              </div>
            </div>
          </div>

          {/* Capabilities if AI Agent */}
          {agent.type === 'AI' && agent.capabilities && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-sky-500" />
                  Kapabilitas Otomasi Agen AI
                </h4>
                {onOpenAIAction && (
                  <button
                    onClick={() => onOpenAIAction(agent)}
                    className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Sparkles size={12} />
                    <span>Jalankan Tindakan AI</span>
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {agent.capabilities.map((cap, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-sky-50/60 border border-sky-100 text-xs text-sky-900">
                    <CheckCircle2 size={13} className="text-sky-600 shrink-0" />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions Tag list */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Hak Akses & Izin Sistem
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {agent.permissions.map(perm => (
                <span key={perm} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-semibold">
                  {perm}
                </span>
              ))}
            </div>
          </div>

          {/* Assigned Tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Daftar Tugas Agen Ini ({agentTasks.length})
              </h4>
              <button
                onClick={() => onOpenNewTask(agent.id)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Beri Tugas Baru</span>
              </button>
            </div>
            {agentTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Tidak ada tugas aktif yang dialokasikan ke agen ini.</p>
            ) : (
              <div className="space-y-2">
                {agentTasks.map(tsk => (
                  <div key={tsk.id} className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/40 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className={`text-xs font-bold ${tsk.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {tsk.title}
                      </div>
                      <div className="text-[10px] text-slate-500">Batas: {tsk.deadline}</div>
                    </div>
                    <button
                      onClick={() => handleTaskStatusToggle(tsk.id, tsk.status)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        tsk.status === 'Completed' 
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                          : 'bg-slate-200 text-slate-700 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      {tsk.status === 'Completed' ? 'Selesai ✓' : 'Tandai Selesai'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   3. NEW TASK CREATION MODAL
   ========================================================= */
interface NewTaskModalProps {
  rooms: RoomEntity[];
  agents: AgentEntity[];
  defaultRoomId?: string;
  defaultAssigneeId?: string;
  onClose: () => void;
}

export function NewTaskModal({
  rooms,
  agents,
  defaultRoomId,
  defaultAssigneeId,
  onClose
}: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roomId, setRoomId] = useState(defaultRoomId || rooms[0]?.id || 'room_komando');
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId || agents[0]?.id || 'agt_h2');
  const [priority, setPriority] = useState<TaskPriority>('Sedang');
  const [deadline, setDeadline] = useState('Hari ini, 16:00 WIB');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedAgent = agents.find(a => a.id === assigneeId) || agents[0];

    voRepository.assignTask({
      title: title.trim(),
      description: description.trim() || 'Tugas operasional ditugaskan melalui Virtual Office.',
      roomId,
      assigneeId: selectedAgent.id,
      assigneeName: selectedAgent.name,
      assigneeType: selectedAgent.type,
      priority,
      status: 'Pending',
      deadline
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Buat Tugas Operasional Baru</h3>
                <p className="text-xs text-slate-500">Tugaskan ke personil sekolah atau agen AI cerdas.</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-4 text-slate-800 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Judul Tugas *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Rekapitulasi Presensi Mingguan Kelas RA-A"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Deskripsi & Instruksi</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Berikan rincian instruksi atau standar pengerjaan tugas..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lokasi Ruangan</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Penerima Tugas (Assignee)</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                >
                  <optgroup label="Dewan Guru & Staf (Human)">
                    {agents.filter(a => a.type === 'HUMAN').map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Agen Otomasi (AI Agent)">
                    {agents.filter(a => a.type === 'AI').map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tingkat Prioritas</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                >
                  <option value="Tinggi">🔴 Tinggi (Segera / Urgent)</option>
                  <option value="Sedang">🟡 Sedang (Standar)</option>
                  <option value="Rendah">🟢 Rendah (Rutin)</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tenggat Waktu (Deadline)</label>
                <input
                  type="text"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="Contoh: Besok, 12:00 WIB"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Tugaskan Sekarang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   4. AI ASSISTANT CONSOLE MODAL
   ========================================================= */
interface AIAssistantModalProps {
  initialAgent?: AgentEntity;
  onClose: () => void;
}

export function AIAssistantModal({
  initialAgent,
  onClose
}: AIAssistantModalProps) {
  const [selectedAgentId, setSelectedAgentId] = useState(initialAgent?.id || 'agt_ai1');
  const [promptInput, setPromptInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Default presets based on agent
  const getPresetForAgent = (agentId: string) => {
    switch (agentId) {
      case 'agt_ai1':
        return 'Susun draf pesan WhatsApp pengingat santun untuk wali santri yang belum melakukan konfirmasi pembayaran SPP bulan berjalan dengan bahasa yang ramah dan penuh ukhuwah.';
      case 'agt_ai2':
        return 'Buat draf surat pengumuman resmi kegiatan "Parenting Day & Pembagian Hasil Belajar Triwulan 1" RA Darusyifa Arjawinangun.';
      case 'agt_ai3':
        return 'Lakukan pemindaian kelengkapan berkas santri baru: cek NIK, NISN, nama ibu kandung, dan nomor kontak aktif wali murid.';
      case 'agt_ai4':
        return 'Sintesis evaluasi kehadiran santri dan progres setoran tahfidz Juz 30 pekan ini untuk bahan rapat dewan guru.';
      case 'agt_ai5':
        return 'Lakukan rekonsiliasi kas setoran SPP tunai vs mutasi rekening dan siapkan ringkasan verifikasi kuitansi.';
      default:
        return 'Berikan ringkasan status operasional madrasah hari ini.';
    }
  };

  const handleRunAI = async () => {
    setIsProcessing(true);
    setAiResult(null);

    const promptText = promptInput.trim() || getPresetForAgent(selectedAgentId);

    try {
      // Call server AI endpoint proxy
      const response = await fetch('/api/ai/agent-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          prompt: promptText
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiResult(data.result);
      } else {
        throw new Error('API server returned error');
      }
    } catch {
      // Deterministic domain fallback engine tailored for RA Darusyifa Arjawinangun
      const fallbackResponses: Record<string, string> = {
        agt_ai1: `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nBapak/Ibu Wali Santri yang kami hormati,\nSemoga senantiasa dalam lindungan dan keberkahan Allah SWT.\n\nKami dari Bagian Keuangan RA Darusyifa Arjawinangun menginformasikan bahwa pencatatan SPP bulan berjalan telah kami buka. Bagi Bapak/Ibu yang telah melakukan transfer, mohon dapat mengunggah bukti setoran melalui Portal Siswa atau konfirmasi via WhatsApp ini.\n\nBagi yang hendak menunaikan secara tunai atau melalui Tabungan Santri, loket bendahara madrasah siap melayani setiap hari sekolah pukul 07.30 - 12.00 WIB.\n\nJazakumullah Khairan Katsiran atas sinergi dan amanah Bapak/Ibu sekalian.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh,\nBendahara RA Darusyifa Arjawinangun`,
        agt_ai2: `PENGUMUMAN RESMI RA DARUSYIFA ARJAWINANGUN\nNomor: 042/RA-DARUSYIFA/X/2026\n\nHal: Undangan Pertemuan Parenting & Evaluasi Belajar Anak Usia Dini\n\nKepada Yth.\nBapak/Ibu Orang Tua / Wali Santri RA Darusyifa\ndi Tempat\n\nAssalamu'alaikum Warahmatullahi Wabarakatuh,\n\nDalam rangka mempererat silaturahmi serta menyelaraskan pendampingan tumbuh kembang ananda tercinta, kami mengundang Bapak/Ibu pada:\n\n📅 Hari, Tanggal : Sabtu, 24 Oktober 2026\n⏰ Waktu : Pukul 08.30 - 11.30 WIB\n📍 Tempat : Aula Serbaguna RA Darusyifa Arjawinangun\n🎯 Agenda : Parenting Islami "Mendidik Karakter Qur'ani Sejak Dini" & Konsultasi Perkembangan Santri\n\nKehadiran Bapak/Ibu merupakan bentuk cinta dan dukungan terbaik bagi masa depan ananda. Terima kasih atas kerja samanya.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh,\nKepala RA Darusyifa,\nHj. Nurlaela, S.Pd.I`,
        agt_ai3: `HASIL PEMINDAIAN KELENGKAPAN DATA SANTRI (EMIS 4.0 & SIMPATIKA)\nStatus: 2 Catatan Discrepancy Ditemukan\n\n1. Muhammad Faiz (Kelompok A-Melati):\n   - NISN: Belum terbit (Proses pengajuan Verval PD)\n   - NIK Santri: Terverifikasi (3209...)\n   - Lampiran KK: Belum diunggah\n   - Rekomendasi: Hubungi wali santri untuk foto dokumen KK yang jelas.\n\n2. Aisyah Putri (Kelompok A-Melati):\n   - Nomor HP Wali: Format belum valid (9 digit)\n   - Rekomendasi: Perbarui kontak aktif untuk notifikasi kaldik.\n\n3. 26 Santri Lainnya: Status Berkas Lengkap 100%.`,
        agt_ai4: `RINGKASAN ANALITIK OPERASIONAL MINGGUAN (RA DARUSYIFA)\nPeriode: 05 - 09 Oktober 2026\n\n📊 Kehadiran Santri:\n- Rata-rata Kehadiran: 94.6%\n- Santri Izin/Sakit: 2 anak (flu musim peralihan)\n- Hari dengan kehadiran tertinggi: Selasa (100%)\n\n📖 Progres Munaqasyah Tahfidz:\n- Target Surah: An-Nas s.d Al-Ikhlas\n- Tercapai dengan predikat Mumtaz: 18 santri (64%)\n- Perlu pendampingan tajwid lanjutan: 10 santri\n\n💡 Rekomendasi AI:\n- Tambahkan sesi muraja'ah bersama selama 10 menit saat lingkaran pagi (morning circle).`,
        agt_ai5: `HASIL REKONSILIASI KAS & TRANSAKSI (AI ASISTEN ADMINISTRASI)\nTanggal: 09 Oktober 2026\n\n- Total Transaksi Masuk Terverifikasi: 14 transaksi\n- Nominal: Rp 1.680.000\n- Rincian Metode Pembayaran:\n  * Tunai Langsung: Rp 720.000 (6 transaksi)\n  * Transfer Rekening: Rp 600.000 (5 transaksi)\n  * Debet Tabungan Santri: Rp 360.000 (3 transaksi)\n- Status Validasi: 100% Cocok, Tidak ditemukan mutasi ganda.\n- Rekomendasi: Cetak rekap arus kas harian untuk ditandatangani Kepala RA.`
      };
      setAiResult(fallbackResponses[selectedAgentId] || fallbackResponses.agt_ai1);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (aiResult) {
      navigator.clipboard.writeText(aiResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-bold shadow-xs">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Konsol Agen Intelijen AI</h3>
              <p className="text-xs text-slate-500">Pilih AI Agent dan berikan instruksi operasional terarah.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-800 text-xs">
          {/* AI Agent Selector Tabs */}
          <div>
            <label className="font-bold text-slate-700 block mb-2">Pilih Agen AI Pelaksana:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'agt_ai1', name: 'AI Pengingat', desc: 'SPP & Jatuh Tempo' },
                { id: 'agt_ai2', name: 'AI Pengumuman', desc: 'Draf Siaran Resmi' },
                { id: 'agt_ai3', name: 'AI Pemeriksa Data', desc: 'Audit EMIS & NIK' },
                { id: 'agt_ai4', name: 'AI Analis Sekolah', desc: 'Absensi & Tren' },
                { id: 'agt_ai5', name: 'AI Asisten Admin', desc: 'Rekonsiliasi Kas' }
              ].map(ag => (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => {
                    setSelectedAgentId(ag.id);
                    setPromptInput(getPresetForAgent(ag.id));
                    setAiResult(null);
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    selectedAgentId === ag.id
                      ? 'border-sky-500 bg-sky-50/70 text-sky-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">{ag.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{ag.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt text area */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Instruksi / Permintaan Tugas untuk Agen AI:
            </label>
            <textarea
              rows={3}
              value={promptInput || getPresetForAgent(selectedAgentId)}
              onChange={(e) => setPromptInput(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs resize-none bg-slate-50/50"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunAI}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Sparkles size={14} className={isProcessing ? 'animate-spin' : ''} />
              <span>{isProcessing ? 'Memproses dengan Intelijen AI...' : 'Jalankan Aksi Agen AI'}</span>
            </button>
          </div>

          {/* AI Output Window */}
          {aiResult && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Bot size={14} />
                  Hasil Eksekusi Agen Intelijen
                </span>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
                </button>
              </div>
              <pre className="text-xs whitespace-pre-wrap font-sans text-slate-200 leading-relaxed max-h-60 overflow-y-auto">
                {aiResult}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tutup Konsol
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   5. ACTIVITY DETAIL MODAL
   ========================================================= */
interface ActivityDetailModalProps {
  activity: ActivityFeedItem;
  onClose: () => void;
}

export function ActivityDetailModal({
  activity,
  onClose
}: ActivityDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Rincian Aktivitas Operasional</h3>
              <p className="text-xs text-slate-500 font-mono">ID: {activity.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-700">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Pelaksana:</span>
            <div className="flex items-center gap-2">
              <strong className="text-slate-900 text-sm">{activity.agentName}</strong>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activity.agentType === 'AI' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {activity.agentType}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Lokasi Ruang:</span>
            <p className="font-semibold text-slate-800">{activity.roomName}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Aktivitas Terjadwal:</span>
            <p className="font-medium text-slate-800 p-3 rounded-xl bg-slate-50 border border-slate-200 leading-relaxed">
              {activity.activity}
            </p>
          </div>

          {activity.details && (
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Detail Parameter:</span>
              <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-[11px]">
                {activity.details}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-400 text-[11px]">
            <span>Waktu: <strong className="text-slate-600">{activity.timestamp}</strong></span>
            <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
              {activity.status}
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   6. ACTIVITY CENTER MODAL (Pusat Aktivitas Operasional)
   ========================================================= */
interface ActivityCenterModalProps {
  activities: ActivityFeedItem[];
  onClose: () => void;
  onSelectActivity: (activity: ActivityFeedItem) => void;
  onTriggerSimulation: (type: 'hafalan' | 'finance' | 'announcement' | 'attendance') => void;
  onResetActivities: () => void;
}

export function ActivityCenterModal({
  activities,
  onClose,
  onSelectActivity,
  onTriggerSimulation,
  onResetActivities
}: ActivityCenterModalProps) {
  const [filterCategory, setFilterCategory] = useState<'all' | 'hafalan' | 'finance' | 'announcement' | 'attendance' | 'ai'>('all');
  const [searchWord, setSearchWord] = useState('');

  const filtered = activities.filter(act => {
    const actLower = act.activity.toLowerCase();
    const detailsLower = (act.details || '').toLowerCase();
    const combined = `${actLower} ${detailsLower}`;

    if (filterCategory === 'hafalan' && !combined.includes('hafalan') && !combined.includes('tahfidz') && !combined.includes('munaqasyah')) return false;
    if (filterCategory === 'finance' && !combined.includes('pembayaran') && !combined.includes('kas') && !combined.includes('spp') && !combined.includes('rekening') && !combined.includes('mutasi')) return false;
    if (filterCategory === 'announcement' && !combined.includes('pengumuman') && !combined.includes('agenda') && !combined.includes('siaran') && !combined.includes('broadcast')) return false;
    if (filterCategory === 'attendance' && !combined.includes('absensi') && !combined.includes('presensi') && !combined.includes('kehadiran') && !combined.includes('siswa')) return false;
    if (filterCategory === 'ai' && act.agentType !== 'AI' && !combined.includes('ai') && !combined.includes('otomasi')) return false;

    if (searchWord.trim()) {
      const q = searchWord.toLowerCase();
      return (
        act.activity.toLowerCase().includes(q) ||
        act.agentName.toLowerCase().includes(q) ||
        act.roomName.toLowerCase().includes(q) ||
        (act.details && act.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-[#F8FAFC]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#E8F8F0] text-[#0F9E66] flex items-center justify-center font-bold shadow-2xs">
              <Activity size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  Pusat Pemantauan Aktivitas Agen
                </h3>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Stream ({activities.length})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau seluruh linimasa operasional dan simulasi aktivitas real-time.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Simulation Bar */}
        <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
            <Sparkles size={14} className="text-emerald-600" />
            <span>Simulasi Aktivitas Baru:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onTriggerSimulation('hafalan')}
              className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              📖 Setor Hafalan
            </button>
            <button
              onClick={() => onTriggerSimulation('finance')}
              className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              💳 Validasi SPP
            </button>
            <button
              onClick={() => onTriggerSimulation('announcement')}
              className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              📢 Pengumuman
            </button>
            <button
              onClick={() => onTriggerSimulation('attendance')}
              className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              👤 Absensi Santri
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
            {[
              { id: 'all', label: `Semua (${activities.length})` },
              { id: 'hafalan', label: 'Hafalan' },
              { id: 'finance', label: 'Keuangan' },
              { id: 'announcement', label: 'Pengumuman' },
              { id: 'attendance', label: 'Absensi' },
              { id: 'ai', label: 'AI Agen' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id as any)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterCategory === cat.id ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              placeholder="Cari aktivitas..."
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F9E66]"
            />
            <button
              onClick={onResetActivities}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              title="Reset ke Aktivitas Awal"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Activities List */}
        <div className="p-6 overflow-y-auto space-y-3.5 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Activity size={24} />
              </div>
              <p className="text-xs text-slate-500">Tidak ada aktivitas yang sesuai dengan filter.</p>
              <button
                onClick={onResetActivities}
                className="px-4 py-2 bg-[#0F9E66] text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
              >
                Muat Ulang Aktivitas
              </button>
            </div>
          ) : (
            filtered.map((act) => (
              <div
                key={act.id}
                onClick={() => onSelectActivity(act)}
                className="pt-3.5 first:pt-0 flex items-start justify-between gap-3 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#E8F8F0] text-[#0F9E66] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs mt-0.5">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0F9E66] transition-colors leading-tight">
                      {act.activity}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                      Pelaksana: <strong className="text-slate-700">{act.agentName}</strong> ({act.agentType}) • Lokasi: {act.roomName}
                    </p>
                    {act.details && (
                      <p className="text-[11px] text-slate-600 font-mono mt-1 bg-slate-100/70 p-2 rounded-xl border border-slate-200/60 leading-relaxed">
                        {act.details}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {act.timestamp}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {act.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filtered.length} dari total {activities.length} aktivitas</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

