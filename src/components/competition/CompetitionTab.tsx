import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, Award, Medal, Search, Filter, Plus, Edit, Trash2, Printer, 
  Sparkles, CheckCircle, RefreshCw, ChevronDown, Download, Users, FileText,
  Calendar, Star, Sliders, Shield, ArrowUpDown, Eye, Check, Lock, Unlock, ShieldAlert,
  Globe, EyeOff
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { 
  collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, 
  setDoc, serverTimestamp, getDocs, where 
} from 'firebase/firestore';
import { CompetitionEvent, CompetitionParticipant } from '../../types/competition';
import { 
  DEFAULT_FASHION_SHOW_EVENT, 
  DEFAULT_FASHION_SHOW_PARTICIPANTS, 
  COMPETITION_CATEGORIES 
} from '../../data/competitionData';
import PiagamModal from './PiagamModal';
import BeritaAcaraModal from './BeritaAcaraModal';
import { handleFirestoreError, OperationType } from '../../lib/firestoreUtils';

interface CompetitionTabProps {
  currentUserRole?: 'admin' | 'guru' | 'siswa';
  currentUserId?: string;
  currentUserName?: string;
  currentUserClass?: string;
  allUsers?: any[];
  schoolSettings?: any;
}

export default function CompetitionTab({
  currentUserRole = 'admin',
  currentUserId,
  currentUserName,
  currentUserClass,
  allUsers = [],
  schoolSettings
}: CompetitionTabProps) {
  // Events & Participants State
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [participants, setParticipants] = useState<CompetitionParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Filters & Search
  const [filterClass, setFilterClass] = useState<string>('Semua Kelas');
  const [filterGender, setFilterGender] = useState<string>('Semua Gender');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CompetitionEvent | null>(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<CompetitionParticipant | null>(null);
  const [showSignatureSettingsModal, setShowSignatureSettingsModal] = useState(false);
  const [selectedParticipantForPiagam, setSelectedParticipantForPiagam] = useState<CompetitionParticipant | null>(null);
  const [showBeritaAcaraModal, setShowBeritaAcaraModal] = useState(false);

  // Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState('Fashion Show');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventAcademicYear, setEventAcademicYear] = useState('2025/2026');
  const [eventDescription, setEventDescription] = useState('');
  const [eventTheme, setEventTheme] = useState('');
  const [eventHeadmasterName, setEventHeadmasterName] = useState('GIAN DWI WAHYUNI, S.H');
  const [eventHeadmasterNip, setEventHeadmasterNip] = useState('NPK: 8950490276014');
  const [eventJuryName, setEventJuryName] = useState('MUHAMAD NUGI ANDRI, S.H');
  const [eventJuryTitle, setEventJuryTitle] = useState('Praktisi & Penilai Busana');
  const [eventJuriesCount, setEventJuriesCount] = useState(1);
  const [eventAllowTeacherScoring, setEventAllowTeacherScoring] = useState(false);
  const [eventIsPublished, setEventIsPublished] = useState(true);

  // Participant Form State
  const [partStudentId, setPartStudentId] = useState('');
  const [partStudentName, setPartStudentName] = useState('');
  const [partNis, setPartNis] = useState('');
  const [partKelas, setPartKelas] = useState('Kelas Utsman bin Affan');
  const [partGender, setPartGender] = useState<'Putra' | 'Putri'>('Putri');
  const [partNoUrut, setPartNoUrut] = useState('');
  const [partGroupCategory, setPartGroupCategory] = useState('Kelompok B');
  const [partScoreJuri1, setPartScoreJuri1] = useState('');
  const [partScoreJuri2, setPartScoreJuri2] = useState('');
  const [partScoreJuri3, setPartScoreJuri3] = useState('');
  const [partAward, setPartAward] = useState('');
  const [partNotes, setPartNotes] = useState('');

  // Real-time listener for events
  useEffect(() => {
    const q = query(collection(db, 'competition_events'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompetitionEvent));
      setEvents(docs);
      if (docs.length > 0) {
        if (!selectedEventId || !docs.some(e => e.id === selectedEventId)) {
          setSelectedEventId(docs[0].id);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching competition events:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for participants of the selected event
  useEffect(() => {
    if (!selectedEventId) {
      setParticipants([]);
      return;
    }

    const q = query(
      collection(db, 'competition_participants'),
      where('eventId', '==', selectedEventId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompetitionParticipant));
      // Sort by averageScore descending, then rank ascending
      docs.sort((a, b) => {
        if ((b.averageScore || 0) !== (a.averageScore || 0)) {
          return (b.averageScore || 0) - (a.averageScore || 0);
        }
        return (a.rank || 999) - (b.rank || 999);
      });
      setParticipants(docs);
    }, (error) => {
      console.error('Error fetching competition participants:', error);
    });

    return () => unsubscribe();
  }, [selectedEventId]);

  // Current active event
  const currentEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);

  // Auto seed / Sync Fashion Show with all 56 participants and official Berita Acara metadata
  const handleSeedDefaultData = async () => {
    if (!window.confirm('Sinkronkan data Berita Acara Resmi (Nomor: 042/BA-JURI/RA-DS/2026) beserta 56 data peserta lengkap dengan nilai ke database?')) return;
    setIsSeeding(true);
    try {
      // 1. Save Event
      const eventRef = doc(db, 'competition_events', DEFAULT_FASHION_SHOW_EVENT.id);
      await setDoc(eventRef, {
        ...DEFAULT_FASHION_SHOW_EVENT,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 2. Save all 56 Participants
      for (const p of DEFAULT_FASHION_SHOW_PARTICIPANTS) {
        const pRef = doc(db, 'competition_participants', p.id);
        await setDoc(pRef, {
          ...p,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      setSelectedEventId(DEFAULT_FASHION_SHOW_EVENT.id);
      alert('Data Berita Acara Resmi (56 Peserta) berhasil disinkronkan ke database!');
    } catch (error) {
      console.error('Error seeding competition data:', error);
      alert('Gagal memuat data awal lomba.');
    } finally {
      setIsSeeding(false);
    }
  };

  // If initial load finishes and no events exist, automatically trigger fallback to default in local view
  const displayEvents = events.length > 0 ? events : [DEFAULT_FASHION_SHOW_EVENT];
  const activeDisplayEvent = currentEvent || DEFAULT_FASHION_SHOW_EVENT;
  const displayParticipants = (events.length === 0 && participants.length === 0) 
    ? DEFAULT_FASHION_SHOW_PARTICIPANTS 
    : participants;

  // Teacher Scoring Permissions:
  // Teachers are strictly view-only unless Admin explicitly grants scoring access for this event.
  const isTeacherAllowed = activeDisplayEvent?.allowTeacherScoring === true;
  const canScore = currentUserRole === 'admin' || (currentUserRole === 'guru' && isTeacherAllowed);
  const canManageEvent = currentUserRole === 'admin';

  // Toggle teacher scoring permission directly (Admin only)
  const handleToggleTeacherScoring = async () => {
    if (currentUserRole !== 'admin') return;
    const targetEvent = currentEvent || events.find(e => e.id === selectedEventId);
    if (!targetEvent) {
      alert('Event lomba belum tersimpan di database. Silakan klik "Sinkron Berita Acara" atau buat event terlebih dahulu.');
      return;
    }
    const currentVal = targetEvent.allowTeacherScoring === true;
    const nextVal = !currentVal;
    try {
      const eventRef = doc(db, 'competition_events', targetEvent.id);
      await updateDoc(eventRef, {
        allowTeacherScoring: nextVal,
        updatedAt: serverTimestamp(),
      });
      alert(nextVal 
        ? '✓ Akses Penilaian Guru DIAKTIFKAN: Guru kini dapat menginput dan mengedit nilai peserta.' 
        : '✓ Akses Penilaian Guru DIKUNCI: Guru kini hanya memiliki akses Lihat Rekap & Cetak Piagam (View Only).'
      );
    } catch (err) {
      console.error('Error toggling teacher scoring:', err);
      alert('Gagal memperbarui izin penilaian guru.');
    }
  };

  // Toggle publish status for the entire competition (Admin only)
  const handleTogglePublish = async () => {
    if (currentUserRole !== 'admin') return;
    const targetEvent = currentEvent || events.find(e => e.id === selectedEventId);
    if (!targetEvent) {
      alert('Event lomba belum tersimpan di database. Silakan klik "Sinkron Berita Acara" atau buat event terlebih dahulu.');
      return;
    }
    const currentVal = targetEvent.isPublished !== false;
    const nextVal = !currentVal;
    try {
      const eventRef = doc(db, 'competition_events', targetEvent.id);
      await updateDoc(eventRef, {
        isPublished: nextVal,
        updatedAt: serverTimestamp(),
      });
      alert(nextVal 
        ? '✓ HASIL LOMBA TELAH DIPUBLIKASIKAN!\n\nRekap nilai, peringkat juara, dan cetak piagam kini sudah AKTIF dan dapat dilihat di dashboard akun Siswa dan Guru.' 
        : '✓ STATUS PUBLIKASI DITARIK (DRAFT).\n\nHasil lomba kini DISEMBUNYIKAN dari dashboard Siswa dan Guru (Hanya Admin yang dapat melihat dan mengelola).'
      );
    } catch (err) {
      console.error('Error toggling publish status:', err);
      alert('Gagal memperbarui status publikasi.');
    }
  };

  // Filtered Participants
  const filteredParticipants = useMemo(() => {
    return displayParticipants.filter(p => {
      // Filter by Class
      if (filterClass !== 'Semua Kelas') {
        const pClass = (p.kelas || '').toLowerCase();
        const fClass = filterClass.toLowerCase();
        if (!pClass.includes(fClass.replace('kelas ', '')) && !pClass.includes(fClass)) {
          return false;
        }
      }
      // Filter by Gender
      if (filterGender !== 'Semua Gender') {
        if (p.gender !== filterGender) return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (p.studentName || '').toLowerCase().includes(q);
        const matchNo = (p.noUrut || '').toLowerCase().includes(q);
        const matchNis = (p.nis || '').toLowerCase().includes(q);
        const matchAward = (p.award || '').toLowerCase().includes(q);
        const matchClass = (p.kelas || '').toLowerCase().includes(q);
        if (!matchName && !matchNo && !matchNis && !matchAward && !matchClass) return false;
      }
      return true;
    });
  }, [displayParticipants, filterClass, filterGender, searchQuery]);

  // Top 3 Podium
  const top1 = displayParticipants.find(p => p.rank === 1) || displayParticipants[0] || null;
  const top2 = displayParticipants.find(p => p.rank === 2) || displayParticipants[1] || null;
  const top3 = displayParticipants.find(p => p.rank === 3) || displayParticipants[2] || null;

  // Auto Recalculate Ranks & Awards
  const handleAutoCalculateRanks = async () => {
    if (participants.length === 0) {
      alert('Tidak ada data peserta untuk dihitung.');
      return;
    }
    if (!window.confirm('Hitung ulang otomatis nilai rata-rata, peringkat (#1, #2, dst), dan sertifikat untuk semua peserta?')) return;

    try {
      // Calculate averages and sort
      const sorted = [...participants].map(p => {
        const s1 = p.scores?.juri1 ? Number(p.scores.juri1) : null;
        const s2 = p.scores?.juri2 ? Number(p.scores.juri2) : null;
        const s3 = p.scores?.juri3 ? Number(p.scores.juri3) : null;
        
        const validScores = [s1, s2, s3].filter((s): s is number => s !== null && !isNaN(s) && s > 0);
        const avg = validScores.length > 0 
          ? validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length 
          : (p.averageScore || 0);

        return {
          ...p,
          averageScore: parseFloat(avg.toFixed(2))
        };
      }).sort((a, b) => b.averageScore - a.averageScore);

      // Update in Firestore with Rank & Default Awards
      for (let i = 0; i < sorted.length; i++) {
        const rank = i + 1;
        let suggestedAward = sorted[i].award || '';
        if (rank === 1) suggestedAward = 'JUARA 1';
        else if (rank === 2) suggestedAward = 'JUARA 2';
        else if (rank === 3) suggestedAward = 'JUARA 3';
        else if (rank === 4) suggestedAward = 'PESERTA BERBAKAT FASHION SHOW';
        else if (rank === 5) suggestedAward = 'PESERTA BERBAKAT FASHION SHOW';
        else if (!suggestedAward) suggestedAward = 'PESERTA BERBAKAT';

        const certNum = sorted[i].certificateNumber || 
          `RADS-CERT-2026/${sorted[i].noUrut ? sorted[i].noUrut.replace('#', '') : String(rank).padStart(3, '0')}-${sorted[i].nis || 'RADS-2024-001'}`;

        await updateDoc(doc(db, 'competition_participants', sorted[i].id), {
          averageScore: sorted[i].averageScore,
          rank: rank,
          award: suggestedAward,
          certificateNumber: certNum,
          updatedAt: serverTimestamp()
        });
      }

      alert('Peringkat, nilai rata-rata, dan penghargaan berhasil dihitung ulang!');
    } catch (error) {
      console.error('Error auto calculating ranks:', error);
      alert('Gagal menghitung otomatis peringkat.');
    }
  };

  // Open Event Modal for Create / Edit
  const handleOpenEventModal = (eventToEdit?: CompetitionEvent) => {
    if (eventToEdit) {
      setEditingEvent(eventToEdit);
      setEventTitle(eventToEdit.title);
      setEventCategory(eventToEdit.category);
      setEventDate(eventToEdit.date);
      setEventAcademicYear(eventToEdit.academicYear);
      setEventDescription(eventToEdit.description || '');
      setEventTheme(eventToEdit.theme || '');
      setEventHeadmasterName(eventToEdit.headmasterName || 'GIAN DWI WAHYUNI, S.H');
      let nipVal = eventToEdit.headmasterNip || 'NPK: 8950490276014';
      if (nipVal.includes('8950490276014') && nipVal.startsWith('NIP:')) {
        nipVal = nipVal.replace('NIP:', 'NPK:');
      }
      setEventHeadmasterNip(nipVal);
      setEventJuryName(eventToEdit.juryName || 'MUHAMAD NUGI ANDRI, S.H');
      setEventJuryTitle(eventToEdit.juryTitle || 'Praktisi & Penilai Busana');
      setEventJuriesCount(eventToEdit.juriesCount || 1);
      setEventAllowTeacherScoring(eventToEdit.allowTeacherScoring === true);
      setEventIsPublished(eventToEdit.isPublished !== false);
    } else {
      setEditingEvent(null);
      setEventTitle('');
      setEventCategory('Fashion Show');
      setEventDate(new Date().toISOString().split('T')[0]);
      setEventAcademicYear('2025/2026');
      setEventDescription('');
      setEventTheme('');
      setEventHeadmasterName('GIAN DWI WAHYUNI, S.H');
      setEventHeadmasterNip('NPK: 8950490276014');
      setEventJuryName('MUHAMAD NUGI ANDRI, S.H');
      setEventJuryTitle('Praktisi & Penilai Busana');
      setEventJuriesCount(1);
      setEventAllowTeacherScoring(false);
      setEventIsPublished(true);
    }
    setShowEventModal(true);
  };

  // Save Event
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      alert('Nama event/lomba wajib diisi.');
      return;
    }

    try {
      let finalNip = eventHeadmasterNip.trim() || 'NPK: 8950490276014';
      if (finalNip.includes('8950490276014') && finalNip.startsWith('NIP:')) {
        finalNip = finalNip.replace('NIP:', 'NPK:');
      }

      const eventData: Partial<CompetitionEvent> = {
        title: eventTitle.trim(),
        category: eventCategory,
        date: eventDate,
        academicYear: eventAcademicYear,
        description: eventDescription,
        theme: eventTheme,
        headmasterName: eventHeadmasterName,
        headmasterNip: finalNip,
        juryName: eventJuryName,
        juryTitle: eventJuryTitle,
        certificatePrefix: 'RADS-CERT-2026',
        juriesCount: Number(eventJuriesCount) || 1,
        allowTeacherScoring: eventAllowTeacherScoring,
        isPublished: eventIsPublished,
        status: 'Aktif',
        updatedAt: serverTimestamp()
      };

      if (editingEvent) {
        await updateDoc(doc(db, 'competition_events', editingEvent.id), eventData);
        alert('Data event lomba berhasil diperbarui!');
      } else {
        const newDoc = await addDoc(collection(db, 'competition_events'), {
          ...eventData,
          createdAt: serverTimestamp()
        });
        setSelectedEventId(newDoc.id);
        alert('Event lomba baru berhasil ditambahkan!');
      }
      setShowEventModal(false);
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Gagal menyimpan event.');
    }
  };

  // Open Participant Modal for Create / Edit
  const handleOpenParticipantModal = (pToEdit?: CompetitionParticipant) => {
    if (pToEdit) {
      setEditingParticipant(pToEdit);
      setPartStudentId(pToEdit.studentId || '');
      setPartStudentName(pToEdit.studentName);
      setPartNis(pToEdit.nis || '');
      setPartKelas(pToEdit.kelas || 'Kelas Utsman bin Affan');
      setPartGender(pToEdit.gender || 'Putri');
      setPartNoUrut(pToEdit.noUrut || '');
      setPartGroupCategory(pToEdit.groupCategory || 'Kelompok B');
      setPartScoreJuri1(pToEdit.scores?.juri1 ? String(pToEdit.scores.juri1) : '');
      setPartScoreJuri2(pToEdit.scores?.juri2 ? String(pToEdit.scores.juri2) : '');
      setPartScoreJuri3(pToEdit.scores?.juri3 ? String(pToEdit.scores.juri3) : '');
      setPartAward(pToEdit.award || '');
      setPartNotes(pToEdit.notes || '');
    } else {
      setEditingParticipant(null);
      setPartStudentId('');
      setPartStudentName('');
      setPartNis('');
      setPartKelas(currentUserClass || 'Kelas Utsman bin Affan');
      setPartGender('Putri');
      const nextNo = displayParticipants.length + 1;
      setPartNoUrut(`#${String(nextNo).padStart(2, '0')}`);
      setPartGroupCategory('Kelompok B');
      setPartScoreJuri1('');
      setPartScoreJuri2('');
      setPartScoreJuri3('');
      setPartAward('');
      setPartNotes('');
    }
    setShowParticipantModal(true);
  };

  // Select student from existing user list
  const handleSelectStudentUser = (userId: string) => {
    setPartStudentId(userId);
    const found = allUsers.find(u => u.id === userId);
    if (found) {
      setPartStudentName(found.name || '');
      setPartNis(found.nis || found.nisn || '');
      if (found.kelas) setPartKelas(found.kelas);
      if (found.gender) setPartGender(found.gender);
    }
  };

  // Save Participant
  const handleSaveParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partStudentName.trim()) {
      alert('Nama peserta wajib diisi.');
      return;
    }
    if (!selectedEventId && events.length === 0) {
      // Need an event first
      alert('Mohon muat atau buat event lomba terlebih dahulu.');
      return;
    }

    try {
      const currentEv = activeDisplayEvent;
      const s1 = partScoreJuri1 ? parseFloat(partScoreJuri1) : undefined;
      const s2 = partScoreJuri2 ? parseFloat(partScoreJuri2) : undefined;
      const s3 = partScoreJuri3 ? parseFloat(partScoreJuri3) : undefined;

      const validScores = [s1, s2, s3].filter((s): s is number => s !== undefined && !isNaN(s) && s > 0);
      const avg = validScores.length > 0 
        ? parseFloat((validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length).toFixed(2))
        : 0;

      const cleanNo = partNoUrut ? (partNoUrut.startsWith('#') ? partNoUrut : `#${partNoUrut}`) : `#${displayParticipants.length + 1}`;
      const certNum = editingParticipant?.certificateNumber || 
        `RADS-CERT-2026/${cleanNo.replace('#', '')}-${partNis || 'RADS-2024-001'}`;

      const partData: Partial<CompetitionParticipant> = {
        eventId: selectedEventId || currentEv.id,
        eventTitle: currentEv.title,
        studentId: partStudentId || undefined,
        studentName: partStudentName.trim(),
        nis: partNis.trim(),
        kelas: partKelas,
        gender: partGender,
        noUrut: cleanNo,
        groupCategory: partGroupCategory,
        scores: {
          ...(s1 !== undefined && { juri1: s1 }),
          ...(s2 !== undefined && { juri2: s2 }),
          ...(s3 !== undefined && { juri3: s3 }),
        },
        averageScore: avg,
        award: partAward.trim() || undefined,
        certificateNumber: certNum,
        notes: partNotes.trim(),
        updatedAt: serverTimestamp()
      };

      if (editingParticipant) {
        await updateDoc(doc(db, 'competition_participants', editingParticipant.id), partData);
        alert('Data peserta berhasil diperbarui!');
      } else {
        await addDoc(collection(db, 'competition_participants'), {
          ...partData,
          rank: displayParticipants.length + 1,
          createdAt: serverTimestamp()
        });
        alert('Peserta lomba berhasil ditambahkan!');
      }
      setShowParticipantModal(false);
    } catch (error) {
      console.error('Error saving participant:', error);
      alert('Gagal menyimpan data peserta.');
    }
  };

  // Delete Participant
  const handleDeleteParticipant = async (id: string, name: string) => {
    if (!window.confirm(`Hapus data peserta "${name}" dari lomba ini?`)) return;
    try {
      await deleteDoc(doc(db, 'competition_participants', id));
      alert('Peserta berhasil dihapus.');
    } catch (error) {
      console.error('Error deleting participant:', error);
      alert('Gagal menghapus peserta.');
    }
  };

  // Delete Event
  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!window.confirm(`PERINGATAN: Hapus event "${title}" beserta seluruh data nilai pesertanya?`)) return;
    try {
      // 1. Delete all participants of this event
      const qPart = query(collection(db, 'competition_participants'), where('eventId', '==', eventId));
      const snap = await getDocs(qPart);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'competition_participants', d.id));
      }
      // 2. Delete event
      await deleteDoc(doc(db, 'competition_events', eventId));
      alert('Event berhasil dihapus.');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Gagal menghapus event.');
    }
  };

  // Available classes for filtering
  const availableClasses = useMemo(() => {
    const fromParts = displayParticipants.map(p => p.kelas?.trim()).filter(Boolean);
    const classes = ['Semua Kelas', 'Kelas Utsman bin Affan', 'Kelas Umar bin Khattab', ...fromParts];
    return Array.from(new Set(classes));
  }, [displayParticipants]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      
      {/* Top Header Card */}
      <div className="card-3d bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl shadow-xs">
              <Trophy size={26} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Hasil Lomba & Piagam Penghargaan
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Rekapitulasi skor, leaderboard peringkat, dan cetak piagam penghargaan resmi ber-barcode.
              </p>
            </div>
          </div>
        </div>

        {/* Event Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Event Dropdown */}
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer"
            >
              {displayEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  🏆 {ev.title} ({ev.academicYear})
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Admin Toggle: Publikasikan Hasil Lomba ke Siswa & Guru */}
          {currentUserRole === 'admin' && (
            <button
              onClick={handleTogglePublish}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${
                activeDisplayEvent?.isPublished !== false
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/20'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
              }`}
              title={activeDisplayEvent?.isPublished !== false ? "Hasil lomba sedang DIPUBLIKASIKAN (tampil di akun siswa & guru). Klik untuk menyembunyikan (Draft)." : "Hasil lomba masih DRAFT (belum tampil di akun siswa & guru). Klik untuk publikasi."}
            >
              {activeDisplayEvent?.isPublished !== false ? (
                <>
                  <Globe size={14} className="text-emerald-200" />
                  <span>Publikasi: <strong>LIVE (Siswa & Guru)</strong></span>
                </>
              ) : (
                <>
                  <EyeOff size={14} className="text-amber-700" />
                  <span>Publikasi: <strong>DRAFT (Disembunyikan)</strong></span>
                </>
              )}
            </button>
          )}

          {/* Admin Toggle: Izinkan Guru Menilai */}
          {currentUserRole === 'admin' && (
            <button
              onClick={handleToggleTeacherScoring}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${
                activeDisplayEvent?.allowTeacherScoring
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
              }`}
              title="Admin menentukan apakah akun guru diizinkan menilai peserta atau hanya melihat/cetak piagam"
            >
              {activeDisplayEvent?.allowTeacherScoring ? (
                <>
                  <Unlock size={14} className="text-amber-600" />
                  <span>Akses Guru: <strong className="text-amber-700">Bisa Menilai (ON)</strong></span>
                </>
              ) : (
                <>
                  <Lock size={14} className="text-slate-500" />
                  <span>Akses Guru: <strong className="text-slate-700">Terkunci (Hanya Admin)</strong></span>
                </>
              )}
            </button>
          )}

          {/* Teacher Status Badge when Locked */}
          {currentUserRole === 'guru' && !isTeacherAllowed && (
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold" title="Akses input/edit nilai peserta hanya dapat dibuka oleh Admin">
              <Lock size={14} className="text-slate-400" />
              <span>Akses Nilai: <strong>Terkunci (Mode Cetak Piagam)</strong></span>
            </div>
          )}

          {/* Teacher Status Badge when Allowed */}
          {currentUserRole === 'guru' && isTeacherAllowed && (
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold" title="Admin telah memberikan izin bagi guru untuk menilai peserta">
              <Unlock size={14} className="text-emerald-600" />
              <span>Akses Nilai: <strong>Diizinkan Admin</strong></span>
            </div>
          )}

          {/* Berita Acara Print Button (Restricted Strictly to Admin Role to avoid disputes) */}
          {currentUserRole === 'admin' && (
            <button
              onClick={() => setShowBeritaAcaraModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
              title="Cetak Berita Acara Penilaian Dewan Juri Resmi (PDF - Khusus Admin)"
            >
              <FileText size={15} />
              <span>📄 Cetak Berita Acara (Admin)</span>
            </button>
          )}

          {/* Button Input Nilai / Peserta: Only if canScore (Admin always, Guru only if allowed by Admin) */}
          {canScore && (
            <button
              onClick={() => handleOpenParticipantModal()}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>+ Input Nilai / Peserta</span>
            </button>
          )}

          {/* Event Baru & Sinkron Data: Strictly Admin Only */}
          {currentUserRole === 'admin' && (
            <>
              <button
                onClick={() => handleOpenEventModal()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                title="Tambah Event Lomba Baru"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Event Baru</span>
              </button>

              <button
                onClick={handleSeedDefaultData}
                disabled={isSeeding}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                title="Sinkronkan data Berita Acara Resmi (56 Peserta Lengkap) ke database"
              >
                <RefreshCw size={14} className={isSeeding ? 'animate-spin' : ''} />
                <span className="hidden md:inline">Sinkron Berita Acara (56 Peserta)</span>
                <span className="md:hidden">Sinkron Data</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Draft Notification Banner if Not Published */}
      {activeDisplayEvent?.isPublished === false && (
        <div className="p-4 sm:p-5 bg-amber-50/95 border-2 border-amber-200 rounded-3xl text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-amber-200/90 text-amber-900 rounded-2xl shrink-0 shadow-xs">
              <EyeOff size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider rounded-lg">
                  Status: DRAFT
                </span>
                <p className="text-xs sm:text-sm font-black text-amber-950">
                  Hasil Lomba Belum Dipublikasikan ke Siswa & Guru
                </p>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-800 font-medium mt-1">
                {currentUserRole === 'admin'
                  ? 'Data rekapitulasi nilai, peringkat juara, dan piagam ananda saat ini masih DISEMBUNYIKAN dari akun Siswa & Guru. Klik tombol "Publikasikan Sekarang" jika penilaian sudah final.'
                  : 'Hasil lomba masih dalam proses finalisasi dewan juri / admin dan belum muncul di dashboard akun Siswa & Wali Murid.'}
              </p>
            </div>
          </div>
          {currentUserRole === 'admin' && (
            <button
              onClick={handleTogglePublish}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 shrink-0 cursor-pointer transition-all hover:scale-105"
            >
              <Globe size={15} />
              <span>Publikasikan Sekarang (Live)</span>
            </button>
          )}
        </div>
      )}

      {/* Podium Top 3 Cards (Gold, Silver, Bronze) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-end">
        {/* Juara 2 (Silver) */}
        <div className="order-2 md:order-1 card-3d bg-gradient-to-b from-slate-50 to-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 bg-slate-200 text-slate-700 px-3.5 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-wider">
            JUARA 2
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600 shadow-xs">
                <Medal size={24} className="text-slate-400" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500">
                  {top2?.noUrut || '#53'} • {top2?.groupCategory || 'Kelompok B'}
                </p>
                <h3 className="text-base font-black text-slate-800 leading-tight">
                  {top2?.studentName || 'Safira Nadya Wijaya'}
                </h3>
                <p className="text-[11px] font-bold text-slate-500 uppercase mt-0.5">
                  {top2?.kelas || 'Kelas Utsman bin Affan'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Nilai Rata-rata</p>
              <p className="text-2xl font-black text-slate-800">
                {top2?.averageScore ? top2.averageScore.toFixed(2) : '85.80'}
              </p>
            </div>

            {top2 && (
              <button
                onClick={() => setSelectedParticipantForPiagam(top2)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Printer size={13} />
                <span>Piagam</span>
              </button>
            )}
          </div>
        </div>

        {/* Juara 1 (Gold - Elevated) */}
        <div className="order-1 md:order-2 card-3d bg-gradient-to-b from-amber-50/80 via-white to-amber-50/40 p-6 rounded-3xl border-2 border-amber-300 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[250px] -mt-2 md:-mt-4">
          <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 px-4 py-1 rounded-bl-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={12} />
            <span>JUARA 1</span>
          </div>

          <div>
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-13 h-13 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-700 shadow-sm">
                <Trophy size={28} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-amber-700">
                  {top1?.noUrut || '#41'} • {top1?.groupCategory || 'Kelompok B'}
                </p>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {top1?.studentName || 'Dayfa Naraya Safna'}
                </h3>
                <p className="text-xs font-bold text-amber-800 uppercase mt-0.5">
                  {top1?.kelas || 'Kelas Utsman bin Affan'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-200/60 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-amber-700 uppercase">Skor Rata-rata Juara</p>
              <p className="text-3xl font-black text-slate-900">
                {top1?.averageScore ? top1.averageScore.toFixed(2) : '86.00'}
              </p>
            </div>

            {top1 && (
              <button
                onClick={() => setSelectedParticipantForPiagam(top1)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Printer size={15} />
                <span>Cetak Piagam</span>
              </button>
            )}
          </div>
        </div>

        {/* Juara 3 (Bronze) */}
        <div className="order-3 card-3d bg-gradient-to-b from-orange-50/50 to-white p-5 rounded-3xl border-2 border-orange-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 bg-orange-400 text-white px-3.5 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-wider">
            JUARA 3
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-700 shadow-xs">
                <Medal size={24} className="text-orange-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500">
                  {top3?.noUrut || '#10'} • {top3?.groupCategory || 'Kelompok A'}
                </p>
                <h3 className="text-base font-black text-slate-800 leading-tight">
                  {top3?.studentName || 'Azkia Zalina'}
                </h3>
                <p className="text-[11px] font-bold text-slate-500 uppercase mt-0.5">
                  {top3?.kelas || 'Kelas Umar bin Khattab'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Nilai Rata-rata</p>
              <p className="text-2xl font-black text-slate-800">
                {top3?.averageScore ? top3.averageScore.toFixed(2) : '85.20'}
              </p>
            </div>

            {top3 && (
              <button
                onClick={() => setSelectedParticipantForPiagam(top3)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Printer size={13} />
                <span>Piagam</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold mr-1">
            <Filter size={14} />
            <span>Filter:</span>
          </div>

          {/* Class Filters */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            {['Semua Kelas', 'Kelas Umar bin Khattab', 'Kelas Utsman bin Affan'].map((c) => (
              <button
                key={c}
                onClick={() => setFilterClass(c)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterClass === c
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Gender Filters */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            {['Semua Gender', 'Putra', 'Putri'].map((g) => (
              <button
                key={g}
                onClick={() => setFilterGender(g)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterGender === g
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Extra Tools */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, no urut, tema..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {canScore && (
            <button
              onClick={handleAutoCalculateRanks}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              title="Hitung ulang rata-rata dan peringkat"
            >
              <ArrowUpDown size={14} />
              <span className="hidden sm:inline">Auto Ranking</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table: Tabel Rekapitulasi Skor & Peringkat */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-base font-black text-slate-800">Tabel Rekapitulasi Skor & Peringkat</h3>
            <p className="text-xs text-slate-500 font-medium">
              Menampilkan {filteredParticipants.length} data peserta • Diurutkan dari nilai tertinggi
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBeritaAcaraModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <FileText size={13} />
              <span>Cetak Berita Acara (PDF)</span>
            </button>

            {currentUserRole === 'admin' && currentEvent && (
              <button
                onClick={() => handleOpenEventModal(currentEvent)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Sliders size={13} />
                <span>Pengaturan Juri</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-black uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 text-center">Peringkat</th>
                <th className="py-3.5 px-4 text-center">No. Urut</th>
                <th className="py-3.5 px-4">Nama Siswa / Peserta</th>
                <th className="py-3.5 px-4">Kelas & Rombel</th>
                <th className="py-3.5 px-3 text-center">Juri 1</th>
                <th className="py-3.5 px-3 text-center">Juri 2</th>
                <th className="py-3.5 px-3 text-center">Juri 3</th>
                <th className="py-3.5 px-4 text-center">Rata-Rata</th>
                <th className="py-3.5 px-4 text-center">Penghargaan</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Trophy size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-bold">Belum ada data peserta pada filter ini</p>
                    <p className="text-[11px] mt-0.5">Silakan tambahkan peserta baru atau ubah kriteria filter pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, idx) => {
                  const rankNum = p.rank || idx + 1;
                  const isTop1 = rankNum === 1;
                  const isTop2 = rankNum === 2;
                  const isTop3 = rankNum === 3;

                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isTop1 ? 'bg-amber-50/30' : isTop2 ? 'bg-slate-50/40' : isTop3 ? 'bg-orange-50/20' : ''
                      }`}
                    >
                      {/* Peringkat Badge */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                          isTop1
                            ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                            : isTop2
                            ? 'bg-slate-300 text-slate-800'
                            : isTop3
                            ? 'bg-orange-300 text-orange-950'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {rankNum}
                        </span>
                      </td>

                      {/* No. Urut */}
                      <td className="py-4 px-4 text-center font-bold text-slate-700">
                        {p.noUrut || `#${idx + 1}`}
                      </td>

                      {/* Nama Siswa & NIS */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {p.studentName}
                        </div>
                        {p.nis && (
                          <div className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                            NIS: {p.nis}
                          </div>
                        )}
                      </td>

                      {/* Kelas & Rombel */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-emerald-800 uppercase tracking-tight">
                          {p.kelas.replace('Kelas ', '')}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {p.gender || 'Putri'} • {p.noUrut || `#${idx + 1}`}
                        </div>
                      </td>

                      {/* Juri 1 */}
                      <td className="py-4 px-3 text-center font-bold text-slate-700">
                        {p.scores?.juri1 ? Number(p.scores.juri1).toFixed(1) : '-'}
                      </td>

                      {/* Juri 2 */}
                      <td className="py-4 px-3 text-center font-bold text-slate-500">
                        {p.scores?.juri2 ? Number(p.scores.juri2).toFixed(1) : '-'}
                      </td>

                      {/* Juri 3 */}
                      <td className="py-4 px-3 text-center font-bold text-slate-500">
                        {p.scores?.juri3 ? Number(p.scores.juri3).toFixed(1) : '-'}
                      </td>

                      {/* Rata-Rata */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-mono font-black text-sm text-slate-900">
                          {p.averageScore ? p.averageScore.toFixed(2) : '-'}
                        </span>
                      </td>

                      {/* Penghargaan Badge */}
                      <td className="py-4 px-4 text-center">
                        {p.award ? (
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            p.award === 'JUARA 1'
                              ? 'bg-amber-400 text-amber-950 shadow-xs'
                              : p.award === 'JUARA 2'
                              ? 'bg-slate-200 text-slate-800'
                              : p.award === 'JUARA 3'
                              ? 'bg-orange-300 text-orange-950'
                              : 'border border-emerald-500 text-emerald-700 bg-emerald-50/50'
                          }`}>
                            {p.award}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedParticipantForPiagam(p)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                            title="Lihat & Cetak Piagam Penghargaan"
                          >
                            <Printer size={13} />
                            <span>Piagam</span>
                          </button>

                          {canScore && (
                            <button
                              onClick={() => handleOpenParticipantModal(p)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Nilai"
                            >
                              <Edit size={14} />
                            </button>
                          )}

                          {currentUserRole === 'admin' && (
                            <button
                              onClick={() => handleDeleteParticipant(p.id, p.studentName)}
                              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Peserta"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah / Edit Event Lomba */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-600" />
                <h3 className="text-sm font-black text-slate-800">
                  {editingEvent ? 'Edit Event Lomba' : 'Tambah Event Lomba Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lomba / Event *</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Contoh: LOMBA FASHION SHOW BUSANA MUSLIM"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Lomba</label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                  >
                    {COMPETITION_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={eventAcademicYear}
                    onChange={(e) => setEventAcademicYear(e.target.value)}
                    placeholder="2025/2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Juri Penilai</label>
                  <select
                    value={eventJuriesCount}
                    onChange={(e) => setEventJuriesCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                  >
                    <option value={1}>1 Juri</option>
                    <option value={2}>2 Juri</option>
                    <option value={3}>3 Juri</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="font-extrabold text-amber-800 uppercase tracking-wider text-[10px] mb-2">
                  Penandatangan Piagam (TTD Digital)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Ketua Juri</label>
                    <input
                      type="text"
                      value={eventJuryName}
                      onChange={(e) => setEventJuryName(e.target.value)}
                      placeholder="MUHAMAD NUGI ANDRI, S.H"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gelar / Jabatan Juri</label>
                    <input
                      type="text"
                      value={eventJuryTitle}
                      onChange={(e) => setEventJuryTitle(e.target.value)}
                      placeholder="Praktisi & Penilai Busana"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Kepala RA</label>
                    <input
                      type="text"
                      value={eventHeadmasterName}
                      onChange={(e) => setEventHeadmasterName(e.target.value)}
                      placeholder="GIAN DWI WAHYUNI, S.H"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NPK / NIP Kepala RA</label>
                    <input
                      type="text"
                      value={eventHeadmasterNip}
                      onChange={(e) => setEventHeadmasterNip(e.target.value)}
                      placeholder="NPK: 8950490276014"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                    />
                  </div>
                </div>

                {/* Status Publikasi Hasil Lomba */}
                <div className="mt-3.5 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Globe size={14} className="text-emerald-700" />
                        <label className="block font-extrabold text-slate-800 text-xs">
                          Publikasikan Hasil ke Siswa & Guru
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        {eventIsPublished
                          ? 'Aktif: Nilai, peringkat, dan piagam ananda langsung tampil di dashboard akun Siswa & Guru.'
                          : 'Draft: Hasil lomba hanya terlihat oleh Admin (belum muncul di akun Siswa & Guru).'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEventIsPublished(!eventIsPublished)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        eventIsPublished ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          eventIsPublished ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Hak Akses Penilaian Guru */}
                <div className="mt-3.5 p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-amber-700" />
                        <label className="block font-extrabold text-slate-800 text-xs">
                          Izin Guru Menilai Peserta
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        {eventAllowTeacherScoring
                          ? 'Aktif: Guru dapat menginput & mengubah nilai peserta lomba ini.'
                          : 'Nonaktif: Guru hanya bisa melihat rekapitulasi & mencetak piagam (penilaian terkunci khusus admin).'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEventAllowTeacherScoring(!eventAllowTeacherScoring)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        eventAllowTeacherScoring ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          eventAllowTeacherScoring ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  {editingEvent ? 'Simpan Perubahan' : 'Buat Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Peserta & Nilai */}
      {showParticipantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-600" />
                <h3 className="text-sm font-black text-slate-800">
                  {editingParticipant ? 'Edit Nilai Peserta' : 'Tambah Peserta & Nilai Lomba'}
                </h3>
              </div>
              <button
                onClick={() => setShowParticipantModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveParticipant} className="p-6 space-y-3.5 overflow-y-auto flex-1 text-xs">
              {/* Select Student from DB or Manual */}
              {!editingParticipant && allUsers.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pilih Siswa Terdaftar (Opsional)
                  </label>
                  <select
                    value={partStudentId}
                    onChange={(e) => handleSelectStudentUser(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                  >
                    <option value="">-- Input Manual atau Pilih dari Data Siswa --</option>
                    {allUsers.filter(u => u.role === 'siswa').map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.kelas || 'Siswa'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Siswa / Peserta *</label>
                <input
                  type="text"
                  required
                  value={partStudentName}
                  onChange={(e) => setPartStudentName(e.target.value)}
                  placeholder="Contoh: Dayfa Naraya Safna"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Urut Tampil</label>
                  <input
                    type="text"
                    value={partNoUrut}
                    onChange={(e) => setPartNoUrut(e.target.value)}
                    placeholder="#41"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIS Siswa</label>
                  <input
                    type="text"
                    value={partNis}
                    onChange={(e) => setPartNis(e.target.value)}
                    placeholder="RADS-2024-021"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={partKelas}
                    onChange={(e) => setPartKelas(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                  >
                    <option value="Kelas Utsman bin Affan">Kelas Utsman bin Affan</option>
                    <option value="Kelas Umar bin Khattab">Kelas Umar bin Khattab</option>
                    <option value="Kelompok A">Kelompok A</option>
                    <option value="Kelompok B">Kelompok B</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={partGender}
                    onChange={(e) => setPartGender(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                  >
                    <option value="Putri">Putri</option>
                    <option value="Putra">Putra</option>
                  </select>
                </div>
              </div>

              {/* Scoring Inputs */}
              <div className="p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-2xl">
                <p className="font-extrabold text-amber-900 uppercase tracking-wider text-[10px] mb-2.5">
                  Input Skor Penilaian Juri (Skala 0 - 100)
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Juri 1</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={partScoreJuri1}
                      onChange={(e) => setPartScoreJuri1(e.target.value)}
                      placeholder="86.0"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-slate-900 font-black text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Juri 2</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={partScoreJuri2}
                      onChange={(e) => setPartScoreJuri2(e.target.value)}
                      placeholder="-"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-black text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Juri 3</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={partScoreJuri3}
                      onChange={(e) => setPartScoreJuri3(e.target.value)}
                      placeholder="-"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-black text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Award Preset */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Gelar Penghargaan (Piagam)</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'JUARA 1', 
                    'JUARA 2', 
                    'JUARA 3', 
                    'HARAPAN 1', 
                    'HARAPAN 2',
                    'PESERTA BERBAKAT FASHION SHOW', 
                    'PESERTA TERBAIK KELOMPOK A',
                    'PESERTA FAVORIT'
                  ].map(a => (
                    <button
                      type="button"
                      key={a}
                      onClick={() => setPartAward(a)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        partAward === a
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={partAward}
                  onChange={(e) => setPartAward(e.target.value)}
                  placeholder="Ketik gelar custom atau pilih preset di atas..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Dewan Juri (Opsional)</label>
                <input
                  type="text"
                  value={partNotes}
                  onChange={(e) => setPartNotes(e.target.value)}
                  placeholder="Catatan kelebihan atau penampilan..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowParticipantModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  {editingParticipant ? 'Simpan Nilai' : 'Tambahkan Peserta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIAGAM PENGHARGAAN MODAL (Official Certificate Preview & Print) */}
      {selectedParticipantForPiagam && (
        <PiagamModal
          participant={selectedParticipantForPiagam}
          event={activeDisplayEvent}
          onClose={() => setSelectedParticipantForPiagam(null)}
          schoolSettings={schoolSettings}
        />
      )}

      {/* BERITA ACARA MODAL (Official Minutes & Score Sheet Preview & Print) */}
      {showBeritaAcaraModal && (
        <BeritaAcaraModal
          event={activeDisplayEvent}
          participants={displayParticipants}
          onClose={() => setShowBeritaAcaraModal(false)}
        />
      )}

    </div>
  );
}
