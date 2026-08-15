import React, { useState } from 'react';
import { 
 format, 
 addMonths, 
 subMonths, 
 startOfMonth, 
 endOfMonth, 
 startOfWeek, 
 endOfWeek, 
 isSameMonth, 
 isSameDay, 
 addDays, 
 eachDayOfInterval,
 isWeekend
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KaldikEvent } from '../types';

interface KaldikCalendarProps {
 events: KaldikEvent[];
 isAdmin?: boolean;
 onAddEvent?: (date: Date) => void;
 onEditEvent?: (event: KaldikEvent) => void;
 onDeleteEvent?: (id: string) => void;
}

const KaldikCalendar: React.FC<KaldikCalendarProps> = ({ 
 events, 
 isAdmin, 
 onAddEvent, 
 onEditEvent, 
 onDeleteEvent 
}) => {
 const [currentMonth, setCurrentMonth] = useState(new Date());
 const [selectedDate, setSelectedDate] = useState(new Date());

 const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
 const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

 const renderHeader = () => {
 return (
 <div className="flex items-center justify-between px-2 mb-8">
 <div>
 <h2 className="text-3xl font-black text-slate-800 tracking-tight capitalize">
 {format(currentMonth, 'MMMM yyyy', { locale: localeId })}
 </h2>
 <p className="text-slate-400 text-sm font-medium mt-1">Agenda & Kalender Pendidikan RA Darusyifa</p>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={prevMonth}
 className="p-3 hover:bg-slate-100 rounded-2xl transition-all border border-transparent hover:border-slate-200 active:scale-95"
 >
 <ChevronLeft size={24} className="text-slate-600" />
 </button>
 <button 
 onClick={() => setCurrentMonth(new Date())}
 className="px-4 py-2 text-sm font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
 >
 Hari Ini
 </button>
 <button 
 onClick={nextMonth}
 className="p-3 hover:bg-slate-100 rounded-2xl transition-all border border-transparent hover:border-slate-200 active:scale-95"
 >
 <ChevronRight size={24} className="text-slate-600" />
 </button>
 </div>
 </div>
 );
 };

 const renderDays = () => {
 const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
 return (
 <div className="grid grid-cols-7 mb-2">
 {days.map((day, i) => (
 <div key={i} className="text-center py-4">
 <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${i === 0 ? 'text-rose-500' : 'text-slate-400'}`}>
 {day}
 </span>
 </div>
 ))}
 </div>
 );
 };

 const renderCells = () => {
 const monthStart = startOfMonth(currentMonth);
 const monthEnd = endOfMonth(monthStart);
 const startDate = startOfWeek(monthStart);
 const endDate = endOfWeek(monthEnd);

 const rows = [];
 let days = [];
 let day = startDate;

 const allDays = eachDayOfInterval({ start: startDate, end: endDate });

 return (
 <div className="grid grid-cols-7 gap-1 md:gap-3">
 {allDays.map((date, i) => {
 const isSelected = isSameDay(date, selectedDate);
 const isCurrentMonth = isSameMonth(date, monthStart);
 const isToday = isSameDay(date, new Date());
 const dateStr = format(date, 'yyyy-MM-dd');
 
 const dayEvents = events.filter(e => e.date === dateStr);
 const holiday = dayEvents.find(e => e.type === 'Libur');
 const isWeekendDay = isWeekend(date);

 return (
 <motion.div
 key={i}
 whileHover={{ y: -2 }}
 onClick={() => setSelectedDate(date)}
 className={`
 relative min-h-[80px] md:min-h-[120px] p-2 md:p-4 rounded-[1.5rem] cursor-pointer transition-all border-2
 ${!isCurrentMonth ? 'opacity-20 bg-slate-50/50' : 'bg-white shadow-sm'}
 ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-50 hover:border-slate-200'}
 ${isToday ? 'bg-indigo-50/30' : ''}
 `}
 >
 <div className="flex justify-between items-start">
 <span className={`
 text-lg font-black 
 ${isToday ? 'text-indigo-600' : ''}
 ${(holiday || (isWeekendDay && isCurrentMonth)) ? 'text-rose-500' : 'text-slate-800 '}
 ${!isCurrentMonth ? 'text-slate-400' : ''}
 `}>
 {format(date, 'd')}
 </span>
 {isToday && (
 <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-200"></div>
 )}
 </div>

 <div className="mt-2 space-y-1">
 {dayEvents.slice(0, 2).map((event, idx) => (
 <div 
 key={event.id}
 className={`
 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight truncate border
 ${event.type === 'Libur' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
 event.type === 'Ujian' ? 'bg-amber-50 text-amber-600 border-amber-100' :
 event.type === 'Agenda Sekolah' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
 'bg-slate-50 text-slate-600 border-slate-100'}
 `}
 >
 {event.title}
 </div>
 ))}
 {dayEvents.length > 2 && (
 <div className="text-[9px] font-black text-slate-400 pl-1">
 +{dayEvents.length - 2} lagi
 </div>
 )}
 </div>
 
 {isAdmin && isCurrentMonth && (
 <button 
 onClick={(e) => {
 e.stopPropagation();
 onAddEvent?.(date);
 }}
 className="absolute bottom-2 right-2 p-1.5 bg-slate-100 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-indigo-500 hover:text-white transition-all"
 >
 <CalendarIcon size={12} />
 </button>
 )}
 </motion.div>
 );
 })}
 </div>
 );
 };

 const renderSelectedDayEvents = () => {
 const dateStr = format(selectedDate, 'yyyy-MM-dd');
 const dayEvents = events.filter(e => e.date === dateStr);

 return (
 <div className="mt-12">
 <div className="flex items-center gap-4 mb-6">
 <div className="w-14 h-14 bg-indigo-600 rounded-[1.2rem] flex flex-col items-center justify-center text-white shadow-xl shadow-indigo-100">
 <span className="text-[10px] font-black uppercase opacity-80">{format(selectedDate, 'MMM', { locale: localeId })}</span>
 <span className="text-xl font-black">{format(selectedDate, 'd')}</span>
 </div>
 <div>
 <h3 className="text-xl font-black text-slate-800 tracking-tight">
 Agenda {format(selectedDate, 'eeee, d MMMM', { locale: localeId })}
 </h3>
 <p className="text-slate-400 text-sm font-medium">Detail kegiatan pada tanggal yang dipilih</p>
 </div>
 {isAdmin && (
 <button 
 onClick={() => onAddEvent?.(selectedDate)}
 className="ml-auto p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
 >
 <CalendarIcon size={20} />
 </button>
 )}
 </div>

 <div className="grid gap-4">
 <AnimatePresence mode="popLayout">
 {dayEvents.length > 0 ? (
 dayEvents.map(event => (
 <motion.div
 key={event.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:border-indigo-100 transition-all"
 >
 <div className="flex items-start gap-4">
 <div className={`
 w-12 h-12 rounded-2xl flex items-center justify-center border
 ${event.type === 'Libur' ? 'bg-rose-50 text-rose-500 border-rose-100' : 
 event.type === 'Ujian' ? 'bg-amber-50 text-amber-500 border-amber-100' :
 event.type === 'Agenda Sekolah' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' :
 'bg-slate-50 text-slate-500 border-slate-100'}
 `}>
 <Info size={24} />
 </div>
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className={`
 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border
 ${event.type === 'Libur' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
 event.type === 'Ujian' ? 'bg-amber-50 text-amber-600 border-amber-100' :
 event.type === 'Agenda Sekolah' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
 'bg-slate-50 text-slate-600 border-slate-100'}
 `}>
 {event.type}
 </span>
 </div>
 <h4 className="text-lg font-black text-slate-800 tracking-tight">{event.title}</h4>
 <p className="text-slate-500 text-sm font-medium mt-1">{event.description}</p>
 </div>
 </div>
 {isAdmin && (
 <div className="flex gap-2 w-full sm:w-auto">
 <button 
 onClick={() => onEditEvent?.(event)}
 className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all"
 >
 Edit
 </button>
 <button 
 onClick={() => onDeleteEvent?.(event.id)}
 className="flex-1 sm:flex-none px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
 >
 Hapus
 </button>
 </div>
 )}
 </motion.div>
 ))
 ) : (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="text-center py-16 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200"
 >
 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
 <CalendarIcon size={32} />
 </div>
 <p className="text-slate-400 font-bold">Tidak ada agenda untuk tanggal ini.</p>
 {isAdmin && (
 <button 
 onClick={() => onAddEvent?.(selectedDate)}
 className="mt-4 text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline"
 >
 + Tambah Agenda
 </button>
 )}
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 );
 };

 const renderLegend = () => {
 const legends = [
 { label: 'Libur Nasional / Cuti', color: 'bg-rose-500' },
 { label: 'Agenda Sekolah', color: 'bg-indigo-500' },
 { label: 'Ujian / Penilaian', color: 'bg-amber-500' },
 { label: 'Lainnya', color: 'bg-slate-500' },
 ];

 return (
 <div className="mt-12 p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
 <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Keterangan Warna</h4>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
 {legends.map((item, i) => (
 <div key={i} className="flex items-center gap-3">
 <div className={`w-4 h-4 ${item.color} rounded-lg shadow-lg`}></div>
 <span className="text-sm font-bold text-slate-600">{item.label}</span>
 </div>
 ))}
 </div>
 </div>
 );
 };

 return (
 <div className="max-w-7xl mx-auto pb-20">
 <div className="bg-white/50 backdrop-blur-xl p-4 md:p-8 rounded-[3rem] border border-white/50 shadow-2xl shadow-indigo-100/20">
 {renderHeader()}
 {renderDays()}
 {renderCells()}
 </div>
 
 <div className="mt-8 px-4">
 {renderSelectedDayEvents()}
 {renderLegend()}
 </div>
 </div>
 );
};

export default KaldikCalendar;
