import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, doc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json" assert { type: "json" };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

interface ExpenseItem {
  date: string;
  description: string;
  amount: number;
  category: string;
}

const expenses: ExpenseItem[] = [
  // 21 Juli 2026
  { date: "2026-07-21", description: "Beli 2 set seragam RA", amount: 416000, category: "Seragam & Perlengkapan" },
  { date: "2026-07-21", description: "Beli plastik", amount: 10000, category: "ATK & Cetak" },
  { date: "2026-07-21", description: "Ngasih puah", amount: 150000, category: "Lainnya" },
  { date: "2026-07-21", description: "Token listrik", amount: 50000, category: "Listrik & Air" },
  { date: "2026-07-21", description: "Beasiswa 5 siswa", amount: 500000, category: "Kegiatan & Acara" },
  { date: "2026-07-21", description: "Pembuatan buku PR, tabungan, SPP, dan buku prestasi di Yuri", amount: 1100000, category: "ATK & Cetak" },
  { date: "2026-07-21", description: "Map 1 pak, pulpen, stick note, tempat pensil", amount: 120000, category: "ATK & Cetak" },
  { date: "2026-07-21", description: "Tas khaq", amount: 41000, category: "Lainnya" },

  // 22 Juli 2026
  { date: "2026-07-22", description: "Banner hari anak", amount: 36000, category: "Kegiatan & Acara" },

  // 23 Juli 2026
  { date: "2026-07-23", description: "DP ke 2 permainan", amount: 500000, category: "Perawatan Gedung" },
  { date: "2026-07-23", description: "Print", amount: 10000, category: "ATK & Cetak" },

  // 24 Juli 2026
  { date: "2026-07-24", description: "Bendera pawai", amount: 63000, category: "Kegiatan & Acara" },
  { date: "2026-07-24", description: "Konsumsi guru", amount: 150000, category: "Konsumsi" },
  { date: "2026-07-24", description: "Konsumsi guru", amount: 30000, category: "Konsumsi" },
  { date: "2026-07-24", description: "Arit dan pisau", amount: 50000, category: "Perawatan Gedung" },
  { date: "2026-07-24", description: "Urug-urug 4 truk", amount: 2300000, category: "Perawatan Gedung" },
  { date: "2026-07-24", description: "Makan tukang", amount: 20000, category: "Konsumsi" },

  // 25 Juli 2026
  { date: "2026-07-25", description: "Belanja bahan bangunan", amount: 2150000, category: "Perawatan Gedung" },

  // 26 Juli 2026
  { date: "2026-07-26", description: "Belanja bahan bangunan", amount: 750000, category: "Perawatan Gedung" },
  { date: "2026-07-26", description: "Kue tukang", amount: 50000, category: "Konsumsi" },
  { date: "2026-07-26", description: "Belanja pasir batu semen", amount: 1390000, category: "Perawatan Gedung" },
  { date: "2026-07-26", description: "Aqua 2 dus", amount: 40000, category: "Konsumsi" },
  { date: "2026-07-26", description: "Karet", amount: 10000, category: "Lainnya" },
  { date: "2026-07-26", description: "Paku asbes", amount: 25000, category: "Perawatan Gedung" },
  { date: "2026-07-26", description: "Bayaran Tumin", amount: 370000, category: "Gaji & Honor" },
  { date: "2026-07-26", description: "Bayaran Ang Us 2 hari", amount: 400000, category: "Gaji & Honor" },

  // 27 Juli 2026
  { date: "2026-07-27", description: "Peci siswa", amount: 491000, category: "Seragam & Perlengkapan" },
  { date: "2026-07-27", description: "Lampu kelas A", amount: 135000, category: "Perawatan Gedung" },
  { date: "2026-07-27", description: "Kue dan kopi tukang", amount: 20000, category: "Konsumsi" },
  { date: "2026-07-27", description: "Pengki dan 2 sapu", amount: 30000, category: "Perawatan Gedung" },
  { date: "2026-07-27", description: "Papan melur dan 2 ember", amount: 50000, category: "Perawatan Gedung" },
  { date: "2026-07-27", description: "Es tukang", amount: 20000, category: "Konsumsi" },

  // 28 Juli 2026
  { date: "2026-07-28", description: "Air Pak RT", amount: 100000, category: "Listrik & Air" },
  { date: "2026-07-28", description: "Pasir 1 kol, 5 sak semen, bata 50 pcs", amount: 740000, category: "Perawatan Gedung" },
  { date: "2026-07-28", description: "Konsumsi tukang", amount: 40000, category: "Konsumsi" },

  // 29 Juli 2026
  { date: "2026-07-29", description: "Bayaran 2 tukang", amount: 480000, category: "Gaji & Honor" },
  { date: "2026-07-29", description: "Beli semen 1 sak", amount: 55000, category: "Perawatan Gedung" },
  { date: "2026-07-29", description: "Kuas", amount: 15000, category: "Perawatan Gedung" },
  { date: "2026-07-29", description: "Konsumsi rapat guru", amount: 100000, category: "Konsumsi" },
  { date: "2026-07-29", description: "Konsumsi tukang", amount: 40000, category: "Konsumsi" },
  { date: "2026-07-29", description: "Semen 1 sak", amount: 55000, category: "Perawatan Gedung" },
  { date: "2026-07-29", description: "Bayaran tukang", amount: 240000, category: "Gaji & Honor" },

  // 1 Agustus 2026
  { date: "2026-08-01", description: "Lilin fashion show", amount: 22000, category: "Kegiatan & Acara" },
  { date: "2026-08-01", description: "Karpet bludru", amount: 280000, category: "Perawatan Gedung" },
  { date: "2026-08-01", description: "Ang Us belanja bahan bangunan/keperluan", amount: 2250000, category: "Perawatan Gedung" },
  { date: "2026-08-01", description: "Rantai mainan", amount: 53000, category: "Perawatan Gedung" },
  { date: "2026-08-01", description: "Konsumsi tukang", amount: 65000, category: "Konsumsi" },

  // 2 Agustus 2026
  { date: "2026-08-02", description: "Konsumsi", amount: 60000, category: "Konsumsi" },
  { date: "2026-08-02", description: "Semen", amount: 10000, category: "Perawatan Gedung" },
  { date: "2026-08-02", description: "Ade", amount: 260000, category: "Gaji & Honor" },
  { date: "2026-08-02", description: "Odong-odong", amount: 50000, category: "Kegiatan & Acara" },
  { date: "2026-08-02", description: "Air", amount: 100000, category: "Listrik & Air" },
  { date: "2026-08-02", description: "Bayaran Ang Us", amount: 450000, category: "Gaji & Honor" },

  // 5 Agustus 2026
  { date: "2026-08-05", description: "Ang Us karo Ade beresin sanyo", amount: 100000, category: "Perawatan Gedung" },
  { date: "2026-08-05", description: "Keperluan Yasna", amount: 50000, category: "Lainnya" },
  { date: "2026-08-05", description: "Gaji guru", amount: 2500000, category: "Gaji & Honor" },
  { date: "2026-08-05", description: "Nengok Zafran (Sosial)", amount: 60000, category: "Kegiatan & Acara" },

  // 11 Agustus 2026
  { date: "2026-08-11", description: "Air isi sumur", amount: 90000, category: "Listrik & Air" },
  { date: "2026-08-11", description: "Ganti kunci kelas B", amount: 75000, category: "Perawatan Gedung" },
  { date: "2026-08-11", description: "Kasih Ang Us", amount: 85000, category: "Gaji & Honor" },
  { date: "2026-08-11", description: "Hadiah 17-an", amount: 523000, category: "Kegiatan & Acara" },

  // 17 Agustus 2026
  { date: "2026-08-17", description: "Bayar beli perabot 17-an", amount: 50000, category: "Kegiatan & Acara" },
  { date: "2026-08-17", description: "Operasional 17-an", amount: 13000, category: "Kegiatan & Acara" },
  { date: "2026-08-17", description: "Bayar cat permainan", amount: 250000, category: "Perawatan Gedung" },
  { date: "2026-08-17", description: "Bayar Ang Us ngebaud", amount: 120000, category: "Gaji & Honor" },

  // 27 Agustus 2026
  { date: "2026-08-27", description: "Banner Maulid Nabi", amount: 51000, category: "Kegiatan & Acara" },
  { date: "2026-08-27", description: "Belanja snack Maulid Nabi", amount: 960000, category: "Konsumsi" },
  { date: "2026-08-27", description: "Konsumsi guru (es)", amount: 30000, category: "Konsumsi" },
  { date: "2026-08-27", description: "Konsumsi beberes (bakso & es teh)", amount: 60000, category: "Konsumsi" },

  // 7 Oktober 2026
  { date: "2026-10-07", description: "Beli galon untuk WC", amount: 100000, category: "Perawatan Gedung" },
  { date: "2026-10-07", description: "Beli air 90rb x 2", amount: 180000, category: "Listrik & Air" },
  { date: "2026-10-07", description: "Gaji guru September & Oktober", amount: 5000000, category: "Gaji & Honor" },
  { date: "2026-10-07", description: "Berobat Mulya ngejahit", amount: 400000, category: "Kegiatan & Acara" },
  { date: "2026-10-07", description: "Berobat ke-2 Mulya", amount: 200000, category: "Kegiatan & Acara" },
  { date: "2026-10-07", description: "Beresin mainan", amount: 200000, category: "Perawatan Gedung" },
  { date: "2026-10-07", description: "Belanja untuk UTS (kertas kartu ujian dll)", amount: 400000, category: "ATK & Cetak" },
  { date: "2026-10-07", description: "Beli gembok", amount: 65000, category: "Perawatan Gedung" },
  { date: "2026-10-07", description: "Rantai untuk mainan", amount: 80000, category: "Perawatan Gedung" },
  { date: "2026-10-07", description: "Beli kertas minyak & beli plastik es mbg", amount: 130000, category: "ATK & Cetak" },
  { date: "2026-10-07", description: "Pasang WiFi", amount: 200000, category: "Perawatan Gedung" },
  { date: "2026-10-07", description: "Konsumsi guru", amount: 300000, category: "Konsumsi" },
  { date: "2026-10-07", description: "Lain-lain", amount: 2000000, category: "Lainnya" },
  { date: "2026-10-07", description: "Belanja nengok Azmi, Syila, Mizan (Sosial)", amount: 150000, category: "Kegiatan & Acara" },
  { date: "2026-10-07", description: "Nengok Mulya (Sosial)", amount: 60000, category: "Kegiatan & Acara" },
  { date: "2026-10-07", description: "Beli syal 25 pcs & guru 7 pcs", amount: 145000, category: "Seragam & Perlengkapan" },
  { date: "2026-10-07", description: "DP foto manasik", amount: 1000000, category: "Kegiatan & Acara" },
  { date: "2026-10-07", description: "Tisu 3 pcs & pulpen 1 pak", amount: 50000, category: "ATK & Cetak" },
  { date: "2026-10-07", description: "Beresin & jasa potong rumput", amount: 85000, category: "Perawatan Gedung" },
  { date: "2026-10-07", description: "Rapat PC 2 bulan", amount: 200000, category: "Kegiatan & Acara" },
  { date: "2026-10-07", description: "Rapat di Pesona Pandang", amount: 50000, category: "Kegiatan & Acara" },
  { date: "2026-10-07", description: "Beli penutup pintu otomatis 2 kelas", amount: 200000, category: "Perawatan Gedung" },
  { date: "2026-10-07", description: "Token listrik 2 bulan", amount: 250000, category: "Listrik & Air" },
  { date: "2026-10-07", description: "Belanja tas manasik 56 pcs", amount: 441000, category: "Kegiatan & Acara" },

  // 10 Oktober 2026
  { date: "2026-10-10", description: "Buat buku kuning 40 pcs di Yuri", amount: 130000, category: "ATK & Cetak" },
  { date: "2026-10-10", description: "Belanja gerinda Ang Us", amount: 100000, category: "Perawatan Gedung" },
  { date: "2026-10-10", description: "Konsumsi Ang Us", amount: 50000, category: "Konsumsi" },

  // 11 Oktober 2026
  { date: "2026-10-11", description: "Beli / pemasangan kabel 2", amount: 83000, category: "Perawatan Gedung" },
  { date: "2026-10-11", description: "Konsumsi Ang Us", amount: 50000, category: "Konsumsi" },
  { date: "2026-10-11", description: "Belanja lakban hitam 6, gembok WC, tisu 2, gantungan kunci, lakban sanyo, pulpen 1 pak", amount: 150000, category: "ATK & Cetak" },

  // 13 Oktober 2026
  { date: "2026-10-13", description: "Bayaran Ang Us", amount: 350000, category: "Gaji & Honor" },
  { date: "2026-10-13", description: "Kunci baru", amount: 80000, category: "Perawatan Gedung" },
  { date: "2026-10-13", description: "Konsumsi", amount: 40000, category: "Konsumsi" },
  { date: "2026-10-13", description: "Beresin AC", amount: 220000, category: "Perawatan Gedung" },
  { date: "2026-10-13", description: "Kuota CCTV", amount: 58000, category: "Listrik & Air" },

  // 16 Oktober 2026
  { date: "2026-10-16", description: "Nabil (kebocoran)", amount: 100000, category: "Perawatan Gedung" },
  { date: "2026-10-16", description: "Seragam guru", amount: 830000, category: "Seragam & Perlengkapan" },
  { date: "2026-10-16", description: "Makan guru", amount: 186000, category: "Konsumsi" },
  { date: "2026-10-16", description: "Bensin", amount: 100000, category: "Akomodasi" },
  { date: "2026-10-16", description: "AKG", amount: 50000, category: "Kegiatan & Acara" },
  { date: "2026-10-16", description: "Tas manasik 3 pcs", amount: 23000, category: "Kegiatan & Acara" }
];

async function run() {
  console.log(`Starting to insert ${expenses.length} expense records...`);
  const batchSize = 100;
  let batch = writeBatch(db);
  let count = 0;
  let batchCount = 0;

  for (const item of expenses) {
    const docRef = doc(collection(db, "finance_transactions"));
    batch.set(docRef, {
      amount: item.amount,
      type: "expense",
      category: item.category,
      date: item.date,
      description: item.description,
      adminName: "Admin Keuangan",
      adminId: "admin",
      createdAt: new Date(`${item.date}T10:00:00Z`)
    });
    count++;
    batchCount++;

    if (batchCount >= batchSize) {
      await batch.commit();
      console.log(`Committed batch of ${batchCount} records. Total: ${count}`);
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${batchCount} records.`);
  }

  console.log(`SUCCESS! All ${count} expense records successfully inserted.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Failed to insert expenses:", err);
  process.exit(1);
});
