import React from 'react';
import { CheckCircle, X, Image as ImageIcon, Calendar, CreditCard } from 'lucide-react';

interface FinanceValidasiTabProps {
  payments: any[];
  allUsers: any[];
  setSelectedPhoto: (val: string | null) => void;
  handleApprovePayment: (pay: any) => Promise<void>;
  handleRejectPayment: (id: string) => Promise<void>;
}

export default function FinanceValidasiTab({
  payments,
  allUsers,
  setSelectedPhoto,
  handleApprovePayment,
  handleRejectPayment
}: FinanceValidasiTabProps) {
  const pendingPayments = payments.filter(p => p.status === 'pending');

  return (
    <div className="space-y-6 text-left">
      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden text-sm">
        <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-gray-800 tracking-tight text-xl uppercase">Validasi Keuangan</h3>
            <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest leading-relaxed">Tinjau setoran tabungan atau pelunasan tagihan</p>
          </div>
          <div className="w-fit px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            {pendingPayments.length} PENDING
          </div>
        </div>

        {pendingPayments.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
              <CheckCircle size={32} />
            </div>
            <h4 className="font-black text-gray-800 text-lg uppercase">Selesai</h4>
            <p className="text-[10px] text-gray-400 mt-1 max-w-xs font-bold uppercase tracking-widest leading-loose">Tidak ada permintaan konfirmasi yang tertunda.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-[700px] overflow-y-auto custom-scrollbar">
            {pendingPayments.map((pay) => {
              const student = allUsers.find(u => u.id === pay.studentId);
              return (
                <div key={pay.id} className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1 min-w-0 space-y-4 text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg border border-slate-100">
                        {student?.name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-gray-800 text-base uppercase tracking-tight truncate">{student?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">{student?.kelas || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="px-3 py-1.5 bg-gray-50 text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-100 truncate max-w-[200px]">
                        {pay.description || 'Pembayaran'}
                      </div>
                      
                      {pay.method === 'Transfer' && pay.proofStr && (
                        <button 
                          onClick={() => setSelectedPhoto(pay.proofStr)}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-blue-100"
                        >
                          <ImageIcon size={12} /> BUKTI
                        </button>
                      )}
                      {pay.method === 'Tunai' && pay.meetDate && (
                        <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-amber-100">
                          <Calendar size={12} /> {pay.meetDate}
                        </div>
                      )}
                      {pay.method === 'Tabungan' && (
                        <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
                          <CreditCard size={12} /> TABUNGAN
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto p-4 md:p-0 bg-slate-50 md:bg-transparent rounded-2xl border border-slate-100 md:border-none">
                    <div className="text-left md:text-right">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Nominal</p>
                      <p className="font-black text-indigo-600 text-xl md:text-2xl">Rp {(pay.amount || 0).toLocaleString('id-ID')}</p>
                      {pay.date && <p className="text-[9px] font-bold text-gray-400 mt-1 tracking-widest">{pay.date}</p>}
                    </div>
                    
                    <div className="flex flex-row md:flex-col gap-2 shrink-0">
                      <button 
                        onClick={() => handleApprovePayment(pay)}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 active:scale-95"
                      >
                        VALIDASI
                      </button>
                      <button 
                        onClick={() => handleRejectPayment(pay.id)}
                        className="bg-white text-rose-500 hover:bg-rose-50 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-rose-100 active:scale-95"
                      >
                        TOLAK
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
