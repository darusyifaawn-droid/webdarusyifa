export type HafalanStatus = 'Belum Mulai' | 'Sedang Menghafal' | 'Lancar' | 'Mumtaz (Lulus)';

export interface HafalanMaterial {
  id: string;
  kelas: 'Utsman' | 'Umar Bin Khattab';
  kategori: 'Surat Pendek' | 'Hadist' | 'Doa Sehari-hari' | 'Bacaan Sholat';
  judul: string;
  arab: string;
  latin: string;
  terjemahan: string;
  audioUrl?: string;
  urutan: number;
}

export interface StudentHafalanProgress {
  id: string;
  studentId: string;
  materialId: string;
  status: HafalanStatus;
  stars: number; // 0 to 5
  catatanGuru: string;
  isReadyForTest: boolean;
  updatedAt: string;
  recordingDataUrl?: string;
  recordingLink?: string;
  submissionMethod?: 'Google Drive' | 'Setoran Langsung' | 'Rekaman Suara';
}

// Data List with Placeholders for Arabic, Latin and Translation
export const hafalanMaterials: HafalanMaterial[] = [
  // --- Utsman ---
  { id: "utsman_1_sp_1", kelas: "Utsman", kategori: "Surat Pendek", judul: "QS. Al Kautsar", arab: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ . فَصَلِّ لِرَبِّكَ وَانْحَرْ . إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ", latin: "Innā a'ṭainākal-kauṡar. Faṣalli lirabbika wanḥar. Inna syāni'aka huwal-abtar.", terjemahan: "1. Sesungguhnya Kami telah memberikan kepadamu nikmat yang banyak. 2. Maka dirikanlah shalat karena Tuhanmu; dan berkorbanlah. 3. Sesungguhnya orang-orang yang membenci kamu dialah yang terputus (dari rahmat Allah).", urutan: 1, audioUrl: "https://download.quranicaudio.com/quran/ahmed_saud/108.mp3" },
  { id: "utsman_1_sp_2", kelas: "Utsman", kategori: "Surat Pendek", judul: "QS. Al Ma'un", arab: "أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ . فَذَلِكَ الَّذِي يَدُعُّ الْيَتِيمَ . وَلَا يَحُضُّ عَلَى طَعَامِ الْمِسْكِينِ . فَوَيْلٌ لِلْمُصَلِّينَ . الَّذِينَ هُمْ عَنْ صَلَاتِهِمْ سَاهُونَ . الَّذِينَ هُمْ يُرَاءُونَ . وَيَمْنَعُونَ الْمَاعُونَ", latin: "Ara'aital-lażī yukażżibu bid-dīn. Fa żālikal-lażī yadu''ul-yatīm. Wa lā yaḥuḍḍu 'alā ṭa'āmil-miskīn. Fa wailul lil-muṣallīn. Allażīna hum 'an ṣalātihim sāhūn. Allażīna hum yur'aūn. Wa yamna'ūnal-mā'ūn.", terjemahan: "1. Tahukah kamu (orang) yang mendustakan agama? 2. Itulah orang yang menghardik anak yatim, 3. dan tidak menganjurkan memberi makan orang miskin. 4. Maka kecelakaanlah bagi orang-orang yang shalat, 5. (yaitu) orang-orang yang lalai dari shalatnya, 6. orang-orang yang berbuat riya, 7. dan enggan (menolong dengan) barang berguna.", urutan: 2, audioUrl: "https://download.quranicaudio.com/quran/ahmed_saud/107.mp3" },
  { id: "utsman_1_sp_3", kelas: "Utsman", kategori: "Surat Pendek", judul: "QS. Al Quraisy", arab: "لِإِيلَافِ قُرَيْشٍ . إِيلَافِهِمْ رِحْلَةَ الشِّتَاءِ وَالصَّيْفِ . فَلْيَعْبُدُوا رَبَّ هَذَا الْبَيْتِ . الَّذِي أَطْعَمَهُمْ مِنْ جُوعٍ وَآمَنَهُمْ مِنْ خَوْفٍ", latin: "Li'īlāfi quraīsy. Īlāfihim riḥlatasy-syitā'i waṣ-ṣaīf. Falya'budū rabba hāżal-baīt. Allażī aṭ'amahum min jū'iw wa āmanahum min khaūf.", terjemahan: "1. Karena kebiasaan orang-orang Quraisy, 2. (yaitu) kebiasaan mereka bepergian pada musim dingin dan musim panas. 3. Maka hendaklah mereka menyembah Tuhan Pemilik rumah ini (Ka'bah). 4. Yang telah memberi makanan kepada mereka untuk menghilangkan lapar dan mengamankan mereka dari ketakutan.", urutan: 3, audioUrl: "https://download.quranicaudio.com/quran/ahmed_saud/106.mp3" },
  { id: "utsman_1_sp_4", kelas: "Utsman", kategori: "Surat Pendek", judul: "QS. Al Fiil", arab: "أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ . أَلَمْ يَجْعَلْ كَيْدَهُمْ فِي تَضْلِيلٍ . وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ . تَرْمِيهِمْ بِحِجَارَةٍ مِنْ سِجِّيلٍ . فَجَعَلَهُمْ كَعَصْفٍ مَأْكُولٍ", latin: "Alam tara kaifa fa'ala rabbuka bi'aṣḥābil-fīl. Alam yaj'al kaidahum fī taḍlīl. Wa arsala 'alaihim ṭairan abābīl. Tarmīhim biḥijāratim min sijjīl. Faja'alahum ka'aṣfim ma'kūl.", terjemahan: "1. Apakah kamu tidak memperhatikan bagaimana Tuhanmu telah bertindak terhadap tentara bergajah? 2. Bukankah Dia telah menjadikan tipu daya mereka (untuk menghancurkan Ka'bah) itu sia-sia? 3. dan Dia mengirimkan kepada mereka burung yang berbondong-bondong, 4. yang melempari mereka dengan batu (berasal) dari tanah yang terbakar, 5. lalu Dia menjadikan mereka seperti daun-daun yang dimakan (ulat).", urutan: 4 },
  
  // Hadist
  { id: "utsman_1_h_1", kelas: "Utsman", kategori: "Hadist", judul: "Hadist Berbuat Baik", arab: "كُلُّ مَعْرُوفٍ صَدَقَةٌ", latin: "Kullu ma'rufun shadaqah", terjemahan: "Setiap kebaikan adalah sedekah.", urutan: 5 },
  { id: "utsman_1_h_2", kelas: "Utsman", kategori: "Hadist", judul: "Hadist Tersenyum", arab: "تَبَسُّمُكَ فِى وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ", latin: "Tabassumuka fi wajhi akhika laka shadaqah.", terjemahan: "Senyummu di hadapan saudaramu adalah sedekah.", urutan: 6 },
  { id: "utsman_1_h_3", kelas: "Utsman", kategori: "Hadist", judul: "Hadist Tentang Sholat", arab: "الصَّلاَةُ عِمَادُ الدِّينِ", latin: "Ash-shalatu 'imadud-din.", terjemahan: "Shalat itu tiang agama.", urutan: 7 },
  { id: "utsman_1_h_4", kelas: "Utsman", kategori: "Hadist", judul: "Hadist Menebarkan Salam", arab: "أَفْشُوا السَّلَامَ بَيْنَكُمْ", latin: "Afshus-salama bainakum.", terjemahan: "Sebarkanlah salam di antara kalian.", urutan: 8 },

  // Do'a
  { id: "utsman_1_d_1", kelas: "Utsman", kategori: "Doa Sehari-hari", judul: "Do'a Memakai Pakaian", arab: "الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي هَذَا (الثَّوْبَ) وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ", latin: "Alhamdulillahilladzi kasaani hadza (ats-tsauba) wa razaqaniihi min ghairi haulin minnii wa laa quwwatin.", terjemahan: "Segala puji bagi Allah yang telah memberiku pakaian ini dan memberikannya sebagai rezeki kepadaku tanpa daya dan kekuatan dariku.", urutan: 9 },
  { id: "utsman_1_d_2", kelas: "Utsman", kategori: "Doa Sehari-hari", judul: "Do'a Melepaskan Pakaian", arab: "بِسْمِ اللهِ الَّذِيْ لَا إِلَهَ إِلَّا هُوَ", latin: "Bismillahil ladzi la ilaha illa huwa", terjemahan: "Dengan nama Allah yang tiada Tuhan selain-Nya.", urutan: 10 },
  { id: "utsman_1_d_3", kelas: "Utsman", kategori: "Doa Sehari-hari", judul: "Do'a Bercermin", arab: "اَللّٰهُمَّ كَمَا حَسَّنْتَ خَلْقِيْ فَحَسِّنْ خُلُقِيْ", latin: "Allahumma kama hassanta khalqi fahassin khuluqi.", terjemahan: "Ya Allah, sebagaimana Engkau telah membaguskan penciptaanku, maka baguskanlah pula akhlakku.", urutan: 11 },
  { id: "utsman_1_d_4", kelas: "Utsman", kategori: "Doa Sehari-hari", judul: "Do'a Ketika Hujan", arab: "اللَّهُمَّ صَيِّباً نَافِعاً", latin: "Allahumma shayyiban nafi’an.", terjemahan: "Ya Allah curahkanlah hujan yang bermanfaat.", urutan: 12 },
  { id: "utsman_1_d_5", kelas: "Utsman", kategori: "Doa Sehari-hari", judul: "Do'a Masuk Masjid", arab: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", latin: "Allahummaftahlii abwaaba rahmatik.", terjemahan: "Ya Allah, bukalah untukku pintu-pintu rahmat-Mu.", urutan: 13 },
  { id: "utsman_1_d_6", kelas: "Utsman", kategori: "Doa Sehari-hari", judul: "Do'a Keluar Masjid", arab: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", latin: "Allahumma innii as'aluka min fadhlika.", terjemahan: "Ya Allah, sesungguhnya aku memohon keutamaan dari-Mu.", urutan: 14 },

  // Bacaan Sholat Utsman
  { id: "utsman_1_bs_1", kelas: "Utsman", kategori: "Bacaan Sholat", judul: "Doa Iftitah", arab: "اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ...", latin: "Allahumma baa'id bainii wa baina khathaayaaya...", terjemahan: "Ya Allah, jauhkanlah antara aku dan kesalahan-kesalahanku...", urutan: 15 },
  { id: "utsman_1_bs_2", kelas: "Utsman", kategori: "Bacaan Sholat", judul: "Bacaan Ruku", arab: "سُبْحَانَ رَبِّيَ الْعَظِيمِ وَبِحَمْدِهِ", latin: "Subhaana rabbiyal 'adhiimi wa bihamdihi.", terjemahan: "Maha Suci Tuhanku Yang Maha Agung dan dengan memuji-Nya.", urutan: 16 },
  { id: "utsman_1_bs_3", kelas: "Utsman", kategori: "Bacaan Sholat", judul: "Bacaan Sujud", arab: "سُبْحَانَ رَبِّيَ الْأَعْلَى وَبِحَمْدِهِ", latin: "Subhaana rabbiyal a'laa wa bihamdihi.", terjemahan: "Maha Suci Tuhanku Yang Maha Tinggi dan dengan memuji-Nya.", urutan: 17 },

  { id: "utsman_2_sp_1", kelas: "Utsman", kategori: "Surat Pendek", judul: "QS. Al Humazah", arab: "وَيْلٌ لِكُلِّ هُمَزَةٍ لُمَزَةٍ . الَّذِي جَمَعَ مَالًا وَعَدَّدَهُ . يَحْسَبُ أَنَّ مَالَهُ أَخْلَدَهُ . كَلَّا لَيُنْبَذَنَّ فِي الْحُطَمَةِ . وَمَا أَدْرَاكَ مَا الْحُطَمَةُ . نَارُ اللَّهِ الْمُوقَدَةُ . الَّتِي تَطَّلِعُ عَلَى الْأَفْئِدَةِ . إِنَّهَا عَلَيْهِمْ مُؤْصَدَةٌ . فِي عَمَدٍ مُمَدَّدَةٍ", latin: "Wailul likulli humazatil-lumazah. Allażī jama'a mālaw wa 'addadah. Yaḥsabu anna mālahū akhladah. Kallā layumbażanna fil-ḥuṭamah. Wa mā adrāka mal-ḥuṭamah. Nārullāhil-mūqadah. Allatī taṭṭali'u 'alal-af'idah. Innahā 'alaihim mu'ṣadah. Fī 'amadim mumaddadah.", terjemahan: "1. Kecelakaanlah bagi setiap pengumpat lagi pencela, 2. yang mengumpulkan harta dan menghitung-hitung, 3. dia mengira bahwa hartanya itu dapat mengkekalkannya, 4. sekali-kali tidak! Sesungguhnya dia benar-benar akan dilemparkan ke dalam Hutamah. 5. Dan tahukah kamu apa Hutamah itu? 6. (yaitu) api (yang disediakan) Allah yang dinyalakan, 7. yang (membakar) sampai ke hati. 8. Sesungguhnya api itu ditutup rapat atas mereka, 9. (sedang mereka itu) diikat pada tiang-tiang yang panjang.", urutan: 18 },

  // --- Umar Bin Khattab ---
  { id: "umar_sp_1", kelas: "Umar Bin Khattab", kategori: "Surat Pendek", judul: "QS. An Naas", arab: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ . مَلِكِ النَّاسِ . إِلَهِ النَّاسِ . مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ . الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ . مِنَ الْجِنَّةِ وَالنَّاسِ", latin: "Qul a'ūżu birabbin-nās. Malikin-nās. Ilāhin-nās. Min syarril-waswāsil-khannās. Allażī yuwaswisu fī ṣudūrin-nās. Minal-jinnati wan-nās.", terjemahan: "1. Katakanlah: \"Aku berlindung kepada Tuhan (yang memelihara dan menguasai) manusia. 2. Raja manusia. 3. Sembahan manusia. 4. Dari kejahatan (bisikan) syaitan yang biasa bersembunyi, 5. yang membisikkan (kejahatan) ke dalam dada manusia, 6. dari (golongan) jin dan manusia.", urutan: 1 },
  { id: "umar_sp_2", kelas: "Umar Bin Khattab", kategori: "Surat Pendek", judul: "QS. Al Falaq", arab: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ . مِنْ شَرِّ مَا خَلَقَ . وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ . وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ . وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ", latin: "Qul a'ūżu birabbil-falaq. Min syarri mā khalaq. Wa min syarri gāsiqin iżā waqab. Wa min syarrin-naffāṡāti fil-'uqad. Wa min syarri ḥāsidin iżā ḥasad.", terjemahan: "1. Katakanlah: \"Aku berlindung kepada Tuhan Yang Menguasai subuh, 2. dari kejahatan makhluk-Nya, 3. dan dari kejahatan malam apabila telah gelap gulita, 4. dan dari kejahatan wanita-wanita tukang sihir yang menghembus pada buhul-buhul, 5. dan dari kejahatan pendengki bila ia dengki.\"", urutan: 2 }
];

export const getNextMaterialId = (currentMaterialId: string, kelas: string): string | null => {
  const currentMaterial = hafalanMaterials.find(m => m.id === currentMaterialId);
  if (!currentMaterial) return null;
  
  const classMaterials = hafalanMaterials
    .filter(m => m.kelas === kelas)
    .sort((a, b) => a.urutan - b.urutan);
    
  const currentIndex = classMaterials.findIndex(m => m.id === currentMaterialId);
  if (currentIndex === -1 || currentIndex === classMaterials.length - 1) return null; // Not found or already the last one
  
  return classMaterials[currentIndex + 1].id;
};
