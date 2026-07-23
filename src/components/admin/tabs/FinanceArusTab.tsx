import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, orderBy, limit } from 'firebase/firestore';
import { TrendingUp, TrendingDown, Wallet, Plus, Trash2, Calendar, FileText, AlertCircle, ArrowUpRight, ArrowDownRight, BarChart as BarChartIcon, Search, Filter, Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { handleFirestoreError, OperationType } from '../../../lib/firestoreUtils';

interface FinanceArusTabProps {
  payments: any[];
  allUsers: any[];
  user: any;
}

export default function FinanceArusTab({ payments, allUsers, user }: FinanceArusTabProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'finance_transactions'),
      orderBy('date', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'finance_transactions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !date) return;

    try {
      await addDoc(collection(db, 'finance_transactions'), {
        amount: Number(amount),
        type,
        category,
        date,
        description,
        adminId: user?.uid,
        createdAt: serverTimestamp()
      });
      
      setShowAddModal(false);
      setAmount('');
      setDescription('');
      setCategory('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'finance_transactions');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini?')) return;
    try {
      await deleteDoc(doc(db, 'finance_transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'finance_transactions');
    }
  };

  // Calculate Totals
  const incomeFromIuran = payments.filter(p => 
    p.status !== 'pending' && p.status !== 'rejected' && p.type !== 'tagihan' && p.type !== 'tabungan'
  ).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  
  const incomeManual = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalIncome = incomeFromIuran + incomeManual;
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const balance = totalIncome - totalExpense;

  const chartData = [
    { name: 'Pemasukan (Iuran)', value: incomeFromIuran },
    { name: 'Pemasukan (Manual)', value: incomeManual },
    { name: 'Pengeluaran', value: totalExpense },
  ];

  const COLORS = ['#10b981', '#34d399', '#f43f5e'];

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform text-emerald-600">
            <TrendingUp size={80} />
          </div>
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
            <TrendingUp size={28} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pemasukan</p>
          <h4 className="text-3xl font-black text-slate-900 tracking-tight">Rp {totalIncome.toLocaleString('id-ID')}</h4>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-bold">Iuran: Rp {incomeFromIuran.toLocaleString('id-ID')}</span>
            <span className="px-3 py-1 bg-emerald-100/50 text-emerald-600 rounded-full text-[9px] font-bold">Manual: Rp {incomeManual.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform text-rose-500">
            <TrendingDown size={80} />
          </div>
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
            <TrendingDown size={28} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pengeluaran</p>
          <h4 className="text-3xl font-black text-slate-900 tracking-tight">Rp {totalExpense.toLocaleString('id-ID')}</h4>
          <p className="mt-4 text-[10px] font-bold text-slate-400">Arus Kas Keluar Terdaftar</p>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-indigo-400">
            <Wallet size={80} />
          </div>
          <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
            <Wallet size={28} />
          </div>
          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 opacity-70">Saldo Bersih (Laba/Rugi)</p>
          <h4 className={`text-3xl font-black tracking-tight ${balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
            Rp {balance.toLocaleString('id-ID')}
          </h4>
          <div className="mt-4">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${balance >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {balance >= 0 ? 'Surplus Anggaran' : 'Defisit Anggaran'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Transaction Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">Arus Kas Transaksi</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Laporan Transaksi Masuk & Keluar</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all active:scale-95"
              >
                <Plus size={16} /> Tambah Transaksi
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-slate-300">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <FileText size={48} />
                          <p className="font-black text-[10px] uppercase tracking-widest">Belum ada transaksi manual</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                              {t.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            </div>
                            <span className="text-xs font-bold text-slate-600 font-mono tracking-tight">{t.date}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-black text-slate-800 uppercase leading-tight block">{t.description}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200/50">
                            {t.category || 'Lainnya'}
                          </span>
                        </td>
                        <td className={`px-6 py-5 text-right font-black text-xs ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {t.type === 'income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-center">
                            <button 
                              onClick={() => handleDeleteTransaction(t.id)}
                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <h4 className="text-lg font-black text-white tracking-tight mb-8">Struktur Arus Kas</h4>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '15px', border: '1px solid #1e293b', color: 'white' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-6">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px] font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-slate-400 uppercase tracking-widest">{item.name}</span>
                  </div>
                  <span className="text-white font-mono tracking-tight">Rp {item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h4 className="text-lg font-black text-slate-900 tracking-tight mb-6">Ringkasan Cepat</h4>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pemasukan Iuran</p>
                    <p className="text-sm font-black text-slate-800 tracking-tight">Rp {incomeFromIuran.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pemasukan Manual</p>
                    <p className="text-sm font-black text-slate-800 tracking-tight">Rp {incomeManual.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Pengeluaran</p>
                    <p className="text-sm font-black text-slate-800 tracking-tight">Rp {totalExpense.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Tambah Transaksi Baru</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Arsip Keuangan Arus Kas</p>
            
            <form onSubmit={handleAddTransaction} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Transaksi</label>
                <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl">
                  <button 
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'income' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Pemasukan
                  </button>
                  <button 
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'expense' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Pengeluaran
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal (Rp)</label>
                <input 
                  type="number" 
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-[10px] font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                  <input 
                    type="text" 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-[10px] font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Contoh: ATK, Listrik, Donasi"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan / Deskripsi</label>
                <textarea 
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-24 resize-none"
                  placeholder="Deskripsi singkat transaksi..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all active:scale-95"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
