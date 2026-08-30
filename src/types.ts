import { Timestamp } from 'firebase/firestore';

export interface UserData {
 id: string;
 name: string;
 email: string;
 role: 'admin' | 'guru' | 'siswa' | 'parent';
 photoURL?: string;
 kelas?: string;
 whatsapp?: string;
 savings?: number;
 arrears?: number;
 createdAt?: any;
}

export interface FinancialTransaction {
 id: string;
 date: any; // Timestamp
 amount: number;
 type: 'income' | 'expense';
 category: string;
 description: string;
 source: 'manual' | 'iuran'; // Integrated source
 studentId?: string; // If from iuran
 studentName?: string;
 createdBy: string; // admin uid
}

export interface PaymentFee {
 id: string;
 studentId: string;
 studentName: string;
 amount: number;
 date: any;
 status: 'paid' | 'pending';
 month: string; // e.g., "Juli 2024"
 type: string; // e.g., "SPP", "Infaq"
}

export interface KaldikEvent {
 id: string;
 title: string;
 description: string;
 date: string; // ISO string YYYY-MM-DD
 endDate?: string; // For multi-day events
 type: 'Libur' | 'Agenda Sekolah' | 'Ujian' | 'Lainnya';
 color?: string;
 createdAt?: any;
}

export interface Announcement {
 id: string;
 title: string;
 content: string;
 target: 'all' | 'guru' | 'siswa';
 attachments?: { name: string; type: string; data: string }[];
 author: string;
 createdAt: any;
 updatedAt: any;
}
