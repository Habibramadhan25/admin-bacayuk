import React, { useState } from 'react';
import { 
  Repeat, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  BookOpen, 
  Users, 
  ArrowRight, 
  Filter, 
  RotateCcw,
  Bell,
  X,
  FileText,
  Check,
  AlertCircle,
  HelpCircle,
  CornerDownLeft,
  ChevronRight
} from 'lucide-react';
import { 
  CirculationLoan, 
  Book, 
  User, 
  initialLoans, 
  initialBooks, 
  initialUsers, 
  initLocalStorage 
} from '../lib/mockData';
import { realtime } from '../lib/realtime';

export const Circulation: React.FC = () => {
  initLocalStorage();

  const [loans, setLoans] = useState<CirculationLoan[]>(() => {
    try {
      const data = localStorage.getItem('bacayuk_circulation');
      return data ? JSON.parse(data) : initialLoans;
    } catch {
      return initialLoans;
    }
  });

  const [books] = useState<Book[]>(() => {
    try {
      const data = localStorage.getItem('bacayuk_books');
      return data ? JSON.parse(data) : initialBooks;
    } catch {
      return initialBooks;
    }
  });

  const [users] = useState<User[]>(() => {
    try {
      const data = localStorage.getItem('bacayuk_users');
      return data ? JSON.parse(data) : initialUsers;
    } catch {
      return initialUsers;
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Dipinjam' | 'Terlambat' | 'Dikembalikan'>('All');
  
  // Modals
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [confirmReturnLoan, setConfirmReturnLoan] = useState<CirculationLoan | null>(null);
  const [confirmExtendLoan, setConfirmExtendLoan] = useState<CirculationLoan | null>(null);
  
  // Borrow form state
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loanDurationDays, setLoanDurationDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const saveLoans = (updated: CirculationLoan[]) => {
    setLoans(updated);
    localStorage.setItem('bacayuk_circulation', JSON.stringify(updated));
    window.dispatchEvent(new Event('bacayuk_circulation_updated'));
    window.dispatchEvent(new Event('storage'));
    realtime.publish('STATE_SYNCED', { circulation: updated });
  };

  // Real-time due date & fine calculation
  const today = new Date().toISOString().split('T')[0];

  const processedLoans = loans.map(loan => {
    if (loan.status === 'Dikembalikan') return loan;
    if (loan.dueDate < today) {
      const diffTime = Math.abs(new Date(today).getTime() - new Date(loan.dueDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const fine = diffDays * 1000; // Rp 1.000 / hari
      return { ...loan, status: 'Terlambat' as const, fineAmount: fine };
    }
    return loan;
  });

  const filteredLoans = processedLoans.filter(l => {
    const matchSearch = l.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        l.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' ? true : l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Action: Eksekusi Pengembalian Buku
  const executeReturnBook = () => {
    if (!confirmReturnLoan) return;

    const updated = loans.map(l => {
      if (l.id === confirmReturnLoan.id) {
        return {
          ...l,
          status: 'Dikembalikan' as const,
          returnDate: today
        };
      }
      return l;
    });

    saveLoans(updated);
    showToast(`✓ Buku "${confirmReturnLoan.bookTitle}" telah berhasil dikembalikan!`);
    setConfirmReturnLoan(null);
  };

  // Action: Eksekusi Perpanjang Pinjam (+7 Hari)
  const executeExtendLoan = () => {
    if (!confirmExtendLoan) return;

    const currentDue = new Date(confirmExtendLoan.dueDate);
    currentDue.setDate(currentDue.getDate() + 7);
    const newDueDate = currentDue.toISOString().split('T')[0];

    const updated = loans.map(l => {
      if (l.id === confirmExtendLoan.id) {
        return {
          ...l,
          dueDate: newDueDate,
          status: 'Dipinjam' as const,
          fineAmount: 0
        };
      }
      return l;
    });

    saveLoans(updated);
    showToast(`✓ Masa pinjam buku diperpanjang hingga ${newDueDate} (+7 hari)!`);
    setConfirmExtendLoan(null);
  };

  // Action: Kirim Pengingat
  const handleSendReminder = (loan: CirculationLoan) => {
    showToast(`🔔 Notifikasi pengingat jatuh tempo berhasil dikirim ke ${loan.userName} (${loan.userEmail})`);
  };

  // Action: Catat Peminjaman Baru
  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !selectedUserId) return;

    const book = books.find(b => b.id === selectedBookId);
    const user = users.find(u => u.id === selectedUserId);
    if (!book || !user) return;

    const borrowDate = today;
    const due = new Date();
    due.setDate(due.getDate() + loanDurationDays);
    const dueDate = due.toISOString().split('T')[0];

    const newLoan: CirculationLoan = {
      id: `ln-${Date.now().toString().slice(-4)}`,
      bookId: book.id,
      bookTitle: book.title,
      bookCover: book.coverUrl,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      borrowDate,
      dueDate,
      status: 'Dipinjam',
      fineAmount: 0,
      notes: notes.trim() || `Peminjaman digital mandiri selama ${loanDurationDays} hari.`
    };

    saveLoans([newLoan, ...loans]);
    setShowBorrowModal(false);
    setSelectedBookId('');
    setSelectedUserId('');
    setNotes('');
    showToast(`✓ Peminjaman buku "${book.title}" untuk ${user.name} berhasil dicatat!`);
  };

  // Summary Metrics
  const activeCount = processedLoans.filter(l => l.status === 'Dipinjam').length;
  const overdueCount = processedLoans.filter(l => l.status === 'Terlambat').length;
  const returnedCount = processedLoans.filter(l => l.status === 'Dikembalikan').length;
  const totalFine = processedLoans.reduce((acc, curr) => acc + (curr.fineAmount || 0), 0);

  const selectedBookPreview = books.find(b => b.id === selectedBookId);
  const selectedUserPreview = users.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#2a160b] text-[#f9f6f0] px-5 py-3.5 rounded-2xl shadow-2xl border border-[#ebdcb8]/40 text-xs font-bold animate-in fade-in slide-in-from-top-4 flex items-center gap-2.5 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black font-serif text-[#2a160b] flex items-center gap-2.5">
            <Repeat className="w-7 h-7 text-[#8a6d1c]" />
            Sirkulasi & Peminjaman Buku
          </h1>
          <p className="text-sm font-medium text-[#5a3a22] mt-0.5">
            Pantau masa aktif peminjaman buku digital, batas jatuh tempo, perhitungan denda, dan riwayat sirkulasi
          </p>
        </div>

        <button
          onClick={() => setShowBorrowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#3a2012] hover:bg-[#2a160b] text-[#f9f6f0] text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-98"
        >
          <Plus className="w-4 h-4" />
          Catat Peminjaman Baru
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#f9f6f0] p-5 rounded-2xl border border-[#d4c3a3] shadow-sm hover:border-[#8a6d1c] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#8a6d1c] uppercase tracking-wider">Sedang Dipinjam</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#2a160b]">{activeCount} <span className="text-sm font-normal text-[#8a6d1c]">buku</span></div>
          <p className="text-[11px] text-[#5a3a22] font-semibold mt-1">Status aktif dalam masa tempo</p>
        </div>

        <div className="bg-[#f9f6f0] p-5 rounded-2xl border border-[#d4c3a3] shadow-sm hover:border-rose-400 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Jatuh Tempo (Overdue)</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-700">{overdueCount} <span className="text-sm font-normal text-rose-500">buku</span></div>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">Melebihi batas tanggal kembali</p>
        </div>

        <div className="bg-[#f9f6f0] p-5 rounded-2xl border border-[#d4c3a3] shadow-sm hover:border-emerald-400 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Telah Dikembalikan</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#2a160b]">{returnedCount} <span className="text-sm font-normal text-emerald-700">transaksi</span></div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">Riwayat sirkulasi tuntas</p>
        </div>

        <div className="bg-[#f9f6f0] p-5 rounded-2xl border border-[#d4c3a3] shadow-sm hover:border-[#8a6d1c] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#8a6d1c] uppercase tracking-wider">Total Akumulasi Denda</span>
            <div className="p-2 rounded-xl bg-[#ebdcb8] text-[#8a6d1c] border border-[#d4c3a3]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#2a160b]">Rp {totalFine.toLocaleString('id-ID')}</div>
          <p className="text-[11px] text-[#8a6d1c] font-semibold mt-1">Tarif Rp 1.000 / hari terlambat</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#f9f6f0] p-4 rounded-2xl border border-[#d4c3a3] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a49373]" />
          <input
            type="text"
            placeholder="Cari ID, judul buku, atau siswa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-[#c2b192] rounded-xl outline-none focus:border-[#8a6d1c] bg-white font-medium shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Dipinjam', 'Terlambat', 'Dikembalikan'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all shrink-0 ${
                filterStatus === st
                  ? 'bg-[#3a2012] text-white border-[#3a2012] shadow-xs'
                  : 'bg-white text-[#5a3a22] border-[#d4c3a3] hover:bg-[#ebdcb8]'
              }`}
            >
              {st === 'All' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Circulation Table */}
      <div className="bg-[#f9f6f0] rounded-2xl border border-[#d4c3a3] shadow-sm overflow-hidden">
        <div className="p-4.5 border-b border-[#d4c3a3] bg-[#f0e6d2] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[#2a160b] text-sm">
              Daftar Transaksi Sirkulasi ({filteredLoans.length} Data)
            </h3>
          </div>
          <span className="text-xs text-[#8a6d1c] font-bold bg-[#ebdcb8] px-3 py-1 rounded-full border border-[#d4c3a3]">
            Maks. pinjam standar: 7 hari
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#ebdcb8] text-[#3a2012] text-xs font-bold border-b border-[#d4c3a3]">
                <th className="p-4 w-72">Buku & Judul</th>
                <th className="p-4 w-52">Peminjam</th>
                <th className="p-4 w-48">Masa Pinjam (Due Date)</th>
                <th className="p-4 w-44">Status & Denda</th>
                <th className="p-4 w-52 text-right">Aksi Sirkulasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebdcb8]">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-[#ebdcb8]/40 transition-colors">
                  {/* Book Info */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={loan.bookCover}
                        alt={loan.bookTitle}
                        className="w-12 h-16 object-cover rounded-lg border border-[#d4c3a3] shadow-xs shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-[#2a160b] text-sm line-clamp-1">{loan.bookTitle}</div>
                        <div className="text-[11px] text-[#8a6d1c] font-mono mt-0.5">ID: {loan.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* User Info */}
                  <td className="p-4">
                    <div>
                      <div className="font-bold text-[#2a160b] text-xs">{loan.userName}</div>
                      <div className="text-[11px] text-[#8a6d1c] mt-0.5">{loan.userEmail}</div>
                    </div>
                  </td>

                  {/* Date & Due */}
                  <td className="p-4">
                    <div className="space-y-1 text-xs">
                      <div className="text-[#5a3a22] flex items-center gap-1">
                        <span className="text-[#a49373]">Pinjam:</span>
                        <span>{loan.borrowDate}</span>
                      </div>
                      <div className="font-bold text-[#2a160b] flex items-center gap-1">
                        <span className="text-[#a49373] font-normal">Tempo:</span>
                        <span className={loan.status === 'Terlambat' ? 'text-rose-700' : ''}>{loan.dueDate}</span>
                      </div>
                      {loan.returnDate && (
                        <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Kembali: {loan.returnDate}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status & Fine */}
                  <td className="p-4">
                    <div className="space-y-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        loan.status === 'Dipinjam'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : loan.status === 'Terlambat'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {loan.status}
                      </span>
                      {loan.fineAmount && loan.fineAmount > 0 ? (
                        <div className="text-xs font-black text-rose-700 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Denda: Rp {loan.fineAmount.toLocaleString('id-ID')}</span>
                        </div>
                      ) : null}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {loan.status !== 'Dikembalikan' && (
                        <>
                          <button
                            onClick={() => setConfirmReturnLoan(loan)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#8a6d1c] hover:bg-[#6e5614] text-white rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95"
                            title="Kembalikan Buku"
                          >
                            <CornerDownLeft className="w-3.5 h-3.5" />
                            <span>Kembalikan</span>
                          </button>
                          
                          <button
                            onClick={() => setConfirmExtendLoan(loan)}
                            className="p-1.5 text-[#5a3a22] hover:bg-[#ebdcb8] border border-[#d4c3a3] bg-white rounded-lg transition-colors shadow-2xs"
                            title="Perpanjang Masa Pinjam (+7 Hari)"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-[#8a6d1c]" />
                          </button>

                          {loan.status === 'Terlambat' && (
                            <button
                              onClick={() => handleSendReminder(loan)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 bg-white rounded-lg transition-colors shadow-2xs"
                              title="Kirim Notifikasi Pengingat Denda"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                      {loan.status === 'Dikembalikan' && (
                        <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 justify-end bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5" /> Selesai
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLoans.length === 0 && (
            <div className="p-12 text-center text-[#8a6d1c] text-xs">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
              Tidak ada data transaksi peminjaman yang cocok dengan filter pencarian.
            </div>
          )}
        </div>
      </div>

      {/* CUSTOM CONFIRMATION MODAL: PENGEMBALIAN BUKU (MENGGANTIKAN NATIVE WINDOW.CONFIRM) */}
      {confirmReturnLoan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#f9f6f0] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#d4c3a3] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#ebdcb8] bg-[#f0e6d2] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ebdcb8] text-[#8a6d1c] flex items-center justify-center border border-[#d4c3a3]">
                  <CornerDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#2a160b] text-base leading-tight">Konfirmasi Pengembalian</h3>
                  <p className="text-[11px] text-[#8a6d1c]">Selesaikan transaksi sirkulasi buku digital</p>
                </div>
              </div>
              <button 
                onClick={() => setConfirmReturnLoan(null)}
                className="p-1.5 text-[#a49373] hover:text-[#3a2012] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Book Details Box */}
              <div className="flex gap-3.5 bg-white p-3.5 rounded-xl border border-[#ebdcb8] shadow-2xs">
                <img 
                  src={confirmReturnLoan.bookCover} 
                  alt={confirmReturnLoan.bookTitle} 
                  className="w-14 h-20 object-cover rounded-md border border-[#d4c3a3] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-[#2a160b] line-clamp-1">{confirmReturnLoan.bookTitle}</h4>
                  <p className="text-xs text-[#8a6d1c] mt-0.5">Peminjam: <span className="font-semibold text-[#3a2012]">{confirmReturnLoan.userName}</span></p>
                  <p className="text-[11px] text-[#a49373]">{confirmReturnLoan.userEmail}</p>
                  
                  <div className="mt-2 text-[11px] text-[#5a3a22] flex items-center gap-2">
                    <span>Tempo: <b>{confirmReturnLoan.dueDate}</b></span>
                    <span>•</span>
                    <span>Kembali: <b>{today}</b></span>
                  </div>
                </div>
              </div>

              {/* Status & Fine Warning */}
              {confirmReturnLoan.status === 'Terlambat' ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1 text-rose-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Peminjaman Terlambat Melewati Jatuh Tempo</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed pl-5">
                    Dikenakan denda keterlambatan sebesar <b className="text-rose-900">Rp {confirmReturnLoan.fineAmount?.toLocaleString('id-ID')}</b>. Pastikan siswa telah melunasi denda sebelum meminjam buku lain.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pengembalian tepat waktu. Tidak ada denda yang dikenakan.</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-[#ebdcb8] bg-[#f0e6d2] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmReturnLoan(null)}
                className="px-4 py-2 text-xs font-bold text-[#5a3a22] hover:bg-[#ebdcb8] rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeReturnBook}
                className="px-5 py-2 bg-[#3a2012] hover:bg-[#2a160b] text-[#f9f6f0] text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Ya, Konfirmasi Pengembalian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL: PERPANJANG MASA PINJAM */}
      {confirmExtendLoan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#f9f6f0] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#d4c3a3] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#ebdcb8] bg-[#f0e6d2] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ebdcb8] text-[#8a6d1c] flex items-center justify-center border border-[#d4c3a3]">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#2a160b] text-base leading-tight">Perpanjang Masa Pinjam</h3>
                  <p className="text-[11px] text-[#8a6d1c]">Tambah durasi 7 hari kalender</p>
                </div>
              </div>
              <button 
                onClick={() => setConfirmExtendLoan(null)}
                className="p-1.5 text-[#a49373] hover:text-[#3a2012] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3.5">
              <p className="text-xs text-[#5a3a22] leading-relaxed">
                Apakah Anda yakin ingin memperpanjang masa peminjaman buku <b className="text-[#2a160b]">"{confirmExtendLoan.bookTitle}"</b> untuk siswa <b className="text-[#2a160b]">{confirmExtendLoan.userName}</b>?
              </p>

              <div className="bg-white p-3.5 rounded-xl border border-[#ebdcb8] text-xs space-y-1.5">
                <div className="flex justify-between text-[#8a6d1c]">
                  <span>Jatuh Tempo Lama:</span>
                  <span className="font-mono line-through">{confirmExtendLoan.dueDate}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>Jatuh Tempo Baru (+7 Hari):</span>
                  <span className="font-mono">
                    {(() => {
                      const d = new Date(confirmExtendLoan.dueDate);
                      d.setDate(d.getDate() + 7);
                      return d.toISOString().split('T')[0];
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#ebdcb8] bg-[#f0e6d2] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmExtendLoan(null)}
                className="px-4 py-2 text-xs font-bold text-[#5a3a22] hover:bg-[#ebdcb8] rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeExtendLoan}
                className="px-5 py-2 bg-[#8a6d1c] hover:bg-[#6e5614] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Perpanjang Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FORM CATAT PEMINJAMAN BARU */}
      {showBorrowModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#f9f6f0] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#d4c3a3] max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#ebdcb8] bg-[#f0e6d2] flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#3a2012] text-white flex items-center justify-center shadow-xs">
                  <Repeat className="w-5 h-5 text-[#ebdcb8]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#2a160b] text-base">Catat Transaksi Peminjaman Baru</h3>
                  <p className="text-[11px] text-[#8a6d1c]">Pilih naskah buku dan siswa peminjam</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBorrowModal(false)}
                className="p-1.5 text-[#a49373] hover:text-[#3a2012] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Select Book */}
              <div>
                <label className="block text-xs font-bold text-[#3a2012] mb-1">Pilih Naskah Buku *</label>
                <select
                  required
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#c2b192] rounded-xl outline-none focus:border-[#8a6d1c] bg-white font-medium shadow-2xs"
                >
                  <option value="">-- Pilih Buku yang Dipinjam --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.title} — {b.author} ({b.category})</option>
                  ))}
                </select>

                {selectedBookPreview && (
                  <div className="mt-2.5 flex items-center gap-3 p-2.5 bg-white rounded-xl border border-[#ebdcb8]">
                    <img src={selectedBookPreview.coverUrl} alt={selectedBookPreview.title} className="w-10 h-14 object-cover rounded shadow-2xs" />
                    <div>
                      <div className="font-bold text-xs text-[#2a160b]">{selectedBookPreview.title}</div>
                      <div className="text-[11px] text-[#8a6d1c]">{selectedBookPreview.author} • {selectedBookPreview.year}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Select User */}
              <div>
                <label className="block text-xs font-bold text-[#3a2012] mb-1">Pilih Siswa / Anggota *</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#c2b192] rounded-xl outline-none focus:border-[#8a6d1c] bg-white font-medium shadow-2xs"
                >
                  <option value="">-- Pilih Nama Siswa / Peminjam --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-bold text-[#3a2012] mb-1">Durasi Peminjaman Standar</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[7, 14, 30].map((days) => (
                    <button
                      type="button"
                      key={days}
                      onClick={() => setLoanDurationDays(days)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        loanDurationDays === days
                          ? 'bg-[#3a2012] text-white border-[#3a2012] shadow-xs'
                          : 'bg-white border-[#d4c3a3] text-[#5a3a22] hover:bg-[#ebdcb8]'
                      }`}
                    >
                      {days} Hari
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[#3a2012] mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Peminjaman untuk ujian literasi sekolah atau tugas kelompok."
                  className="w-full px-3.5 py-2 text-xs border border-[#c2b192] rounded-xl outline-none focus:border-[#8a6d1c] bg-white"
                />
              </div>

              <div className="p-4 border-t border-[#ebdcb8] flex justify-end gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBorrowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#5a3a22] hover:bg-[#ebdcb8] rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3a2012] hover:bg-[#2a160b] text-[#f9f6f0] text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  Simpan Transaksi Peminjaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Circulation;
