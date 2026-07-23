<div align="center">

# 🏫 Portal Sistem Informasi RA Darusyifa Arjawinangun

Web Portal dan Sistem Manajemen Sekolah Terpadu untuk RA Darusyifa Arjawinangun.

[![AI Studio](https://img.shields.io/badge/Google_AI_Studio-Build-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.studio)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

</div>

---

## 📌 Fitur Utama

- 👨‍💼 **Dashboard Admin**:
  - Manajemen Data Pengguna (Siswa, Guru, Orang Tua, Admin).
  - Manajemen Keuangan & Rekap Iuran/SPP (Kas, Arus Kas, Tunggakan, Pembayaran Online/Tunai).
  - Validasi Pembayaran, Penetapan Tagihan & Grup Keuangan.
  - Manajemen Materi Hafalan & Progress Siswa.
  - Kalender Akademik (Kaldik) & Pengumuman Sekolah.

- 👨‍🏫 **Dashboard Guru**:
  - Antrian Setoran Hafalan Siswa & Evaluasi Nilai (Mumtaz, Jayyid, dll).
  - Penilaian Akademik & Rapot Siswa.
  - Presensi/Absensi Guru & Pengumuman Sekolah.

- 👶 **Dashboard Siswa**:
  - Pengiriman Setoran Hafalan (Teks/Audio/Link Video).
  - Monitoring Status Hafalan & Rapor Digital.
  - Informasi Tagihan & Pembayaran Iuran.

- 👨‍👩‍👧 **Dashboard Orang Tua**:
  - Memantau Perkembangan Hafalan & Nilai Anak.
  - Riwayat Pembayaran SPP/Iuran & Pengumuman Sekolah.

---

## 🚀 Panduan Memulai (Run Locally)

### Prasyarat
- [Node.js](https://nodejs.org/) (Versi 18 atau lebih tinggi)
- NPM / Bun / Yarn

### 1. Clone Repository
```bash
git clone https://github.com/darusyifaawn-droid/webdarusyifa.git
cd webdarusyifa
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variable
Buat file `.env` di direktori utama (root) proyek dan isi variabel yang dibutuhkan:

```env
GEMINI_API_KEY="your_gemini_api_key_here"
APP_URL="http://localhost:3000"
```

> **Catatan:** Jangan mengunggah file `.env` yang berisi kredensial ke dalam repository publik. Gunakan file `.env.example` sebagai referensi.

### 4. Jalankan Aplikasi
```bash
npm run dev
```
Aplikasi akan berjalan secara lokal di URL: `http://localhost:3000`

---

## 🛠️ Teknologi & Stack

- **Frontend**: React 19, React Router v7, Tailwind CSS v4, Lucide Icons, Motion (Framer Motion).
- **Backend**: Node.js, Express, ESBuild / TSX.
- **Database & Auth**: Firebase Firestore & Firebase Authentication.
- **Tools / Libraries**: Recharts (Grafik & Analitik), XLSX & PapaParse (Export Excel/CSV), React Quill (Rich Text Editor).

---

## 📜 Lisensi & Hak Cipta

© RA Darusyifa Arjawinangun. Seluruh hak cipta dilindungi undang-undang.
