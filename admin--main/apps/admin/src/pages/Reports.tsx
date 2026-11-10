import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileBarChart, 
  Download, 
  Upload,
  Printer, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  BookOpen, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Calendar,
  CalendarDays,
  CalendarRange,
  Filter,
  ArrowRight,
  Database,
  Check,
  FileCheck,
  X,
  RefreshCw,
  SlidersHorizontal,
  Info,
  Search,
  Eye,
  BookMarked
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import * as XLSX from 'xlsx';
import { 
  Book, 
  User, 
  HistoryItem, 
  CirculationLoan,
  initialBooks, 
  initialUsers, 
  initialHistory, 
  initialLoans,
  initLocalStorage 
} from '../lib/mockData';
import { realtime } from '../lib/realtime';
import { AdminNotificationStorage } from '../lib/notificationStorage';

export const Reports: React.FC = () => {
  initLocalStorage();

  // Tab utama: 'retention' (Grafik), 'export' (Pusat Ekspor), 'import' (Pusat Impor)
  const [searchParams] = useSearchParams();
  const [activeReportTab, setActiveReportTab] = useState<'retention' | 'export' | 'import'>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'export' || tabParam === 'import' || tabParam === 'retention') {
      return tabParam;
    }
    return 'export';
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'export' || tabParam === 'import' || tabParam === 'retention') {
      setActiveReportTab(tabParam);
    }
  }, [searchParams]);

  // Filter Periode Global untuk Ekspor & Analisis
  // 'all' = Semua Waktu | 'date' = Per Tanggal | 'month' = Per Bulan | 'year' = Per Tahun
  const [periodMode, setPeriodMode] = useState<'all' | 'date' | 'month' | 'year'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  // Data dari LocalStorage / Mock
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const data = localStorage.getItem('bacayuk_books');
      return data ? JSON.parse(data) : initialBooks;
    } catch {
      return initialBooks;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const data = localStorage.getItem('bacayuk_users');
      return data ? JSON.parse(data) : initialUsers;
    } catch {
      return initialUsers;
    }
  });

  const [loans, setLoans] = useState<CirculationLoan[]>(() => {
    try {
      const data = localStorage.getItem('bacayuk_circulation') || localStorage.getItem('bacayuk_loans');
      return data ? JSON.parse(data) : initialLoans;
    } catch {
      return initialLoans;
    }
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const data = localStorage.getItem('bacayuk_history');
      return data ? JSON.parse(data) : initialHistory;
    } catch {
      return initialHistory;
    }
  });

  // Sinkronisasi data real-time saat siswa membaca buku atau meminjam sirkulasi
  useEffect(() => {
    const refreshAll = () => {
      try {
        const b = localStorage.getItem('bacayuk_books');
        if (b) setBooks(JSON.parse(b));
        const u = localStorage.getItem('bacayuk_users');
        if (u) setUsers(JSON.parse(u));
        const l = localStorage.getItem('bacayuk_circulation') || localStorage.getItem('bacayuk_loans');
        if (l) setLoans(JSON.parse(l));
        const h = localStorage.getItem('bacayuk_history');
        if (h) setHistory(JSON.parse(h));
      } catch {}
    };

    window.addEventListener('bacayuk_circulation_updated', refreshAll);
    window.addEventListener('bacayuk_history_updated', refreshAll);
    window.addEventListener('bacayuk_books_updated', refreshAll);
    window.addEventListener('bacayuk_users_updated', refreshAll);

    const unsub = realtime.subscribe((event) => {
      if (
        event.type === 'LOAN_CREATED' ||
        event.type === 'LOAN_UPDATED' ||
        event.type === 'READING_HISTORY_UPDATED' ||
        event.type === 'BOOK_CREATED' ||
        event.type === 'BOOKS_UPDATED' ||
        event.type === 'USER_REGISTERED' ||
        event.type === 'USERS_UPDATED'
      ) {
        refreshAll();
      }
    });

    return () => {
      window.removeEventListener('bacayuk_circulation_updated', refreshAll);
      window.removeEventListener('bacayuk_history_updated', refreshAll);
      window.removeEventListener('bacayuk_books_updated', refreshAll);
      window.removeEventListener('bacayuk_users_updated', refreshAll);
      unsub();
    };
  }, []);

  // State untuk Pratinjau Tabel Interaktif di Pusat Ekspor
  const [activePreviewTable, setActivePreviewTable] = useState<'loans' | 'history' | 'users' | 'books'>('loans');
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');

  // State untuk Fitur Impor Data
  const [importTarget, setImportTarget] = useState<'books' | 'users' | 'loans'>('books');
  const [importDateMode, setImportDateMode] = useState<'file' | 'customDate' | 'customMonth' | 'customYear'>('file');
  const [importCustomDate, setImportCustomDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [importCustomYear, setImportCustomYear] = useState<number>(() => new Date().getFullYear());
  const [importParsedRows, setImportParsedRows] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper filter data berdasarkan periode yang dipilih
  const matchesPeriod = (dateVal?: string, fallbackYear?: number): boolean => {
    if (periodMode === 'all') return true;
    if (!dateVal && !fallbackYear) return false;

    const normalizedDate = dateVal ? dateVal.slice(0, 10) : '';
    const normalizedMonth = dateVal ? dateVal.slice(0, 7) : '';
    const parsedYear = dateVal ? parseInt(dateVal.slice(0, 4), 10) : fallbackYear;

    if (periodMode === 'date') {
      return normalizedDate === selectedDate;
    }
    if (periodMode === 'month') {
      return normalizedMonth === selectedMonth;
    }
    if (periodMode === 'year') {
      return parsedYear === selectedYear || (fallbackYear !== undefined && fallbackYear === selectedYear);
    }
    return true;
  };

  // Data Tersaring Sesuai Periode
  const filteredBooks = books.filter((b) => matchesPeriod(b.dateAdded, b.year));
  const filteredUsers = users.filter((u) => matchesPeriod(u.joinDate));
  const filteredLoans = loans.filter((l) => matchesPeriod(l.borrowDate));
  const filteredHistory = history.filter((h) => matchesPeriod(h.lastRead));

  // Label Periode untuk Nama File & Informasi Header
  const getPeriodLabel = (): string => {
    if (periodMode === 'date') {
      return `Pertanggal_${selectedDate}`;
    }
    if (periodMode === 'month') {
      return `Perbulan_${selectedMonth}`;
    }
    if (periodMode === 'year') {
      return `Pertahun_${selectedYear}`;
    }
    return 'Semua_Periode';
  };

  const getHumanPeriodLabel = (): string => {
    if (periodMode === 'date') {
      const d = new Date(selectedDate);
      return `Tanggal: ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    if (periodMode === 'month') {
      const [y, m] = selectedMonth.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return `Bulan: ${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
    }
    if (periodMode === 'year') {
      return `Tahun: ${selectedYear}`;
    }
    return 'Semua Periode (Keseluruhan Waktu)';
  };

  // Eksekusi Download File via SheetJS XLSX / CSV / JSON
  const downloadSpreadsheet = (
    data: any[],
    baseFilename: string,
    sheetName: string,
    format: 'xlsx' | 'csv' | 'json'
  ) => {
    if (!data.length) {
      alert('Tidak ada data yang sesuai dengan filter periode ini untuk diekspor.');
      return;
    }

    const fullFilename = `${baseFilename}_${getPeriodLabel()}`;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fullFilename}.json`;
      link.click();
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

    if (format === 'csv') {
      XLSX.writeFile(wb, `${fullFilename}.csv`, { bookType: 'csv' });
    } else {
      XLSX.writeFile(wb, `${fullFilename}.xlsx`, { bookType: 'xlsx' });
    }
  };

  // 1. Ekspor Katalog Buku
  const handleExportBooks = (format: 'xlsx' | 'csv' | 'json') => {
    const data = filteredBooks.map((b, idx) => ({
      No: idx + 1,
      ID_Buku: b.id,
      Judul_Buku: b.title,
      Penulis: b.author,
      Kategori: b.category,
      Tahun_Terbit: b.year,
      Penerbit: b.publisher,
      ISBN: b.isbn || '-',
      Status_Publikasi: b.status,
      Rating: b.rating,
      Jumlah_Pembaca: b.readers,
      Tanggal_Ditambahkan: b.dateAdded ? b.dateAdded.slice(0, 10) : `${b.year}-01-01`,
      Sumber_Naskah: b.sourceName || 'Pustaka BacaYuk',
      Tautan_Naskah: b.fileUrl || b.sourceUrl || '-'
    }));

    downloadSpreadsheet(data, 'Laporan_Katalog_Buku', 'Katalog Buku', format);
  };

  // 2. Ekspor Aktivitas Siswa / Pengguna
  const handleExportUsers = (format: 'xlsx' | 'csv' | 'json') => {
    const data = filteredUsers.map((u, idx) => ({
      No: idx + 1,
      ID_Pengguna: u.id,
      Nama_Lengkap: u.name,
      Username: u.username,
      Email: u.email,
      Buku_Sedang_Dibaca: u.booksRead,
      Buku_Tamat: u.booksCompleted,
      Status_Akun: u.status,
      Tanggal_Bergabung: u.joinDate ? u.joinDate.slice(0, 10) : '-'
    }));

    downloadSpreadsheet(data, 'Laporan_Data_Siswa', 'Pengguna Siswa', format);
  };

  // 3. Ekspor Sirkulasi Peminjaman
  const handleExportLoans = (format: 'xlsx' | 'csv' | 'json') => {
    const data = filteredLoans.map((l, idx) => ({
      No: idx + 1,
      ID_Pinjam: l.id,
      Nama_Siswa: l.userName || 'Siswa',
      Email_Siswa: l.userEmail || '-',
      Judul_Buku: l.bookTitle,
      Tanggal_Pinjam: l.borrowDate,
      Jatuh_Tempo: l.dueDate,
      Tanggal_Kembali: l.returnDate || 'Belum Kembali (Aktif)',
      Denda: l.fineAmount ? `Rp ${l.fineAmount.toLocaleString('id-ID')}` : 'Rp 0',
      Status_Peminjaman: l.status,
      Catatan: l.notes || '-'
    }));

    downloadSpreadsheet(data, 'Laporan_Sirkulasi_Peminjaman', 'Peminjaman', format);
  };

  // 4. Ekspor Riwayat Membaca Siswa (Ketahuan baca buku apa & tanggal berapa)
  const handleExportHistory = (format: 'xlsx' | 'csv' | 'json') => {
    const data = filteredHistory.map((h, idx) => {
      const readDate = h.lastRead ? new Date(h.lastRead) : null;
      const formattedDate = readDate
        ? `${readDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, ${readDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
        : '-';

      return {
        No: idx + 1,
        ID_Riwayat: h.id,
        Nama_Siswa: h.userName || 'Siswa Pembaca',
        Email_Siswa: h.userEmail || '-',
        Judul_Buku: h.bookTitle,
        Penulis: h.author || '-',
        Halaman_Terakhir: h.currentPage,
        Total_Halaman: h.totalPages,
        Progres_Persen: `${h.progress}%`,
        Status_Baca: h.status,
        Tanggal_Dan_Jam_Akses: formattedDate,
        ISO_Timestamp: h.lastRead || '-'
      };
    });

    downloadSpreadsheet(data, 'Laporan_Riwayat_Membaca_Siswa', 'Riwayat Bacaan', format);
  };

  // 4. Unduh Template Impor
  const handleDownloadTemplate = (type: 'books' | 'users' | 'loans') => {
    if (type === 'books') {
      const template = [
        {
          Judul_Buku: 'Laskar Pelangi',
          Penulis: 'Andrea Hirata',
          Kategori: 'Fiksi',
          Tahun_Terbit: 2026,
          Penerbit: 'Bentang Pustaka',
          ISBN: '978-979-3062-79-2',
          Tanggal_Ditambahkan: '2026-11-06',
          Deskripsi: 'Kisah inspiratif anak-anak Belitong meraih cita-cita.',
          Tautan_Naskah: 'https://drive.google.com/...'
        },
        {
          Judul_Buku: 'Negeri 5 Menara',
          Penulis: 'A. Fuadi',
          Kategori: 'Fiksi',
          Tahun_Terbit: 2026,
          Penerbit: 'Gramedia Pustaka Utama',
          ISBN: '978-979-22-4861-6',
          Tanggal_Ditambahkan: '2026-11-06',
          Deskripsi: 'Man Jadda Wajada: Siapa bersungguh-sungguh dia yang berhasil.',
          Tautan_Naskah: ''
        }
      ];
      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template Buku');
      XLSX.writeFile(wb, 'Template_Impor_Buku_BacaYuk.xlsx', { bookType: 'xlsx' });
    } else if (type === 'users') {
      const template = [
        {
          Nama_Lengkap: 'Budi Santoso',
          Username: 'budi_santoso',
          Email: 'budi@sekolah.id',
          Tanggal_Bergabung: '2026-11-06',
          Status_Akun: 'Active'
        },
        {
          Nama_Lengkap: 'Siti Aminah',
          Username: 'siti_aminah',
          Email: 'siti@sekolah.id',
          Tanggal_Bergabung: '2026-11-06',
          Status_Akun: 'Active'
        }
      ];
      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
      XLSX.writeFile(wb, 'Template_Impor_Siswa_BacaYuk.xlsx', { bookType: 'xlsx' });
    } else {
      const template = [
        {
          Judul_Buku: 'Bumi Manusia',
          Nama_Siswa: 'Andi Pratama',
          Tanggal_Pinjam: '2026-11-01',
          Batas_Kembali: '2026-11-08',
          Status: 'Active'
        },
        {
          Judul_Buku: 'BULAN',
          Nama_Siswa: 'Siti Aminah',
          Tanggal_Pinjam: '2026-11-02',
          Batas_Kembali: '2026-11-09',
          Status: 'Active'
        }
      ];
      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template Peminjaman');
      XLSX.writeFile(wb, 'Template_Impor_Peminjaman_BacaYuk.xlsx', { bookType: 'xlsx' });
    }
  };

  // 5. Handle Parsing File Impor (XLSX, XLS, CSV, JSON)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = JSON.parse(event.target?.result as string);
          const rows = Array.isArray(content)
            ? content
            : content.books || content.users || content.loans || [];
          if (!rows.length) {
            setImportError('File JSON tidak memuat data yang valid.');
            return;
          }
          setImportParsedRows(rows);
        } catch {
          setImportError('Format file JSON rusak atau tidak valid.');
        }
      };
      reader.readAsText(file);
    } else {
      // Excel (.xlsx, .xls) atau CSV (.csv) via SheetJS
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(sheet);

          if (!rows || rows.length === 0) {
            setImportError('Spreadsheet/CSV kosong atau tidak memiliki baris data.');
            return;
          }
          setImportParsedRows(rows);
        } catch (err: any) {
          setImportError('Gagal memproses file spreadsheet/CSV: ' + (err.message || 'Error parsing'));
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // 6. Eksekusi Simpan Impor ke LocalStorage & Server Sync
  const handleExecuteImport = () => {
    if (!importParsedRows.length) return;

    // Tentukan tanggal yang akan diterapkan ke baris impor
    let resolvedDate = new Date().toISOString().split('T')[0];
    let resolvedYear = selectedYear;

    if (importDateMode === 'customDate') {
      resolvedDate = importCustomDate;
      resolvedYear = parseInt(importCustomDate.slice(0, 4), 10) || selectedYear;
    } else if (importDateMode === 'customMonth') {
      resolvedDate = `${selectedMonth}-01`;
      resolvedYear = parseInt(selectedMonth.slice(0, 4), 10) || selectedYear;
    } else if (importDateMode === 'customYear') {
      resolvedDate = `${importCustomYear}-01-01`;
      resolvedYear = importCustomYear;
    }

    if (importTarget === 'books') {
      const newBooks: Book[] = importParsedRows.map((r, i) => {
        const title = r.Judul_Buku || r.Judul || r.title || r.Title || `Buku Impor #${i + 1}`;
        const author = r.Penulis || r.author || r.Author || 'Anonim';
        const category = r.Kategori || r.category || r.Category || 'Umum';
        const year = Number(r.Tahun_Terbit || r.Tahun || r.year || r.Year) || resolvedYear;
        const publisher = r.Penerbit || r.publisher || r.Publisher || 'Penerbit BacaYuk';
        const isbn = String(r.ISBN || r.isbn || `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
        const fileUrl = r.Tautan_Naskah || r.Link || r.fileUrl || r.url || undefined;
        const dateAdded = (importDateMode === 'file' && (r.Tanggal_Ditambahkan || r.dateAdded))
          ? String(r.Tanggal_Ditambahkan || r.dateAdded).slice(0, 10)
          : resolvedDate;

        return {
          id: `book_imp_${Date.now()}_${i}`,
          title,
          author,
          category,
          year,
          publisher,
          isbn,
          status: 'Published',
          rating: 4.8,
          readers: 0,
          dateAdded,
          coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300',
          description: r.Deskripsi || r.description || `Buku "${title}" diimpor ke sistem BacaYuk.`,
          fileUrl,
          fileType: fileUrl?.toLowerCase().includes('.pdf') ? 'PDF' : 'LINK',
        };
      });

      const updatedBooks = [...newBooks, ...books];
      setBooks(updatedBooks);
      localStorage.setItem('bacayuk_books', JSON.stringify(updatedBooks));

      // Kirim real-time update ke server
      realtime.publish('BOOKS_UPDATED', { books: updatedBooks });
      fetch('/api/realtime/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books: updatedBooks }),
      }).catch(() => {});

      // Catat notifikasi
      AdminNotificationStorage.addNotification({
        type: 'BOOK_CREATED',
        title: 'Impor Buku Berhasil',
        message: `${newBooks.length} buku baru berhasil diimpor ke katalog (${getHumanPeriodLabel()}).`,
        targetUrl: '/books',
      });

      setImportSuccess(`Berhasil mengimpor ${newBooks.length} buku ke dalam katalog sistem!`);
      setImportParsedRows([]);
      setImportFileName('');
    } else if (importTarget === 'users') {
      const newUsers: User[] = importParsedRows.map((r, i) => {
        const name = r.Nama_Lengkap || r.Nama || r.name || `Siswa Baru #${i + 1}`;
        const username = (r.Username || r.username || name.toLowerCase().replace(/\s+/g, '_')).toLowerCase();
        const email = r.Email || r.email || `${username}@sekolah.id`;
        const joinDate = (importDateMode === 'file' && (r.Tanggal_Bergabung || r.joinDate))
          ? String(r.Tanggal_Bergabung || r.joinDate).slice(0, 10)
          : resolvedDate;

        return {
          id: `u_imp_${Date.now()}_${i}`,
          name,
          username,
          email,
          joinDate,
          booksRead: 0,
          booksCompleted: 0,
          status: 'Active',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        };
      });

      const updatedUsers = [...newUsers, ...users];
      setUsers(updatedUsers);
      localStorage.setItem('bacayuk_users', JSON.stringify(updatedUsers));

      AdminNotificationStorage.addNotification({
        type: 'USER_JOINED',
        title: 'Impor Siswa Berhasil',
        message: `${newUsers.length} akun siswa berhasil diimpor ke sistem.`,
        targetUrl: '/users',
      });

      setImportSuccess(`Berhasil mengimpor ${newUsers.length} akun siswa ke sistem!`);
      setImportParsedRows([]);
      setImportFileName('');
    }
  };

  // Data Retensi Bacaan / Funnel Pembacaan
  const retentionFunnelData = [
    { stage: 'Mulai Buka Buku', percentage: 100, count: 5200, fill: '#8a6d1c' },
    { stage: 'Membaca Bab 1 (25%)', percentage: 86, count: 4472, fill: '#a4842d' },
    { stage: 'Pertengahan Bab (50%)', percentage: 68, count: 3536, fill: '#bfa04a' },
    { stage: 'Menuju Akhir (75%)', percentage: 54, count: 2808, fill: '#d4bc6d' },
    { stage: 'Tamat Membaca (100%)', percentage: 48, count: 2496, fill: '#2a160b' },
  ];

  const categoryRetentionData = [
    { category: 'Novel & Fiksi', tamat: 72, ditinggalkan: 28 },
    { category: 'Pendidikan', tamat: 65, ditinggalkan: 35 },
    { category: 'Cerita Anak', tamat: 88, ditinggalkan: 12 },
    { category: 'Sejarah', tamat: 52, ditinggalkan: 48 },
    { category: 'Nonfiksi', tamat: 59, ditinggalkan: 41 },
  ];

  const topCompletedBooks = [
    { title: 'Laskar Pelangi', author: 'Andrea Hirata', completionRate: 92, readers: 3400, avgDuration: '4.2 jam' },
    { title: 'Bulan', author: 'Tere Liye', completionRate: 90, readers: 4800, avgDuration: '5.4 jam' },
    { title: 'Bumi', author: 'Tere Liye', completionRate: 89, readers: 5900, avgDuration: '5.1 jam' },
    { title: 'Atomic Habits', author: 'James Clear', completionRate: 85, readers: 5200, avgDuration: '6.5 jam' },
    { title: 'Laut Bercerita', author: 'Leila S. Chudori', completionRate: 83, readers: 8100, avgDuration: '5.8 jam' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Utama & Pilihan Tab */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black font-serif text-[#2a160b] flex items-center gap-2">
            <FileBarChart className="w-7 h-7 text-[#8a6d1c]" />
            Laporan, Ekspor & Impor Data
          </h1>
          <p className="text-sm font-medium text-[#5a3a22]">
            Pusat manajemen data terpadu: saring dan ekspor/impor per tanggal, per bulan, atau per tahun
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Cetak Dokumen PDF Resmi */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#d4c3a3] hover:bg-[#ebdcb8] text-[#3a2012] text-xs font-bold rounded-xl transition-all shadow-2xs"
            title="Cetak atau Simpan sebagai PDF"
          >
            <Printer className="w-4 h-4 text-[#8a6d1c]" />
            <span>Cetak Dokumen</span>
          </button>

          {/* Tab Switcher 3 Mode */}
          <div className="flex bg-[#ebdcb8] p-1 rounded-xl border border-[#d4c3a3]">
            <button
              onClick={() => setActiveReportTab('export')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeReportTab === 'export'
                  ? 'bg-[#3a2012] text-[#f9f6f0] shadow-sm'
                  : 'text-[#5a3a22] hover:text-[#2a160b]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Pusat Ekspor
            </button>
            <button
              onClick={() => setActiveReportTab('import')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeReportTab === 'import'
                  ? 'bg-[#3a2012] text-[#f9f6f0] shadow-sm'
                  : 'text-[#5a3a22] hover:text-[#2a160b]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Pusat Impor
            </button>
            <button
              onClick={() => setActiveReportTab('retention')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeReportTab === 'retention'
                  ? 'bg-[#3a2012] text-[#f9f6f0] shadow-sm'
                  : 'text-[#5a3a22] hover:text-[#2a160b]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Grafik Retensi
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FILTER PERIODE DINAMIS: PER TANGGAL / PER BULAN / PER TAHUN */}
      {/* ======================================================== */}
      <div className="bg-[#f9f6f0] p-4 sm:p-5 rounded-2xl border border-[#d4c3a3] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#ebdcb8] text-[#8a6d1c] flex items-center justify-center border border-[#d4c3a3]">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#2a160b] text-sm flex items-center gap-2">
                Penyaring Periode Ekspor & Impor
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-[#ebdcb8] text-[#5a3a22]">
                  {getHumanPeriodLabel()}
                </span>
              </h3>
              <p className="text-xs text-[#8a6d1c]">
                Pilih rentang data berdasarkan tanggal harian, bulan kalender, atau tahunan
              </p>
            </div>
          </div>

          {/* Opsi Pilihan Mode Periode */}
          <div className="flex items-center flex-wrap gap-1.5 bg-[#ebdcb8]/60 p-1 rounded-xl border border-[#d4c3a3]">
            <button
              onClick={() => setPeriodMode('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                periodMode === 'all'
                  ? 'bg-[#8a6d1c] text-white shadow-xs'
                  : 'text-[#5a3a22] hover:bg-[#ebdcb8]'
              }`}
            >
              Semua Waktu
            </button>

            <button
              onClick={() => setPeriodMode('date')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                periodMode === 'date'
                  ? 'bg-[#8a6d1c] text-white shadow-xs'
                  : 'text-[#5a3a22] hover:bg-[#ebdcb8]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Per Tanggal
            </button>

            <button
              onClick={() => setPeriodMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                periodMode === 'month'
                  ? 'bg-[#8a6d1c] text-white shadow-xs'
                  : 'text-[#5a3a22] hover:bg-[#ebdcb8]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Per Bulan
            </button>

            <button
              onClick={() => setPeriodMode('year')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                periodMode === 'year'
                  ? 'bg-[#8a6d1c] text-white shadow-xs'
                  : 'text-[#5a3a22] hover:bg-[#ebdcb8]'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Per Tahun
            </button>
          </div>
        </div>

        {/* Input Spesifik Sesuai Pilihan Mode Periode */}
        <div className="pt-2 border-t border-[#d4c3a3]/60 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center flex-wrap gap-3">
            {periodMode === 'date' && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#2a160b]">Pilih Tanggal:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#d4c3a3] rounded-lg text-xs font-semibold text-[#2a160b] focus:outline-none focus:ring-1 focus:ring-[#8a6d1c]"
                />
              </div>
            )}

            {periodMode === 'month' && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#2a160b]">Pilih Bulan & Tahun:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#d4c3a3] rounded-lg text-xs font-semibold text-[#2a160b] focus:outline-none focus:ring-1 focus:ring-[#8a6d1c]"
                />
              </div>
            )}

            {periodMode === 'year' && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#2a160b]">Pilih Tahun:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 bg-white border border-[#d4c3a3] rounded-lg text-xs font-semibold text-[#2a160b] focus:outline-none focus:ring-1 focus:ring-[#8a6d1c]"
                >
                  <option value={2026}>Tahun 2026</option>
                  <option value={2025}>Tahun 2025</option>
                  <option value={2024}>Tahun 2024</option>
                  <option value={2023}>Tahun 2023</option>
                  <option value={2022}>Tahun 2022</option>
                </select>
              </div>
            )}

            {periodMode === 'all' && (
              <span className="text-[#8a6d1c] font-medium">
                Menampilkan seluruh data dari awal platform dibuat hingga saat ini.
              </span>
            )}
          </div>

          {/* Ringkasan Jumlah Baris Data yang Terfilter */}
          <div className="flex items-center gap-2 sm:gap-3 font-semibold text-[#5a3a22] flex-wrap">
            <span className="px-2 py-1 bg-white rounded-md border border-[#d4c3a3]">
              📚 <strong className="text-[#2a160b]">{filteredBooks.length}</strong> Buku
            </span>
            <span className="px-2 py-1 bg-white rounded-md border border-[#d4c3a3]">
              👥 <strong className="text-[#2a160b]">{filteredUsers.length}</strong> Siswa
            </span>
            <span className="px-2 py-1 bg-white rounded-md border border-[#d4c3a3]">
              🔄 <strong className="text-[#2a160b]">{filteredLoans.length}</strong> Peminjaman
            </span>
            <span className="px-2 py-1 bg-white rounded-md border border-[#d4c3a3]">
              📖 <strong className="text-[#2a160b]">{filteredHistory.length}</strong> Riwayat Baca
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PUSAT EKSPOR DATA (EXCEL, CSV, JSON)             */}
      {/* ======================================================== */}
      {activeReportTab === 'export' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Kartu Ekspor 1: Katalog Buku */}
            <div className="bg-[#f9f6f0] rounded-2xl border border-[#d4c3a3] p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#ebdcb8] text-[#8a6d1c] flex items-center justify-center mb-3 border border-[#d4c3a3]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#2a160b]">Katalog & Naskah Buku</h4>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#ebdcb8] text-[#8a6d1c]">
                    {filteredBooks.length} Data
                  </span>
                </div>
                <p className="text-xs text-[#5a3a22] mt-1 leading-relaxed">
                  Data judul, penulis, genre, tahun terbit, rating, dan naskah digital sesuai {getHumanPeriodLabel()}.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#d4c3a3]/50">
                <button
                  onClick={() => handleExportBooks('xlsx')}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#8a6d1c] hover:bg-[#6e5614] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Ekspor Excel (.xlsx)
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExportBooks('csv')}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#d4c3a3] hover:bg-[#ebdcb8] text-[#3a2012] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#8a6d1c]" />
                    Format CSV
                  </button>
                  <button
                    onClick={() => handleExportBooks('json')}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#d4c3a3] hover:bg-[#ebdcb8] text-[#3a2012] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5 text-[#8a6d1c]" />
                    Format JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Kartu Ekspor 2: Data Pengguna & Siswa */}
            <div className="bg-[#f9f6f0] rounded-2xl border border-[#d4c3a3] p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#ebdcb8] text-[#8a6d1c] flex items-center justify-center mb-3 border border-[#d4c3a3]">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#2a160b]">Data Siswa & Pengguna</h4>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#ebdcb8] text-[#8a6d1c]">
                    {filteredUsers.length} Data
                  </span>
                </div>
                <p className="text-xs text-[#5a3a22] mt-1 leading-relaxed">
                  Daftar akun siswa terdaftar, statistik buku dibaca, buku tamat, dan keaktifan {getHumanPeriodLabel()}.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#d4c3a3]/50">
                <button
                  onClick={() => handleExportUsers('xlsx')}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#8a6d1c] hover:bg-[#6e5614] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Ekspor Excel (.xlsx)
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExportUsers('csv')}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#d4c3a3] hover:bg-[#ebdcb8] text-[#3a2012] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#8a6d1c]" />
                    Format CSV
                  </button>
                  <button
                    onClick={() => handleExportUsers('json')}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#d4c3a3] hover:bg-[#ebdcb8] text-[#3a2012] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5 text-[#8a6d1c]" />
                    Format JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Kartu Ekspor 3: Sirkulasi Peminjaman */}
            <div className="bg-[#f9f6f0] rounded-2xl border border-[#d4c3a3] p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#ebdcb8] text-[#8a6d1c] flex items-center justify-center mb-3 border border-[#d4c3a3]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#2a160b]">Sirkulasi & Peminjaman</h4>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#ebdcb8] text-[#8a6d1c]">
                    {filteredLoans.length} Data
                  </span>
                </div>
                <p className="text-xs text-[#5a3a22] mt-1 leading-relaxed">
                  Ketahuan siswa pinjam buku apa, tanggal peminjaman, jatuh tempo, dan denda pada {getHumanPeriodLabel()}.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#d4c3a3]/50">
                <button
                  onClick={() => handleExportLoans('xlsx')}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#8a6d1c] hover:bg-[#6e5614] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Ekspor Excel (.xlsx)
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExportLoans('csv')}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#d4c3a3] hover:bg-[#ebdcb8] text-[#3a2012] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#8a6d1c]" />
                    Format CSV
                  </button>
                  <button
                    onClick={() => handleExportLoans('json')}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#d4c3a3] hover:bg-[#ebdcb8] text-[#3a2012] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5 text-[#8a6d1c]" />
                    Format JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Kartu Ekspor 4: Riwayat Membaca Siswa (Ketahuan baca apa & tanggal berapa) */}
            <div className="bg-[#f9f6f0] rounded-2xl border border-[#d4c3a3] p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#ebdcb8] text-[#8a6d1c] flex items-center justify-center mb-3 border border-[#d4c3a3]">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#2a160b]">Riwayat Membaca Siswa</h4>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#ebdcb8] text-[#8a6d1c]">
                    {filteredHistory.length} Data
                  </span>
                </div>
                <p className="text-xs text-[#5a3a22] mt-1 leading-relaxed">
                  Ketahuan siswa membaca buku apa, halaman berapa, jam berapa, serta progres baca pada {getHumanPeriodLabel()}.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#d4c3a3]/50">
                <button
                  onClick={() => handleExportHistory('xlsx')}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#8a6d1c] hover:bg-[#6e5614] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Ekspor Excel (.xlsx)
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExportHistory('csv')}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#d4c3a3] hover:bg-[#ebdcb8] text-[#3a2012] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#8a6d1c]" />
                    Format CSV
                  </button>
                  <button
                    onClick={() => handleExportHistory('json')}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#d4c3a3] hover:bg-[#ebdcb8] text-[#3a2012] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5 text-[#8a6d1c]" />
                    Format JSON
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* PRATINJAU TABEL DATA AKTIVITAS SISWA SESUAI PERIODE     */}
          {/* ======================================================== */}
          <div className="bg-[#f9f6f0] rounded-2xl border border-[#d4c3a3] shadow-sm overflow-hidden">
            {/* Header Tabel */}
            <div className="p-4 sm:p-5 border-b border-[#d4c3a3]/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#ebdcb8] text-[#8a6d1c] flex items-center justify-center border border-[#d4c3a3]">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2a160b] text-base flex items-center gap-2">
                      Pratinjau Rekap Aktivitas Siswa
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-[#ebdcb8] text-[#5a3a22]">
                        {getHumanPeriodLabel()}
                      </span>
                    </h3>
                    <p className="text-xs text-[#5a3a22]">
                      Lihat rincian buku yang dipinjam atau dibaca oleh siswa beserta tanggal dan jamnya
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-tab Switcher & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a6d1c]" />
                  <input
                    type="text"
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    placeholder="Cari nama siswa atau buku..."
                    className="w-full sm:w-56 pl-8 pr-7 py-1.5 bg-white border border-[#d4c3a3] rounded-xl text-xs font-medium text-[#2a160b] placeholder:text-[#a4842d] focus:outline-none focus:ring-1 focus:ring-[#8a6d1c]"
                  />
                  {tableSearchQuery && (
                    <button 
                      onClick={() => setTableSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex bg-[#ebdcb8] p-1 rounded-xl border border-[#d4c3a3] overflow-x-auto">
                  <button
                    onClick={() => setActivePreviewTable('loans')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      activePreviewTable === 'loans'
                        ? 'bg-[#3a2012] text-[#f9f6f0] shadow-2xs'
                        : 'text-[#5a3a22] hover:text-[#2a160b]'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Peminjaman ({filteredLoans.length})
                  </button>
                  <button
                    onClick={() => setActivePreviewTable('history')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      activePreviewTable === 'history'
                        ? 'bg-[#3a2012] text-[#f9f6f0] shadow-2xs'
                        : 'text-[#5a3a22] hover:text-[#2a160b]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Riwayat Baca ({filteredHistory.length})
                  </button>
                  <button
                    onClick={() => setActivePreviewTable('users')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      activePreviewTable === 'users'
                        ? 'bg-[#3a2012] text-[#f9f6f0] shadow-2xs'
                        : 'text-[#5a3a22] hover:text-[#2a160b]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Siswa ({filteredUsers.length})
                  </button>
                  <button
                    onClick={() => setActivePreviewTable('books')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      activePreviewTable === 'books'
                        ? 'bg-[#3a2012] text-[#f9f6f0] shadow-2xs'
                        : 'text-[#5a3a22] hover:text-[#2a160b]'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Buku ({filteredBooks.length})
                  </button>
                </div>
              </div>
            </div>

            {/* TABEL 1: PEMINJAMAN BUKU */}
            {activePreviewTable === 'loans' && (
              <div className="overflow-x-auto">
                {(() => {
                  const filtered = filteredLoans.filter(l => 
                    !tableSearchQuery || 
                    (l.userName && l.userName.toLowerCase().includes(tableSearchQuery.toLowerCase())) ||
                    (l.bookTitle && l.bookTitle.toLowerCase().includes(tableSearchQuery.toLowerCase())) ||
                    (l.userEmail && l.userEmail.toLowerCase().includes(tableSearchQuery.toLowerCase()))
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-[#8a6d1c]">
                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="font-bold text-sm text-[#2a160b]">Tidak ada data peminjaman buku pada periode ini</p>
                        <p className="text-xs text-[#5a3a22] mt-1">Ubah filter periode di atas atau pilih &quot;Semua Waktu&quot;.</p>
                      </div>
                    );
                  }

                  return (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#ebdcb8]/70 border-b border-[#d4c3a3] text-[#2a160b] font-bold">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4">Nama Siswa</th>
                          <th className="py-3 px-4">Buku Dipinjam</th>
                          <th className="py-3 px-4">Tanggal Pinjam</th>
                          <th className="py-3 px-4">Jatuh Tempo</th>
                          <th className="py-3 px-4">Tanggal Kembali</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d4c3a3]/40 bg-white/60">
                        {filtered.map((loan, idx) => (
                          <tr key={loan.id} className="hover:bg-[#ebdcb8]/30 transition-colors">
                            <td className="py-3 px-4 text-center font-bold text-[#8a6d1c]">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#ebdcb8] text-[#8a6d1c] font-bold text-xs flex items-center justify-center shrink-0 border border-[#d4c3a3]">
                                  {loan.userName?.charAt(0) || 'S'}
                                </div>
                                <div>
                                  <p className="font-bold text-[#2a160b]">{loan.userName || 'Siswa'}</p>
                                  <p className="text-[11px] text-[#5a3a22]">{loan.userEmail || '-'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                {loan.bookCover && (
                                  <img 
                                    src={loan.bookCover} 
                                    alt={loan.bookTitle}
                                    className="w-7 h-10 object-cover rounded shadow-2xs shrink-0" 
                                  />
                                )}
                                <span className="font-bold text-[#2a160b]">{loan.bookTitle}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-[#2a160b]">
                              {loan.borrowDate}
                            </td>
                            <td className="py-3 px-4 text-[#5a3a22]">
                              {loan.dueDate}
                            </td>
                            <td className="py-3 px-4 text-[#5a3a22]">
                              {loan.returnDate || <span className="text-amber-700 italic">Belum Kembali</span>}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                loan.status === 'Dikembalikan'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : loan.status === 'Terlambat'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {loan.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            )}

            {/* TABEL 2: RIWAYAT MEMBACA SISWA */}
            {activePreviewTable === 'history' && (
              <div className="overflow-x-auto">
                {(() => {
                  const filtered = filteredHistory.filter(h => 
                    !tableSearchQuery || 
                    (h.userName && h.userName.toLowerCase().includes(tableSearchQuery.toLowerCase())) ||
                    (h.bookTitle && h.bookTitle.toLowerCase().includes(tableSearchQuery.toLowerCase())) ||
                    (h.userEmail && h.userEmail.toLowerCase().includes(tableSearchQuery.toLowerCase()))
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-[#8a6d1c]">
                        <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="font-bold text-sm text-[#2a160b]">Tidak ada data riwayat membaca pada periode ini</p>
                        <p className="text-xs text-[#5a3a22] mt-1">Ubah filter periode di atas atau pilih &quot;Semua Waktu&quot;.</p>
                      </div>
                    );
                  }

                  return (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#ebdcb8]/70 border-b border-[#d4c3a3] text-[#2a160b] font-bold">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4">Nama Siswa</th>
                          <th className="py-3 px-4">Buku Yang Dibaca</th>
                          <th className="py-3 px-4">Waktu Terakhir Dibaca</th>
                          <th className="py-3 px-4">Halaman & Progres</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d4c3a3]/40 bg-white/60">
                        {filtered.map((item, idx) => {
                          const readDate = item.lastRead ? new Date(item.lastRead) : null;
                          const formattedDate = readDate
                            ? `${readDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, ${readDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                            : '-';

                          return (
                            <tr key={item.id} className="hover:bg-[#ebdcb8]/30 transition-colors">
                              <td className="py-3 px-4 text-center font-bold text-[#8a6d1c]">{idx + 1}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-[#ebdcb8] text-[#8a6d1c] font-bold text-xs flex items-center justify-center shrink-0 border border-[#d4c3a3]">
                                    {item.userName?.charAt(0) || 'S'}
                                  </div>
                                  <div>
                                    <p className="font-bold text-[#2a160b]">{item.userName || 'Siswa'}</p>
                                    <p className="text-[11px] text-[#5a3a22]">{item.userEmail || '-'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  {item.coverUrl && (
                                    <img 
                                      src={item.coverUrl} 
                                      alt={item.bookTitle}
                                      className="w-7 h-10 object-cover rounded shadow-2xs shrink-0" 
                                    />
                                  )}
                                  <div>
                                    <p className="font-bold text-[#2a160b]">{item.bookTitle}</p>
                                    <p className="text-[11px] text-[#8a6d1c]">{item.author || '-'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-semibold text-[#2a160b]">
                                {formattedDate}
                              </td>
                              <td className="py-3 px-4">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold text-[#2a160b]">
                                    <span>Hlm {item.currentPage} / {item.totalPages}</span>
                                    <span>{item.progress}%</span>
                                  </div>
                                  <div className="w-28 h-1.5 bg-[#ebdcb8] rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-[#8a6d1c] rounded-full transition-all"
                                      style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                  item.status === 'Selesai'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            )}

            {/* TABEL 3: DATA PENGGUNA SISWA */}
            {activePreviewTable === 'users' && (
              <div className="overflow-x-auto">
                {(() => {
                  const filtered = filteredUsers.filter(u => 
                    !tableSearchQuery || 
                    u.name.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                    u.username.toLowerCase().includes(tableSearchQuery.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-[#8a6d1c]">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="font-bold text-sm text-[#2a160b]">Tidak ada data siswa pada periode ini</p>
                        <p className="text-xs text-[#5a3a22] mt-1">Ubah filter periode di atas atau pilih &quot;Semua Waktu&quot;.</p>
                      </div>
                    );
                  }

                  return (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#ebdcb8]/70 border-b border-[#d4c3a3] text-[#2a160b] font-bold">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4">Nama Siswa</th>
                          <th className="py-3 px-4">Username</th>
                          <th className="py-3 px-4 text-center">Buku Dibaca</th>
                          <th className="py-3 px-4 text-center">Buku Tamat</th>
                          <th className="py-3 px-4">Tanggal Bergabung</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d4c3a3]/40 bg-white/60">
                        {filtered.map((user, idx) => (
                          <tr key={user.id} className="hover:bg-[#ebdcb8]/30 transition-colors">
                            <td className="py-3 px-4 text-center font-bold text-[#8a6d1c]">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#ebdcb8] text-[#8a6d1c] font-bold text-xs flex items-center justify-center shrink-0 border border-[#d4c3a3]">
                                  {user.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-[#2a160b]">{user.name}</p>
                                  <p className="text-[11px] text-[#5a3a22]">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[#5a3a22]">@{user.username}</td>
                            <td className="py-3 px-4 text-center font-bold text-[#2a160b]">{user.booksRead}</td>
                            <td className="py-3 px-4 text-center font-bold text-emerald-800">{user.booksCompleted}</td>
                            <td className="py-3 px-4 text-[#5a3a22]">{user.joinDate ? user.joinDate.slice(0, 10) : '-'}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                user.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            )}

            {/* TABEL 4: KATALOG BUKU */}
            {activePreviewTable === 'books' && (
              <div className="overflow-x-auto">
                {(() => {
                  const filtered = filteredBooks.filter(b => 
                    !tableSearchQuery || 
                    b.title.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                    b.author.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
                    b.category.toLowerCase().includes(tableSearchQuery.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-[#8a6d1c]">
                        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="font-bold text-sm text-[#2a160b]">Tidak ada buku pada periode ini</p>
                        <p className="text-xs text-[#5a3a22] mt-1">Ubah filter periode di atas atau pilih &quot;Semua Waktu&quot;.</p>
                      </div>
                    );
                  }

                  return (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#ebdcb8]/70 border-b border-[#d4c3a3] text-[#2a160b] font-bold">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4">Judul & Penulis</th>
                          <th className="py-3 px-4">Kategori</th>
                          <th className="py-3 px-4">Tahun</th>
                          <th className="py-3 px-4 text-center">Rating</th>
                          <th className="py-3 px-4">Tanggal Ditambahkan</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d4c3a3]/40 bg-white/60">
                        {filtered.map((book, idx) => (
                          <tr key={book.id} className="hover:bg-[#ebdcb8]/30 transition-colors">
                            <td className="py-3 px-4 text-center font-bold text-[#8a6d1c]">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                {book.coverUrl && (
                                  <img 
                                    src={book.coverUrl} 
                                    alt={book.title}
                                    className="w-7 h-10 object-cover rounded shadow-2xs shrink-0" 
                                  />
                                )}
                                <div>
                                  <p className="font-bold text-[#2a160b]">{book.title}</p>
                                  <p className="text-[11px] text-[#8a6d1c]">{book.author}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[#5a3a22] font-medium">{book.category}</td>
                            <td className="py-3 px-4 text-[#5a3a22]">{book.year}</td>
                            <td className="py-3 px-4 text-center font-bold text-amber-700">★ {book.rating || '0'}</td>
                            <td className="py-3 px-4 text-[#5a3a22]">{book.dateAdded ? book.dateAdded.slice(0, 10) : `${book.year}-01-01`}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                book.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {book.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PUSAT IMPOR DATA (EXCEL, CSV, JSON DENGAN PERIODE)*/}
      {/* ======================================================== */}
      {activeReportTab === 'import' && (
        <div className="space-y-6">
          {/* Banner Notifikasi Keberhasilan atau Error */}
          {importSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-800 font-bold animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{importSuccess}</span>
              </div>
              <button onClick={() => setImportSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {importError && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between text-xs text-rose-800 font-bold animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>{importError}</span>
              </div>
              <button onClick={() => setImportError(null)} className="text-rose-700 hover:text-rose-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pengaturan Impor */}
            <div className="bg-[#f9f6f0] p-6 rounded-2xl border border-[#d4c3a3] shadow-sm space-y-4">
              <h3 className="font-bold text-[#2a160b] text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#8a6d1c]" />
                1. Pengaturan Impor Data
              </h3>

              {/* Pilihan Target Data */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2a160b]">Kategori Data yang Diimpor:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setImportTarget('books');
                      setImportParsedRows([]);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      importTarget === 'books'
                        ? 'bg-[#8a6d1c] text-white border-[#8a6d1c]'
                        : 'bg-white text-[#3a2012] border-[#d4c3a3] hover:bg-[#ebdcb8]'
                    }`}
                  >
                    📚 Katalog Buku
                  </button>
                  <button
                    onClick={() => {
                      setImportTarget('users');
                      setImportParsedRows([]);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      importTarget === 'users'
                        ? 'bg-[#8a6d1c] text-white border-[#8a6d1c]'
                        : 'bg-white text-[#3a2012] border-[#d4c3a3] hover:bg-[#ebdcb8]'
                    }`}
                  >
                    👥 Data Siswa
                  </button>
                </div>
              </div>

              {/* Pengaturan Tanggal / Periode Impor */}
              <div className="space-y-2 pt-2 border-t border-[#d4c3a3]/60">
                <label className="text-xs font-bold text-[#2a160b] flex items-center justify-between">
                  <span>Atur Tanggal / Periode Data:</span>
                </label>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-[#3a2012] cursor-pointer">
                    <input
                      type="radio"
                      name="importDateMode"
                      checked={importDateMode === 'file'}
                      onChange={() => setImportDateMode('file')}
                      className="accent-[#8a6d1c]"
                    />
                    <span>Gunakan tanggal yang ada di file</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-[#3a2012] cursor-pointer">
                    <input
                      type="radio"
                      name="importDateMode"
                      checked={importDateMode === 'customDate'}
                      onChange={() => setImportDateMode('customDate')}
                      className="accent-[#8a6d1c]"
                    />
                    <span>Terapkan Tanggal Tertentu (Harian)</span>
                  </label>
                  {importDateMode === 'customDate' && (
                    <input
                      type="date"
                      value={importCustomDate}
                      onChange={(e) => setImportCustomDate(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-[#d4c3a3] rounded-lg text-xs font-semibold text-[#2a160b]"
                    />
                  )}

                  <label className="flex items-center gap-2 text-xs text-[#3a2012] cursor-pointer">
                    <input
                      type="radio"
                      name="importDateMode"
                      checked={importDateMode === 'customMonth'}
                      onChange={() => setImportDateMode('customMonth')}
                      className="accent-[#8a6d1c]"
                    />
                    <span>Terapkan Bulan Tertentu ({selectedMonth})</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-[#3a2012] cursor-pointer">
                    <input
                      type="radio"
                      name="importDateMode"
                      checked={importDateMode === 'customYear'}
                      onChange={() => setImportDateMode('customYear')}
                      className="accent-[#8a6d1c]"
                    />
                    <span>Terapkan Tahun Tertentu</span>
                  </label>
                  {importDateMode === 'customYear' && (
                    <select
                      value={importCustomYear}
                      onChange={(e) => setImportCustomYear(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-[#d4c3a3] rounded-lg text-xs font-semibold text-[#2a160b]"
                    >
                      <option value={2026}>Tahun 2026</option>
                      <option value={2025}>Tahun 2025</option>
                      <option value={2024}>Tahun 2024</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Unduh Format Template */}
              <div className="pt-3 border-t border-[#d4c3a3]/60 space-y-1.5">
                <span className="text-[11px] font-bold text-[#8a6d1c]">Unduh Contoh Template Format:</span>
                <button
                  onClick={() => handleDownloadTemplate(importTarget)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-[#d4c3a3] hover:bg-[#ebdcb8] text-[#3a2012] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  Unduh Template Excel ({importTarget === 'books' ? 'Buku' : importTarget === 'users' ? 'Siswa' : 'Peminjaman'})
                </button>
              </div>
            </div>

            {/* Unggah File & Area Dropzone */}
            <div className="lg:col-span-2 bg-[#f9f6f0] p-6 rounded-2xl border border-[#d4c3a3] shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-bold text-[#2a160b] text-base mb-1">
                  2. Unggah Berkas Spreadsheet / CSV / JSON
                </h3>
                <p className="text-xs text-[#5a3a22] leading-relaxed">
                  Sistem mendukung file Microsoft Excel (.xlsx, .xls), CSV (.csv), dan JSON (.json). Data akan divalidasi dan ditampilkan pada pratinjau sebelum disimpan.
                </p>

                {/* Dropzone Box */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls, .csv, .json"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 border-2 border-dashed border-[#8a6d1c]/40 hover:border-[#8a6d1c] bg-[#ebdcb8]/20 hover:bg-[#ebdcb8]/40 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#ebdcb8] text-[#8a6d1c] flex items-center justify-center shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2a160b]">
                      {importFileName ? importFileName : 'Klik atau seret file ke sini untuk mengunggah'}
                    </p>
                    <p className="text-xs text-[#8a6d1c] mt-0.5">
                      Mendukung .XLSX, .XLS, .CSV, atau .JSON (Maksimal 10 MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Pratinjau Data yang Siap Diimpor */}
              {importParsedRows.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#d4c3a3]/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-700" />
                      <span className="text-xs font-bold text-[#2a160b]">
                        Pratinjau Data: Terdeteksi <strong>{importParsedRows.length}</strong> baris data siap diimpor
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setImportParsedRows([]);
                        setImportFileName('');
                      }}
                      className="text-xs text-rose-700 hover:underline font-bold"
                    >
                      Batal / Bersihkan
                    </button>
                  </div>

                  {/* Tabel Mini Pratinjau 5 Baris Pertama */}
                  <div className="max-h-48 overflow-x-auto overflow-y-auto rounded-xl border border-[#d4c3a3] bg-white">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-[#ebdcb8] text-[#2a160b] font-bold sticky top-0">
                        <tr>
                          {Object.keys(importParsedRows[0] || {}).slice(0, 6).map((k) => (
                            <th key={k} className="p-2 border-b border-[#d4c3a3]">
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebdcb8]/60 text-[#3a2012]">
                        {importParsedRows.slice(0, 5).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-[#ebdcb8]/20">
                            {Object.keys(importParsedRows[0] || {}).slice(0, 6).map((k) => (
                              <td key={k} className="p-2 truncate max-w-[150px]">
                                {String(row[k] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {importParsedRows.length > 5 && (
                    <p className="text-[10px] text-[#a49373] text-right font-medium">
                      + Menampilkan 5 dari {importParsedRows.length} total baris naskah
                    </p>
                  )}

                  {/* Tombol Konfirmasi Impor */}
                  <button
                    onClick={handleExecuteImport}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#8a6d1c] hover:bg-[#6e5614] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Konfirmasi & Simpan Impor {importParsedRows.length} Data ke Sistem
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: GRAFIK & ANALISIS RETENSI BACAAN                  */}
      {/* ======================================================== */}
      {activeReportTab === 'retention' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel Retensi Progres Bacaan */}
            <div className="bg-[#f9f6f0] p-6 rounded-2xl border border-[#d4c3a3] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[#2a160b] text-base">Funnel Retensi Progres Bacaan</h3>
                  <p className="text-xs text-[#5a3a22] mt-0.5">Persentase pembaca yang bertahan dari bab awal hingga tamat</p>
                </div>
                <span className="px-2.5 py-1 bg-[#ebdcb8] text-[#8a6d1c] text-xs font-bold rounded-lg border border-[#d4c3a3]">
                  {getHumanPeriodLabel()}
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {retentionFunnelData.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#3a2012] flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#ebdcb8] text-[#8a6d1c] text-[10px] flex items-center justify-center font-black">
                          {idx + 1}
                        </span>
                        {item.stage}
                      </span>
                      <span className="font-black text-[#2a160b]">
                        {item.percentage}% <span className="font-normal text-[11px] text-[#a49373]">({item.count.toLocaleString()} sesi)</span>
                      </span>
                    </div>
                    <div className="w-full bg-[#ebdcb8] rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.fill,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Perbandingan Retensi per Kategori Buku */}
            <div className="bg-[#f9f6f0] p-6 rounded-2xl border border-[#d4c3a3] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[#2a160b] text-base">Tingkat Tamat vs Ditinggalkan per Genre</h3>
                  <p className="text-xs text-[#5a3a22] mt-0.5">Perbandingan persentase penyelesaian antar kategori buku</p>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryRetentionData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d4c3a3" />
                    <XAxis dataKey="category" tick={{ fill: '#8a6d1c', fontSize: 11, fontWeight: 'bold' }} />
                    <YAxis tick={{ fill: '#8a6d1c', fontSize: 11 }} unit="%" />
                    <Tooltip
                      formatter={(val) => [`${val}%`, '']}
                      contentStyle={{ backgroundColor: '#f9f6f0', borderRadius: '8px', border: '1px solid #d4c3a3', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="tamat" name="Selesai Tamat (%)" fill="#8a6d1c" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ditinggalkan" name="Ditinggalkan di Jalan (%)" fill="#d4c3a3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Buku Paling Sering Diselesaikan */}
          <div className="bg-[#f9f6f0] rounded-2xl border border-[#d4c3a3] shadow-sm overflow-hidden">
            <div className="p-4 bg-[#f0e6d2] border-b border-[#d4c3a3] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-[#2a160b] text-sm">Buku Paling Sering Selesai Dibaca Tamat (Top Completion)</h3>
              </div>
              <span className="text-xs text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">Top 5</span>
            </div>
            <div className="divide-y divide-[#ebdcb8]">
              {topCompletedBooks.map((b, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-[#ebdcb8]/30 transition-colors">
                  <div>
                    <div className="font-bold text-[#2a160b] text-sm">{b.title}</div>
                    <div className="text-xs text-[#8a6d1c]">{b.author} • {b.readers.toLocaleString()} pembaca</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-700">{b.completionRate}% Tamat</div>
                    <div className="text-[11px] text-[#a49373] font-medium">Avg durasi: {b.avgDuration}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
