import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, Award, Medal, Search, Filter, Plus, Edit, Trash2, Printer, 
  Sparkles, CheckCircle, RefreshCw, ChevronDown, Download, Users, FileText,
  Calendar, Star, Sliders, Shield, ArrowUpDown, Eye, Check, Lock, Unlock, ShieldAlert,
  Globe, EyeOff, X, ChevronLeft, ChevronRight, Settings, Bell, ArrowLeft,
  FileSpreadsheet, AlertTriangle, ExternalLink, CheckCircle2
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

interface CompetitionTabProps {
  currentUserRole?: 'admin' | 'guru' | 'siswa';
  currentUserId?: string;
  currentUserName?: string;
  currentUserClass?: string;
  allUsers?: any[];
  schoolSettings?: any;
}

// Avatar Helper Component with cute avatars and graceful fallback
function StudentAvatar({ name, gender, size = 'md', className = '' }: { name: string; gender?: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-xs',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg'
  }[size];

  // Generate a distinct avatar seed based on name
  const seed = encodeURIComponent(name.trim().toLowerCase() || 'student');
  const avatarUrl = `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'S';

  const isBoy = gender === 'Putra';
  const bgGradient = isBoy ? 'from-blue-100 to-indigo-200 text-blue-800' : 'from-rose-100 to-amber-100 text-rose-800';

  if (imgError) {
    return (
      <div className={`rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center font-black shrink-0 ${sizeClasses} ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`relative rounded-full overflow-hidden shrink-0 border border-slate-200 bg-white ${sizeClasses} ${className}`}>
      <img
        src={avatarUrl}
        alt={name}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

export default function CompetitionTab({
  currentUserRole = 'admin',
  currentUserId,
  currentUserName,
  currentUserClass,
  allUsers = [],
  schoolSettings
}: CompetitionTabProps) {
  // Navigation Sub-Tabs: 'hasil' | 'piagam' | 'berita_acara' | 'pengaturan'
  const [activeSubTab, setActiveSubTab] = useState<'hasil' | 'piagam' | 'berita_acara' | 'pengaturan'>('hasil');

  // Events & Participants State
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [participants, setParticipants] = useState<CompetitionParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Filters & Search & Pagination
  const [filterClass, setFilterClass] = useState<string>('Semua Kelas');
  const [filterStatus, setFilterStatus] = useState<string>('Semua Status'); // 'Semua Status' | 'Juara Saja' | 'Peserta'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Dropdown States
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CompetitionEvent | null>(null);
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CompetitionEvent | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<CompetitionParticipant | null>(null);
  const [selectedParticipantForPiagam, setSelectedParticipantForPiagam] = useState<CompetitionParticipant | null>(null);
  const [showBeritaAcaraModal, setShowBeritaAcaraModal] = useState(false);

  // Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState('Fashion Show');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventAcademicYear, setEventAcademicYear] = useState('2025/2026');
  const [eventBaNumber, setEventBaNumber] = useState('042/BA-JURI/RA-DS/2026');
  const [eventLocation, setEventLocation] = useState('Panggung Utama RA Darusyifa Arjawinangun');
  const [eventCriteria, setEventCriteria] = useState('Kesesuaian Busana, Catwalk / Kelincahan, Ekspresi / Percaya Diri, dan Kerapihan');
  const [eventDescription, setEventDescription] = useState('');
  const [eventTheme, setEventTheme] = useState('Busana Muslim Anak Ceria & Berkarakter Qurani');
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setShowStatusDropdown(false);
      setShowEventDropdown(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

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
  }, [selectedEventId]);

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

  const displayEvents = events.length > 0 ? events : [DEFAULT_FASHION_SHOW_EVENT];
  const activeDisplayEvent = currentEvent || DEFAULT_FASHION_SHOW_EVENT;
  const displayParticipants = (events.length === 0 && participants.length === 0) 
    ? DEFAULT_FASHION_SHOW_PARTICIPANTS 
    : participants;

  const isTeacherAllowed = activeDisplayEvent?.allowTeacherScoring === true;
  const canScore = currentUserRole === 'admin' || (currentUserRole === 'guru' && isTeacherAllowed);
  const canManageEvent = currentUserRole === 'admin';

  // Seed / Sync Fashion Show with all 56 participants and official Berita Acara metadata
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
        ? '✓ HASIL LOMBA TELAH DIPUBLIKASIKAN (LIVE)!\n\nRekap nilai, peringkat juara, dan cetak piagam ananda kini sudah AKTIF di dashboard Siswa dan Guru.' 
        : '✓ STATUS PUBLIKASI DITARIK (DRAFT).\n\nHasil lomba kini DISEMBUNYIKAN dari akun Siswa dan Guru (Hanya Admin yang dapat melihat dan mengelola).'
      );
    } catch (err) {
      console.error('Error toggling publish status:', err);
      alert('Gagal memperbarui status publikasi.');
    }
  };

  // Toggle teacher scoring permission directly (Admin only)
  const handleToggleTeacherScoring = async () => {
    if (currentUserRole !== 'admin') return;
    const targetEvent = currentEvent || events.find(e => e.id === selectedEventId);
    if (!targetEvent) {
      alert('Event lomba belum tersimpan di database.');
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

  // Open Event Modal for Create / Edit
  const handleOpenEventModal = (eventToEdit?: CompetitionEvent) => {
    if (eventToEdit) {
      setEditingEvent(eventToEdit);
      setEventTitle(eventToEdit.title);
      setEventCategory(eventToEdit.category);
      setEventDate(eventToEdit.date);
      setEventAcademicYear(eventToEdit.academicYear);
      setEventBaNumber(eventToEdit.baNumber || '042/BA-JURI/RA-DS/2026');
      setEventLocation(eventToEdit.location || 'Panggung Utama RA Darusyifa Arjawinangun');
      setEventCriteria(eventToEdit.criteria || 'Kesesuaian Busana, Catwalk / Kelincahan, Ekspresi / Percaya Diri, dan Kerapihan');
      setEventDescription(eventToEdit.description || '');
      setEventTheme(eventToEdit.theme || 'Busana Muslim Anak Ceria & Berkarakter Qurani');
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
      setEventAcademicYear('2026/2027');
      setEventBaNumber(`0${events.length + 43}/BA-JURI/RA-DS/2026`);
      setEventLocation('Panggung Utama RA Darusyifa Arjawinangun');
      setEventCriteria('Kesesuaian Busana, Catwalk / Kelincahan, Ekspresi / Percaya Diri, dan Kerapihan');
      setEventDescription('');
      setEventTheme('Busana Muslim Anak Ceria & Berkarakter Qurani');
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

  // Save Event (Create / Edit)
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
        baNumber: eventBaNumber.trim(),
        location: eventLocation.trim(),
        criteria: eventCriteria.trim(),
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
        alert('Event lomba baru berhasil dibuat!');
      }
      setShowEventModal(false);
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Gagal menyimpan event.');
    }
  };

  // Delete Event with Confirmation Modal
  const confirmDeleteEvent = (ev: CompetitionEvent) => {
    setEventToDelete(ev);
    setShowDeleteEventModal(true);
  };

  const handleExecuteDeleteEvent = async () => {
    if (!eventToDelete) return;
    setIsDeletingEvent(true);
    try {
      // 1. Delete all participants belonging to this event
      const qPart = query(collection(db, 'competition_participants'), where('eventId', '==', eventToDelete.id));
      const snap = await getDocs(qPart);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'competition_participants', d.id));
      }

      // 2. Delete event doc
      await deleteDoc(doc(db, 'competition_events', eventToDelete.id));

      // 3. Switch selectedEventId
      const remaining = events.filter(e => e.id !== eventToDelete.id);
      if (remaining.length > 0) {
        setSelectedEventId(remaining[0].id);
      } else {
        setSelectedEventId('');
      }

      setShowDeleteEventModal(false);
      setEventToDelete(null);
      alert(`Event "${eventToDelete.title}" dan seluruh data pesertanya berhasil dihapus.`);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Gagal menghapus event lomba.');
    } finally {
      setIsDeletingEvent(false);
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

  // Save Participant
  const handleSaveParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partStudentName.trim()) {
      alert('Nama peserta wajib diisi.');
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

  // Filtered Participants
  const filteredParticipants = useMemo(() => {
    return displayParticipants.filter(p => {
      // Class Filter
      if (filterClass !== 'Semua Kelas') {
        const pClass = (p.kelas || '').toLowerCase();
        const fClass = filterClass.toLowerCase().replace('kelas ', '');
        if (!pClass.includes(fClass)) return false;
      }
      // Status Filter
      if (filterStatus === 'Juara Saja') {
        const isWinner = (p.rank && p.rank <= 3) || (p.award && p.award.toUpperCase().includes('JUARA'));
        if (!isWinner) return false;
      } else if (filterStatus === 'Peserta') {
        const isWinner = (p.rank && p.rank <= 3) || (p.award && p.award.toUpperCase().includes('JUARA'));
        if (isWinner) return false;
      }
      // Search Query
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
  }, [displayParticipants, filterClass, filterStatus, searchQuery]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterClass, filterStatus, searchQuery, selectedEventId]);

  // Paginated data
  const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / itemsPerPage));
  const paginatedParticipants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredParticipants.slice(start, start + itemsPerPage);
  }, [filteredParticipants, currentPage, itemsPerPage]);

  // Top 3 Podium
  const top1 = displayParticipants.find(p => p.rank === 1) || displayParticipants[0] || null;
  const top2 = displayParticipants.find(p => p.rank === 2) || displayParticipants[1] || null;
  const top3 = displayParticipants.find(p => p.rank === 3) || displayParticipants[2] || null;

  // Stats calculation
  const totalParticipantsCount = displayParticipants.length;
  const totalWinnersCount = displayParticipants.filter(p => (p.rank && p.rank <= 3) || (p.award && p.award.toUpperCase().includes('JUARA'))).length || 3;
  const highestScore = useMemo(() => {
    if (displayParticipants.length === 0) return '94,8';
    const max = Math.max(...displayParticipants.map(p => p.averageScore || 0));
    return max > 0 ? max.toFixed(1).replace('.', ',') : '94,8';
  }, [displayParticipants]);
  const totalCertificatesReady = displayParticipants.length;

  // Export Data to CSV
  const handleExportCSV = () => {
    if (filteredParticipants.length === 0) {
      alert('Tidak ada data peserta untuk di-export.');
      return;
    }

    const headers = ['Peringkat', 'No. Urut', 'Nama Siswa', 'NIS', 'Kelas', 'Gender', 'Kategori', 'Skor Rata-Rata', 'Gelar Penghargaan', 'Nomor Piagam'];
    const rows = filteredParticipants.map((p, idx) => [
      p.rank || idx + 1,
      `"${p.noUrut || ''}"`,
      `"${p.studentName}"`,
      `"${p.nis || ''}"`,
      `"${p.kelas}"`,
      `"${p.gender || ''}"`,
      `"${p.groupCategory || ''}"`,
      p.averageScore ? p.averageScore.toFixed(2) : '0.00',
      `"${p.award || ''}"`,
      `"${p.certificateNumber || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Hasil_Lomba_${activeDisplayEvent.title.replace(/\s+/g, '_')}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPublished = activeDisplayEvent?.isPublished !== false;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 max-w-7xl mx-auto">
      
      {/* ============================================================ */}
      {/* 1. TOP HEADER & EVENT / STATUS SELECTOR (MATCHING MOCKUP)   */}
      {/* ============================================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Hasil Lomba & Piagam
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Kelola penilaian, peringkat peserta, berita acara dan piagam penghargaan.
          </p>
        </div>

        {/* Top Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Event Selector Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEventDropdown(!showEventDropdown);
                setShowStatusDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 border border-amber-200/80 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Trophy size={16} className="text-amber-600 shrink-0" />
              <span className="font-extrabold truncate max-w-[220px] sm:max-w-[280px]">
                {activeDisplayEvent.title} ({activeDisplayEvent.academicYear})
              </span>
              <ChevronDown size={15} className="text-amber-700 shrink-0" />
            </button>

            {/* Event Dropdown Menu */}
            {showEventDropdown && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95"
              >
                <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Pilih Event Lomba
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {displayEvents.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => {
                        setSelectedEventId(ev.id);
                        setShowEventDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        ev.id === activeDisplayEvent.id ? 'bg-amber-50/80 font-bold text-amber-900' : 'text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="truncate font-bold">{ev.title}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{ev.academicYear} • {ev.category}</p>
                      </div>
                      {ev.id === activeDisplayEvent.id && (
                        <Check size={15} className="text-amber-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {currentUserRole === 'admin' && (
                  <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                    <button
                      onClick={() => {
                        setShowEventDropdown(false);
                        handleOpenEventModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <Plus size={14} />
                      <span>Buat Event Lomba Baru</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Badge Dropdown: LIVE / DRAFT + Ubah Status */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusDropdown(!showStatusDropdown);
                setShowEventDropdown(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${
                isPublished
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${isPublished ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-amber-500 ring-4 ring-amber-100'}`} />
              <div className="text-left">
                <span className="font-black">{isPublished ? 'LIVE' : 'DRAFT'}</span>
                <span className="text-[10px] text-slate-500 hidden sm:inline ml-1">
                  - {isPublished ? 'Sudah Dipublikasikan' : 'Disembunyikan'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold ml-1 flex items-center gap-0.5">
                Ubah Status <ChevronDown size={13} />
              </span>
            </button>

            {/* Status & Event Management Dropdown Menu */}
            {showStatusDropdown && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95"
              >
                <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Status Publikasi Siswa & Guru
                </div>

                {currentUserRole === 'admin' ? (
                  <>
                    <button
                      onClick={() => {
                        setShowStatusDropdown(false);
                        handleTogglePublish();
                      }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center justify-between text-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <div>
                          <p className="font-bold">Publikasikan (LIVE)</p>
                          <p className="text-[10px] text-slate-500">Tampil di dashboard Siswa & Guru</p>
                        </div>
                      </div>
                      {isPublished && <Check size={15} className="text-emerald-600" />}
                    </button>

                    <button
                      onClick={() => {
                        setShowStatusDropdown(false);
                        handleTogglePublish();
                      }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center justify-between text-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <div>
                          <p className="font-bold">Jadikan DRAFT</p>
                          <p className="text-[10px] text-slate-500">Sembunyikan dari Siswa & Guru</p>
                        </div>
                      </div>
                      {!isPublished && <Check size={15} className="text-amber-600" />}
                    </button>

                    <div className="border-t border-slate-100 my-1 pt-1 px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Kelola Event Lomba Ini
                    </div>

                    <button
                      onClick={() => {
                        setShowStatusDropdown(false);
                        handleOpenEventModal(activeDisplayEvent);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                    >
                      <Edit size={14} className="text-amber-600" />
                      <span>Edit Info Event Lomba</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowStatusDropdown(false);
                        confirmDeleteEvent(activeDisplayEvent);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
                    >
                      <Trash2 size={14} className="text-rose-500" />
                      <span>Hapus Event Lomba Ini</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowStatusDropdown(false);
                        handleOpenEventModal();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5"
                    >
                      <Plus size={14} className="text-emerald-600" />
                      <span>Tambah Event Lomba Baru</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowStatusDropdown(false);
                        handleSeedDefaultData();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 flex items-center gap-2.5"
                    >
                      <RefreshCw size={14} className="text-blue-600" />
                      <span>Sinkron Data Berita Acara (56 Peserta)</span>
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-2 text-xs text-slate-500">
                    Hanya Admin yang dapat mengubah status publikasi dan mengelola event.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. STAT CARDS ROW (4 CARDS MATCHING MOCKUP)                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {/* Stat 1: Peserta */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <Users size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
              {totalParticipantsCount}
            </p>
            <p className="text-xs font-bold text-slate-800 mt-1">Peserta</p>
            <p className="text-[10.5px] text-slate-400 font-medium">Total peserta lomba</p>
          </div>
        </div>

        {/* Stat 2: Pemenang */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <Trophy size={22} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
              {totalWinnersCount}
            </p>
            <p className="text-xs font-bold text-slate-800 mt-1">Pemenang</p>
            <p className="text-[10.5px] text-slate-400 font-medium">Juara 1, 2 dan 3</p>
          </div>
        </div>

        {/* Stat 3: Nilai Tertinggi */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
            <Star size={22} className="text-blue-600 fill-blue-500" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
              {highestScore}
            </p>
            <p className="text-xs font-bold text-slate-800 mt-1">Nilai Tertinggi</p>
            <p className="text-[10.5px] text-slate-400 font-medium">Nilai tertinggi lomba</p>
          </div>
        </div>

        {/* Stat 4: Piagam */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
            <Award size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
              {totalCertificatesReady}
            </p>
            <p className="text-xs font-bold text-slate-800 mt-1">Piagam</p>
            <p className="text-[10.5px] text-slate-400 font-medium">Siap dicetak & dibagikan</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. SUB-TABS NAVIGATION (MATCHING MOCKUP)                     */}
      {/* ============================================================ */}
      <div className="border-b border-slate-200 flex items-center gap-6 sm:gap-8 overflow-x-auto text-xs font-bold pt-2">
        <button
          onClick={() => setActiveSubTab('hasil')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'hasil'
              ? 'border-emerald-700 text-emerald-800 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy size={16} />
          <span>Hasil Lomba</span>
        </button>

        <button
          onClick={() => setActiveSubTab('piagam')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'piagam'
              ? 'border-emerald-700 text-emerald-800 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={16} />
          <span>Piagam</span>
        </button>

        <button
          onClick={() => setActiveSubTab('berita_acara')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'berita_acara'
              ? 'border-emerald-700 text-emerald-800 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet size={16} />
          <span>Berita Acara</span>
        </button>

        {currentUserRole === 'admin' && (
          <button
            onClick={() => setActiveSubTab('pengaturan')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'pengaturan'
                ? 'border-emerald-700 text-emerald-800 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings size={16} />
            <span>Pengaturan</span>
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. TAB 1 CONTENT: HASIL LOMBA (PODIUM & LEADERBOARD TABLE)   */}
      {/* ============================================================ */}
      {activeSubTab === 'hasil' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Top 3 Podium Cards (Desktop 3-Column / Mobile Responsive) */}
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 md:hidden">
              Top 3 Pemenang
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
              
              {/* Juara 2 (Left - Silver Card) */}
              <div 
                onClick={() => top2 && setSelectedParticipantForPiagam(top2)}
                className="bg-gradient-to-b from-blue-50/40 via-white to-slate-50/50 p-6 rounded-3xl border-2 border-blue-100 shadow-xs relative overflow-hidden flex flex-col justify-between items-center text-center group hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
              >
                {/* Silver Ribbon Badge */}
                <div className="absolute top-3 left-4 flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 border-2 border-slate-300 text-slate-700 font-black text-xs shadow-xs">
                  2
                </div>

                <div className="pt-2 flex flex-col items-center">
                  <div className="relative mb-3">
                    <StudentAvatar 
                      name={top2?.studentName || 'Safira Nadya Wijaya'} 
                      gender={top2?.gender} 
                      size="lg" 
                      className="ring-4 ring-slate-100 shadow-sm"
                    />
                  </div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {top2?.studentName || 'Safira Nadya Wijaya'}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {top2?.kelas ? top2.kelas.replace('Kelas ', '') : 'Utsman Bin Affan'}
                  </p>
                </div>

                <div className="mt-5 w-full flex justify-center">
                  <div className="px-6 py-1.5 bg-blue-50 border border-blue-200/80 rounded-full text-sm font-black text-blue-700 shadow-xs group-hover:scale-105 transition-transform">
                    {top2?.averageScore ? top2.averageScore.toFixed(1).replace('.', ',') : '93,7'}
                  </div>
                </div>
              </div>

              {/* Juara 1 (Center - Gold Card Highlighted) */}
              <div 
                onClick={() => top1 && setSelectedParticipantForPiagam(top1)}
                className="bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 p-6 rounded-3xl border-2 border-amber-300 shadow-sm relative overflow-hidden flex flex-col justify-between items-center text-center group hover:shadow-lg hover:border-amber-400 transition-all cursor-pointer md:-mt-2"
              >
                {/* Gold Ribbon Badge */}
                <div className="absolute top-3 left-4 flex items-center justify-center w-9 h-9 rounded-full bg-amber-400 border-2 border-amber-300 text-amber-950 font-black text-sm shadow-xs">
                  1
                </div>

                <div className="pt-1 flex flex-col items-center">
                  <div className="relative mb-3">
                    <StudentAvatar 
                      name={top1?.studentName || 'Dayfa Naraya Safna'} 
                      gender={top1?.gender} 
                      size="xl" 
                      className="ring-4 ring-amber-200 shadow-md"
                    />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {top1?.studentName || 'Dayfa Naraya Safna'}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {top1?.kelas ? top1.kelas.replace('Kelas ', '') : 'Utsman Bin Affan'}
                  </p>
                </div>

                <div className="mt-5 w-full flex justify-center">
                  <div className="px-7 py-2 bg-amber-100 border border-amber-300 rounded-full text-base font-black text-amber-900 shadow-xs group-hover:scale-105 transition-transform">
                    {top1?.averageScore ? top1.averageScore.toFixed(1).replace('.', ',') : '94,8'}
                  </div>
                </div>
              </div>

              {/* Juara 3 (Right - Bronze Card) */}
              <div 
                onClick={() => top3 && setSelectedParticipantForPiagam(top3)}
                className="bg-gradient-to-b from-orange-50/40 via-white to-slate-50/50 p-6 rounded-3xl border-2 border-orange-100 shadow-xs relative overflow-hidden flex flex-col justify-between items-center text-center group hover:shadow-md hover:border-orange-200 transition-all cursor-pointer"
              >
                {/* Bronze Ribbon Badge */}
                <div className="absolute top-3 left-4 flex items-center justify-center w-8 h-8 rounded-full bg-orange-300 border-2 border-orange-200 text-orange-950 font-black text-xs shadow-xs">
                  3
                </div>

                <div className="pt-2 flex flex-col items-center">
                  <div className="relative mb-3">
                    <StudentAvatar 
                      name={top3?.studentName || 'Azka Zalina'} 
                      gender={top3?.gender} 
                      size="lg" 
                      className="ring-4 ring-orange-100 shadow-sm"
                    />
                  </div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {top3?.studentName || 'Azka Zalina'}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {top3?.kelas ? top3.kelas.replace('Kelas ', '') : 'Umar Bin Khattab'}
                  </p>
                </div>

                <div className="mt-5 w-full flex justify-center">
                  <div className="px-6 py-1.5 bg-orange-50 border border-orange-200/80 rounded-full text-sm font-black text-orange-800 shadow-xs group-hover:scale-105 transition-transform">
                    {top3?.averageScore ? top3.averageScore.toFixed(1).replace('.', ',') : '92,9'}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Main Table: Peringkat Peserta */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            
            {/* Table Filter & Search Controls Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Users size={20} className="text-emerald-700" />
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Peringkat Peserta
                </h2>
              </div>

              {/* Search, Filter & Export */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="relative flex-1 sm:w-56 min-w-[160px]">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari peserta..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* Filter Kelas */}
                <div className="relative">
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                  >
                    <option value="Semua Kelas">Semua Kelas</option>
                    <option value="Utsman bin Affan">Utsman Bin Affan</option>
                    <option value="Umar bin Khattab">Umar Bin Khattab</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Filter Status */}
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                  >
                    <option value="Semua Status">Semua Status</option>
                    <option value="Juara Saja">Juara Saja</option>
                    <option value="Peserta">Peserta</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  title="Export data peringkat ke format CSV/Excel"
                >
                  <Download size={14} />
                  <span>Export</span>
                </button>

                {/* Input Nilai / Tambah Peserta */}
                {canScore && (
                  <button
                    onClick={() => handleOpenParticipantModal()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>+ Input Nilai</span>
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-500 font-bold text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-16">Rank</th>
                    <th className="py-3.5 px-4">Peserta</th>
                    <th className="py-3.5 px-4">Kelas</th>
                    <th className="py-3.5 px-4 text-center">Nilai Akhir</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Piagam</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Trophy size={32} className="mx-auto mb-2 opacity-30 text-slate-400" />
                        <p className="font-bold">Tidak ada data peserta ditemukan</p>
                        <p className="text-[11px] mt-0.5">Ubah kata kunci pencarian atau filter kelas.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedParticipants.map((p, idx) => {
                      const rankNum = p.rank || ((currentPage - 1) * itemsPerPage + idx + 1);
                      const isJuara1 = rankNum === 1;
                      const isJuara2 = rankNum === 2;
                      const isJuara3 = rankNum === 3;

                      return (
                        <tr 
                          key={p.id} 
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          {/* Rank */}
                          <td className="py-3.5 px-4 text-center">
                            {isJuara1 ? (
                              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-xs">
                                1
                              </div>
                            ) : isJuara2 ? (
                              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-black text-xs shadow-xs">
                                2
                              </div>
                            ) : isJuara3 ? (
                              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-300 text-orange-950 font-black text-xs shadow-xs">
                                3
                              </div>
                            ) : (
                              <span className="font-bold text-slate-600 text-xs">
                                {rankNum}
                              </span>
                            )}
                          </td>

                          {/* Peserta (Avatar + Name) */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <StudentAvatar name={p.studentName} gender={p.gender} size="sm" />
                              <div>
                                <p className="font-bold text-slate-900 text-xs">
                                  {p.studentName}
                                </p>
                                {p.noUrut && (
                                  <p className="text-[10.5px] text-slate-400 font-mono">
                                    {p.noUrut} {p.nis ? `• NIS: ${p.nis}` : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Kelas */}
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {p.kelas ? p.kelas.replace('Kelas ', '') : '-'}
                          </td>

                          {/* Nilai Akhir */}
                          <td className="py-3.5 px-4 text-center font-black text-slate-900 text-xs">
                            {p.averageScore ? p.averageScore.toFixed(1).replace('.', ',') : '-'}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            {isJuara1 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-200">
                                🏆 JUARA 1
                              </span>
                            ) : isJuara2 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-800 border border-slate-200">
                                🥈 JUARA 2
                              </span>
                            ) : isJuara3 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-900 border border-orange-200">
                                🥉 JUARA 3
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200">
                                {p.award || 'Peserta'}
                              </span>
                            )}
                          </td>

                          {/* Piagam Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>Siap</span>
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Preview Piagam Modal */}
                              <button
                                onClick={() => setSelectedParticipantForPiagam(p)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Lihat Piagam"
                              >
                                <Eye size={15} />
                              </button>

                              {/* Cetak Piagam */}
                              <button
                                onClick={() => setSelectedParticipantForPiagam(p)}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Cetak Piagam"
                              >
                                <Printer size={15} />
                              </button>

                              {/* Edit Participant / Nilai */}
                              {canScore && (
                                <button
                                  onClick={() => handleOpenParticipantModal(p)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Nilai"
                                >
                                  <Edit size={14} />
                                </button>
                              )}

                              {/* Delete Participant (Admin Only) */}
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

            {/* Pagination Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Menampilkan {filteredParticipants.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredParticipants.length)} dari {filteredParticipants.length} peserta
              </div>

              {/* Page Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-emerald-700 text-white'
                            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                  }
                  return null;
                })}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* 5. TAB 2: PIAGAM GALLERY & PRINT PREVIEWS                   */}
      {/* ============================================================ */}
      {activeSubTab === 'piagam' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Award size={22} className="text-amber-600" />
                <span>Galeri & Pencetakan Piagam Penghargaan</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Pilih peserta untuk melihat dan mencetak piagam ber-barcode resmi dengan format resolusi cetak A4.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (displayParticipants.length > 0) {
                    setSelectedParticipantForPiagam(displayParticipants[0]);
                  }
                }}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-2xl shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Printer size={15} />
                <span>Cetak Semua Piagam</span>
              </button>
            </div>
          </div>

          {/* Certificate Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayParticipants.map((p, idx) => {
              const rankNum = p.rank || idx + 1;
              const isWinner = rankNum <= 3;

              return (
                <div 
                  key={p.id}
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md hover:border-amber-200 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <StudentAvatar name={p.studentName} gender={p.gender} size="md" />
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm">
                          {p.studentName}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {p.kelas ? p.kelas.replace('Kelas ', '') : '-'} • {p.noUrut}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      rankNum === 1 ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                      rankNum === 2 ? 'bg-slate-100 text-slate-800 border border-slate-200' :
                      rankNum === 3 ? 'bg-orange-100 text-orange-900 border border-orange-200' :
                      'bg-emerald-50 text-emerald-800'
                    }`}>
                      {p.award || `Rank #${rankNum}`}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Nilai Skor</p>
                      <p className="text-base font-black text-slate-900">
                        {p.averageScore ? p.averageScore.toFixed(1).replace('.', ',') : '-'}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedParticipantForPiagam(p)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>Buka Piagam</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. TAB 3: BERITA ACARA PREVIEW                               */}
      {/* ============================================================ */}
      {activeSubTab === 'berita_acara' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg uppercase">
                  DOKUMEN RESMI DEWAN JURI
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-mono text-slate-500 font-bold">
                  No: {activeDisplayEvent.baNumber || '042/BA-JURI/RA-DS/2026'}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Berita Acara Penilaian & Rekapitulasi Nilai
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Dokumen pengesahan nilai lomba lengkap dengan stempel digital Kepala RA dan tanda tangan Dewan Juri.
              </p>
            </div>

            <button
              onClick={() => setShowBeritaAcaraModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              <Printer size={16} />
              <span>Cetak & Download Berita Acara (PDF)</span>
            </button>
          </div>

          {/* Quick Summary Preview */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Informasi Pelaksanaan</p>
                <p className="font-extrabold text-slate-800 text-sm">{activeDisplayEvent.title}</p>
                <p className="text-slate-600 mt-1">Tanggal: {activeDisplayEvent.dateFormatted || activeDisplayEvent.date}</p>
                <p className="text-slate-600">Lokasi: {activeDisplayEvent.location || 'Panggung Utama RA Darusyifa Arjawinangun'}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Pengesahan Dokumen</p>
                <p className="font-extrabold text-slate-800 text-sm">Dewan Juri: {activeDisplayEvent.juryName}</p>
                <p className="text-slate-600 mt-1">Kepala RA: {activeDisplayEvent.headmasterName}</p>
                <p className="text-slate-600">{activeDisplayEvent.headmasterNip || 'NPK: 8950490276014'}</p>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={() => setShowBeritaAcaraModal(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 cursor-pointer"
              >
                <span>Klik di sini untuk melihat tampilan lembar cetak Berita Acara lengkap</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. TAB 4: PENGATURAN & KELOLA EVENT (EDIT & DELETE)          */}
      {/* ============================================================ */}
      {activeSubTab === 'pengaturan' && currentUserRole === 'admin' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Event Details & Action Buttons */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sliders size={20} className="text-emerald-700" />
                  <span>Pengaturan & Kelola Event Lomba</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ubah informasi event, kriteria lomba, penandatangan piagam, atau hapus event.
                </p>
              </div>

              {/* Action Buttons: Edit, Delete, New */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenEventModal(activeDisplayEvent)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Edit size={14} />
                  <span>Edit Event Ini</span>
                </button>

                <button
                  onClick={() => confirmDeleteEvent(activeDisplayEvent)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Hapus Event</span>
                </button>

                <button
                  onClick={() => handleOpenEventModal()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Event Baru</span>
                </button>
              </div>
            </div>

            {/* Current Event Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-black text-slate-800 uppercase tracking-wider text-[10px]">
                  Detail Lomba
                </p>
                <div>
                  <p className="text-slate-400 font-semibold">Judul Event:</p>
                  <p className="font-black text-slate-900 text-sm">{activeDisplayEvent.title}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Kategori & Tahun Ajaran:</p>
                  <p className="font-bold text-slate-800">{activeDisplayEvent.category} • {activeDisplayEvent.academicYear}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Tema Lomba:</p>
                  <p className="font-medium text-slate-700">{activeDisplayEvent.theme || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Kriteria Penilaian:</p>
                  <p className="font-medium text-slate-700">{activeDisplayEvent.criteria || '-'}</p>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-black text-slate-800 uppercase tracking-wider text-[10px]">
                  Penandatangan & Otoritas
                </p>
                <div>
                  <p className="text-slate-400 font-semibold">Dewan Juri / Penilai:</p>
                  <p className="font-black text-slate-900 text-sm">{activeDisplayEvent.juryName}</p>
                  <p className="text-slate-500">{activeDisplayEvent.juryTitle || 'Praktisi & Penilai Busana'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Kepala RA Darusyifa:</p>
                  <p className="font-black text-slate-900 text-sm">{activeDisplayEvent.headmasterName}</p>
                  <p className="text-slate-500">{activeDisplayEvent.headmasterNip || 'NPK: 8950490276014'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Nomor Berita Acara:</p>
                  <p className="font-mono font-bold text-emerald-800">{activeDisplayEvent.baNumber || '042/BA-JURI/RA-DS/2026'}</p>
                </div>
              </div>
            </div>

            {/* Teacher Permission & Sync Tools */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleTeacherScoring}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-colors cursor-pointer ${
                    activeDisplayEvent?.allowTeacherScoring
                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {activeDisplayEvent?.allowTeacherScoring ? <Unlock size={15} /> : <Lock size={15} />}
                  <span>Izin Nilai Guru: <strong>{activeDisplayEvent?.allowTeacherScoring ? 'Bisa Menilai (ON)' : 'Terkunci (OFF)'}</strong></span>
                </button>

                <button
                  onClick={handleTogglePublish}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-colors cursor-pointer ${
                    isPublished
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  {isPublished ? <Globe size={15} /> : <EyeOff size={15} />}
                  <span>Status Publikasi: <strong>{isPublished ? 'LIVE' : 'DRAFT'}</strong></span>
                </button>
              </div>

              <button
                onClick={handleSeedDefaultData}
                disabled={isSeeding}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw size={14} className={isSeeding ? 'animate-spin' : ''} />
                <span>Sinkron Ulang Berita Acara (56 Peserta)</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* 8. MOBILE STICKY BOTTOM ACTIONS (MATCHING MOCKUP)           */}
      {/* ============================================================ */}
      <div className="md:hidden fixed bottom-3 left-4 right-4 z-40 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between gap-2">
        <button
          onClick={handleExportCSV}
          className="flex-1 py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <FileText size={14} />
          <span>Export Data</span>
        </button>

        <button
          onClick={() => {
            if (displayParticipants.length > 0) {
              setSelectedParticipantForPiagam(displayParticipants[0]);
            }
          }}
          className="flex-1 py-2 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
        >
          <Printer size={14} />
          <span>Cetak Piagam</span>
        </button>

        <button
          onClick={() => setShowBeritaAcaraModal(true)}
          className="flex-1 py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <FileSpreadsheet size={14} />
          <span>Berita Acara</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 9. MODAL: EDIT / TAMBAH EVENT LOMBA                          */}
      {/* ============================================================ */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
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
                  <label className="block font-bold text-slate-700 mb-1">Nomor Berita Acara</label>
                  <input
                    type="text"
                    value={eventBaNumber}
                    onChange={(e) => setEventBaNumber(e.target.value)}
                    placeholder="042/BA-JURI/RA-DS/2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tema Lomba</label>
                <input
                  type="text"
                  value={eventTheme}
                  onChange={(e) => setEventTheme(e.target.value)}
                  placeholder="Busana Muslim Anak Ceria & Berkarakter Qurani"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kriteria Penilaian</label>
                <input
                  type="text"
                  value={eventCriteria}
                  onChange={(e) => setEventCriteria(e.target.value)}
                  placeholder="Kesesuaian Busana, Catwalk / Kelincahan, Ekspresi, Kerapihan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="font-extrabold text-amber-800 uppercase tracking-wider text-[10px] mb-2">
                  Penandatangan Piagam (TTD Digital)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Juri</label>
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

                {/* Status Publikasi */}
                <div className="mt-3.5 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <label className="block font-extrabold text-slate-800 text-xs">
                      Publikasikan Hasil ke Siswa & Guru
                    </label>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      {eventIsPublished
                        ? 'Aktif: Nilai, peringkat, dan piagam langsung muncul di akun Siswa & Guru.'
                        : 'Draft: Disembunyikan (Hanya Admin yang dapat mengelola).'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEventIsPublished(!eventIsPublished)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
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

      {/* ============================================================ */}
      {/* 10. MODAL: KONFIRMASI HAPUS EVENT                            */}
      {/* ============================================================ */}
      {showDeleteEventModal && eventToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Hapus Event Lomba?
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900">
              <p className="font-bold">Event yang akan dihapus:</p>
              <p className="font-extrabold text-sm mt-0.5">{eventToDelete.title}</p>
              <p className="text-[11px] text-rose-700 mt-2">
                ⚠️ Seluruh data nilai peserta dan rekapitulasi yang terkait dengan event ini akan ikut terhapus dari database.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteEventModal(false);
                  setEventToDelete(null);
                }}
                disabled={isDeletingEvent}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteEvent}
                disabled={isDeletingEvent}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer"
              >
                {isDeletingEvent ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>Ya, Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 11. MODAL: INPUT / EDIT PESERTA & NILAI                      */}
      {/* ============================================================ */}
      {showParticipantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
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

              {/* Scoring */}
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
                    'HARAPAN 3',
                    'PESERTA BERBAKAT FASHION SHOW', 
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

      {/* ============================================================ */}
      {/* 12. PIAGAM MODAL                                             */}
      {/* ============================================================ */}
      {selectedParticipantForPiagam && (
        <PiagamModal
          participant={selectedParticipantForPiagam}
          event={activeDisplayEvent}
          onClose={() => setSelectedParticipantForPiagam(null)}
          schoolSettings={schoolSettings}
        />
      )}

      {/* ============================================================ */}
      {/* 13. BERITA ACARA MODAL                                       */}
      {/* ============================================================ */}
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
