import React from 'react';
import { CheckCircle, X, Image as ImageIcon, Calendar, CreditCard, Wallet, Sparkles } from 'lucide-react';

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
            <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest leading-relaxed">
              Tinjau setoran tabungan online atau pelunasan tagihan iuran
            </p>
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
            <p className="text-[10px] text-gray-400 mt-1 max-w-xs font-bold uppercase tracking-widest leading-loose">
              Tidak ada permintaan konfirmasi yang tertunda.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-[700px] overflow-y-auto custom-scrollbar">
            {pendingPayments.map((pay) => {
              const student = allUsers.find(u => u.id === pay.studentId);
              const isSavings = pay.type === 'tabungan' || pay.isSavingsDeposit === true || pay.category === 'Setoran Tabungan Online' || (pay.description && pay.description.toLowerCase().includes('setoran tabungan'));

              return (
                <div key={pay.id} className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1 min-w-0 space-y-3.5 text-left">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border ${
                        isSavings 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                          : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        {student?.name?.charAt(0) || pay.studentName?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-gray-800 text-base uppercase tracking-tight truncate">
                            {student?.name || pay.studentName || 'Unknown'}
                          </p>
                          {isSavings && (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                              <Wallet size={11} /> TABUNGAN ONLINE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">
                          {student?.kelas || pay.kelas || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-100 truncate max-w-[320px]">
                        {pay.description || 'Pembayaran'}
                      </div>

                      {pay.transferChannel && (
                        <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-200">
                          {pay.transferChannel}
                        </div>
                      )}
                      
                      {pay.proofStr && (
                        <button 
                          onClick={() => setSelectedPhoto(pay.proofStr)}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 border border-blue-100 cursor-pointer"
                        >
                          <ImageIcon size={12} /> LIHAT STRUK
                        </button>
                      )}

                      {pay.method === 'Tunai' && pay.meetDate && (
                        <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-amber-100">
                          <Calendar size={12} /> {pay.meetDate}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto p-4 md:p-0 bg-slate-50 md:bg-transparent rounded-2xl border border-slate-100 md:border-none">
                    <div className="text-left md:text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        {isSavings ? 'Total Setor (+ Saldo)' : 'Nominal'}
                      </p>
                      <p className={`font-black text-xl md:text-2xl ${isSavings ? 'text-emerald-700' : 'text-indigo-600'}`}>
                        Rp {(pay.amount || 0).toLocaleString('id-ID')}
                      </p>
                      {pay.date && <p className="text-[9px] font-bold text-gray-400 mt-1 tracking-widest">{pay.date}</p>}
                    </div>
                    
                    <div className="flex flex-row md:flex-col gap-2 shrink-0">
                      <button 
                        onClick={() => handleApprovePayment(pay)}
                        className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 cursor-pointer ${
                          isSavings 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                        }`}
                      >
                        {isSavings ? 'VALIDASI (+ SALDO)' : 'VALIDASI'}
                      </button>
                      <button 
                        onClick={() => handleRejectPayment(pay.id)}
                        className="bg-white text-rose-500 hover:bg-rose-50 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-rose-100 active:scale-95 cursor-pointer"
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
