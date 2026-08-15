import sys

with open('src/components/DashboardAdmin.tsx', 'r') as f:
    content = f.read()

new_func = """  const exportFinanceToExcel = () => {
    // 1. Master List Siswa (Filtered students or all active students)
    const students = filteredUsersForFinance && filteredUsersForFinance.length > 0 
      ? filteredUsersForFinance 
      : allUsers.filter(u => u.role === 'siswa');

    // Calculate totals for summary row
    let grandTotalTagihan = 0;
    let grandTotalTerbayar = 0;
    let grandTotalTunggakan = 0;
    let grandTotalTabungan = 0;

    // 1. REKAPITULASI PER SISWA
    const studentMasterData = students.map((s: any, index: number) => {
      const studentArrears = isFinanceFiltered ? (s.viewArrears || 0) : (s.arrears || 0);
      const studentSavings = isFinanceFiltered ? (s.viewSavings || 0) : (s.savings || 0);
      
      // Calculate total paid by this student
      const studentPayments = payments.filter(p => p.studentId === s.id && p.status !== 'rejected' && p.type !== 'tagihan');
      const totalPaid = studentPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const totalTagihan = totalPaid + studentArrears;

      grandTotalTagihan += totalTagihan;
      grandTotalTerbayar += totalPaid;
      grandTotalTunggakan += studentArrears;
      grandTotalTabungan += studentSavings;

      // Unpaid items list
      const unpaidItems = (s.arrears_details || [])
        .map((d: any) => `${d.name || 'Iuran'} (Rp ${(d.amount || 0).toLocaleString('id-ID')})`)
        .join('; ');

      let statusKeuangan = 'LUNAS';
      if (studentArrears > 0) {
        statusKeuangan = 'MENUNGGAK';
      } else if (totalTagihan === 0) {
        statusKeuangan = 'BEBAS IURAN';
      }

      return {
        "No": index + 1,
        "NIS / NISN": s.nisn || s.nis || s.id || '-',
        "Nama Siswa": s.name || 'Tanpa Nama',
        "Kelas": s.kelas || '-',
        "Status Siswa": s.status || 'Aktif',
        "Total Tagihan (Rp)": totalTagihan,
        "Total Terbayar (Rp)": totalPaid,
        "Sisa Tunggakan (Rp)": studentArrears,
        "Saldo Tabungan (Rp)": studentSavings,
        "Status Pembayaran": statusKeuangan,
        "Rincian Item Menunggak": unpaidItems || '-'
      };
    });

    // Add Grand Total row for sheet 1
    const summaryRow = {
      "No": "",
      "NIS / NISN": "",
      "Nama Siswa": "TOTAL KESELURUHAN",
      "Kelas": `${students.length} Siswa`,
      "Status Siswa": "",
      "Total Tagihan (Rp)": grandTotalTagihan,
      "Total Terbayar (Rp)": grandTotalTerbayar,
      "Sisa Tunggakan (Rp)": grandTotalTunggakan,
      "Saldo Tabungan (Rp)": grandTotalTabungan,
      "Status Pembayaran": grandTotalTunggakan > 0 ? "ADA TUNGGAKAN" : "SEMUA LUNAS",
      "Rincian Item Menunggak": ""
    };

    const sheet1Data = [...studentMasterData, summaryRow];

    // 2. RINCIAN DETAIL TUNGGAKAN & TAGIHAN PER SISWA
    const arrearsDetailRows: any[] = [];
    let arrearsNo = 1;
    students.forEach((s: any) => {
      if (s.arrears_details && s.arrears_details.length > 0) {
        s.arrears_details.forEach((detail: any) => {
          let match = true;
          if (isFinanceFiltered) {
            if (filterFinanceIuranName && !detail.name.toLowerCase().includes(filterFinanceIuranName.toLowerCase())) match = false;
            if (filterFinanceCategory) {
              const catName = detail.category || 'Umum';
              if (catName !== filterFinanceCategory) match = false;
            }
            if (filterFinanceStartDate && detail.date < filterFinanceStartDate) match = false;
            if (filterFinanceEndDate && detail.date > filterFinanceEndDate) match = false;
          }
          if (match) {
            arrearsDetailRows.push({
              "No": arrearsNo++,
              "Nama Siswa": s.name || '-',
              "Kelas": s.kelas || '-',
              "Kategori Iuran": detail.category || 'Umum',
              "Tanggal Tagihan": detail.date || '-',
              "Nama Tagihan / Iuran": detail.name || 'Iuran',
              "Nominal Tagihan (Rp)": Number(detail.amount) || 0,
              "Status": "Belum Dibayar"
            });
          }
        });
      }
    });

    // 3. RIWAYAT TRANSAKSI & JURNAL PEMBAYARAN
    const transactionRows: any[] = payments
      .filter(p => {
        if (!isFinanceFiltered) return true;
        let match = true;
        if (filterFinanceCategory) {
          const pCat = p.iuranCategory || 'Umum';
          if (p.type === 'tagihan' && pCat !== filterFinanceCategory) match = false;
        }
        if (filterFinanceMethod && p.method !== filterFinanceMethod) match = false;
        if (filterFinanceStartDate && p.date < filterFinanceStartDate) match = false;
        if (filterFinanceEndDate && p.date > filterFinanceEndDate) match = false;
        
        const student = allUsers.find(u => u.id === p.studentId);
        if (filterFinanceStudentName && student && !student.name.toLowerCase().includes(filterFinanceStudentName.toLowerCase())) match = false;
        if (filterFinanceClass && student && student.kelas !== filterFinanceClass) match = false;
        
        return match;
      })
      .map((pay: any, idx: number) => {
        const student = allUsers.find(u => u.id === pay.studentId);
        let dateText = pay.date || '-';
        if (pay.createdAt) {
          try {
            const dateObj = pay.createdAt?.toDate ? pay.createdAt.toDate() : (pay.createdAt ? new Date(pay.createdAt) : new Date());
            dateText = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' WIB';
          } catch (e) {
            dateText = String(pay.createdAt);
          }
        }

        let jenisTx = 'Pembayaran Iuran';
        if (pay.type === 'tabungan') jenisTx = 'Setor Tabungan';
        else if (pay.type === 'tabungan_keluar') jenisTx = 'Tarik Tabungan';

        return {
          "No": idx + 1,
          "No. Referensi": pay.id || `TX-${idx + 1}`,
          "Waktu & Tanggal": dateText,
          "Nama Siswa": pay.studentName || student?.name || 'Siswa tidak ditemukan',
          "Kelas": pay.kelas || student?.kelas || '-',
          "Jenis Transaksi": jenisTx,
          "Kategori": pay.iuranCategory || pay.category || 'Umum',
          "Keterangan / Item": pay.description || pay.iuranName || jenisTx,
          "Nominal (Rp)": Number(pay.amount) || 0,
          "Metode Pembayaran": pay.method || (pay.type?.includes('tabungan') ? 'Tunai (Tabungan)' : 'Tunai'),
          "Status Transaksi": pay.status === 'lunas' || pay.status === 'approved' || pay.status === 'verified' ? 'BERHASIL' : pay.status === 'pending' ? 'MENUNGGU VALIDASI' : pay.status === 'ditolak' ? 'DITOLAK' : (pay.status || 'BERHASIL')
        };
      });

    // 4. BUKU TABUNGAN PER SISWA
    const tabunganRows = students.map((s: any, idx: number) => {
      const studentTabungan = isFinanceFiltered ? (s.viewSavings || 0) : (s.savings || 0);
      const studentSetoran = payments
        .filter(p => p.studentId === s.id && p.type === 'tabungan' && p.status !== 'rejected')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const studentPenarikan = payments
        .filter(p => p.studentId === s.id && p.type === 'tabungan_keluar' && p.status !== 'rejected')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      return {
        "No": idx + 1,
        "Nama Siswa": s.name || '-',
        "Kelas": s.kelas || '-',
        "Total Setoran (Rp)": studentSetoran || studentTabungan,
        "Total Penarikan (Rp)": studentPenarikan,
        "Saldo Akhir Tabungan (Rp)": studentTabungan,
        "Status Rekening": studentTabungan > 0 ? 'AKTIF (MEMILIKI SALDO)' : 'NIHIL'
      };
    });

    // Generate Workbook
    const wb = XLSX.utils.book_new();
    const wsMaster = XLSX.utils.json_to_sheet(sheet1Data);
    const wsArrears = XLSX.utils.json_to_sheet(arrearsDetailRows.length > 0 ? arrearsDetailRows : [{ "Info": "Tidak ada data tunggakan iuran saat ini." }]);
    const wsTransactions = XLSX.utils.json_to_sheet(transactionRows.length > 0 ? transactionRows : [{ "Info": "Tidak ada riwayat transaksi pembayaran saat ini." }]);
    const wsTabungan = XLSX.utils.json_to_sheet(tabunganRows);

    // Append Sheets with clear titles
    XLSX.utils.book_append_sheet(wb, wsMaster, "Rekap Per Siswa");
    XLSX.utils.book_append_sheet(wb, wsArrears, "Rincian Tunggakan Siswa");
    XLSX.utils.book_append_sheet(wb, wsTransactions, "Riwayat Transaksi Masuk");
    XLSX.utils.book_append_sheet(wb, wsTabungan, "Buku Tabungan Siswa");

    // Auto-fit Column Widths cleanly
    [wsMaster, wsArrears, wsTransactions, wsTabungan].forEach(ws => {
      if (ws['!ref']) {
        const range = XLSX.utils.decode_range(ws['!ref']);
        const colWidths = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          let maxWidth = 12; // base min width
          for (let R = range.s.r; R <= range.e.r; ++R) {
            const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
            if (cell && cell.v !== undefined && cell.v !== null) {
              const len = String(cell.v).length;
              if (len > maxWidth) maxWidth = len;
            }
          }
          colWidths.push({ wch: Math.min(maxWidth + 4, 60) });
        }
        ws['!cols'] = colWidths;
      }
    });

    const currentDateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Rekap_Administrasi_Keuangan_Siswa_RA_Darusyifa_${currentDateStr}.xlsx`);
  };"""

pattern = "  const exportFinanceToExcel = () => {"
start_idx = content.find(pattern)
if start_idx == -1:
    print("Failed to find start_idx")
    sys.exit(1)

end_pattern = "  const exportRincianTunggakanToExcel = () => {"
end_idx = content.find(end_pattern, start_idx)
if end_idx == -1:
    print("Failed to find end_idx")
    sys.exit(1)

content = content[:start_idx] + new_func + "\n\n" + content[end_idx:]
with open('src/components/DashboardAdmin.tsx', 'w') as f:
    f.write(content)

print("SUCCESS")
