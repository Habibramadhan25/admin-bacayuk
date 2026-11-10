import React, { useState, useEffect } from 'react';
import type { HistoryItem } from '../lib/mockData';
import { initialHistory } from '../lib/mockData';
import { History as HistoryIcon, BookOpen, Search, User, Calendar, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { realtime } from '../lib/realtime';

export const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem('bacayuk_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return initialHistory;
    } catch {
      return initialHistory;
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Sedang Dibaca' | 'Selesai'>('All');
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);

  // Sinkronisasi Real-Time saat Siswa membaca buku di aplikasi mobile
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const raw = localStorage.getItem('bacayuk_history');
        if (raw) setHistory(JSON.parse(raw));
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bacayuk_history_updated', handleStorageChange);

    const unsubscribe = realtime.subscribe((msg) => {
      if (msg.type === 'READING_HISTORY_UPDATED' || msg.type === 'STATE_SYNCED') {
        try {
          const raw = localStorage.getItem('bacayuk_history');
          if (raw) setHistory(JSON.parse(raw));
        } catch {}
      }
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bacayuk_history_updated', handleStorageChange);
      unsubscribe();
    };
  }, []);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Baru saja';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB';
    } catch {
      return dateString;
    }
  };

  const filteredHistory = history.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (item.bookTitle && item.bookTitle.toLowerCase().includes(q)) ||
      (item.author && item.author.toLowerCase().includes(q)) ||
      (item.userName && item.userName.toLowerCase().includes(q)) ||
      (item.userEmail && item.userEmail.toLowerCase().includes(q));

    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const readingNowCount = history.filter((h) => h.status === 'Sedang Dibaca').length;
  const completedCount = history.filter((h) => h.status === 'Selesai').length;

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#2a160b] flex items-center gap-2.5">
            <HistoryIcon className="w-7 h-7 text-[#8a6d1c]" />
            Riwayat Bacaan Siswa
          </h1>
          <p className="text-sm text-[#8a6d1c] mt-0.5">
            Pantau siapa siswa yang sedang membaca buku apa, halaman berapa, dan pada tanggal berapa secara real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 bg-[#ebdcb8] text-[#3a2012] border border-[#d4c3a3] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#8a6d1c]" />
            <span>Sedang Dibaca: {readingNowCount}</span>
          </div>
          <div className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tamat Dibaca: {completedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#f9f6f0] p-4 rounded-2xl border border-[#d4c3a3] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a49373]" />
          <input
            type="text"
            placeholder="Cari nama siswa, email, atau judul buku..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-[#c2b192] rounded-xl outline-none focus:border-[#8a6d1c] bg-white font-medium shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Sedang Dibaca', 'Selesai'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#3a2012] text-[#f9f6f0] shadow-sm'
                  : 'bg-[#ebdcb8]/70 hover:bg-[#ebdcb8] text-[#5a3a22]'
              }`}
            >
              {st === 'All' ? 'Semua Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Riwayat Bacaan */}
      {filteredHistory.length === 0 ? (
        <div className="bg-[#f9f6f0] rounded-2xl border border-[#d4c3a3] p-12 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ebdcb8] flex items-center justify-center text-[#8a6d1c] mb-3">
            <HistoryIcon className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-[#2a160b] text-base mb-1">Belum Ada Riwayat Bacaan Ditemukan</h3>
          <p className="text-xs text-[#8a6d1c] max-w-md mx-auto">
            Tidak ada data bacaan yang sesuai dengan filter pencarian. Saat siswa mulai membaca buku di aplikasi mobile, aktivitasnya akan langsung tampil di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-[#f9f6f0] rounded-2xl shadow-sm border border-[#d4c3a3] overflow-hidden hover:shadow-md hover:border-[#8a6d1c] transition-all flex flex-col justify-between"
            >
              <div className="p-4">
                {/* Info Identitas Siswa */}
                <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-[#ebdcb8]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#ebdcb8] text-[#3a2012] font-black text-xs flex items-center justify-center border border-[#d4c3a3] shrink-0">
                      {item.userName ? item.userName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#2a160b] truncate">
                        {item.userName || 'Siswa BacaYuk'}
                      </h4>
                      <p className="text-[10px] text-[#8a6d1c] truncate">
                        {item.userEmail || 'Akun Siswa'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      item.status === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Detail Buku */}
                <div className="flex gap-3.5">
                  <img
                    src={item.coverUrl}
                    alt={item.bookTitle}
                    className="w-18 h-26 object-cover rounded-lg shadow-xs border border-[#d4c3a3] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-[#2a160b] truncate" title={item.bookTitle}>
                      {item.bookTitle}
                    </h3>
                    <p className="text-xs text-[#8a6d1c] truncate">{item.author}</p>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className="text-[#8a6d1c]">{item.progress}% Selesai</span>
                        <span className="text-[#5a3a22]">
                          Hal {item.currentPage} / {item.totalPages}
                        </span>
                      </div>
                      <div className="w-full bg-[#ebdcb8] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#3a2012] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(5, item.progress))}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-[#8a6d1c] font-semibold">
                      <Calendar className="w-3 h-3 text-[#8a6d1c]" />
                      <span>{formatDate(item.lastRead)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Card */}
              <div className="bg-[#f0e6d2] px-4 py-2.5 border-t border-[#ebdcb8] flex justify-between items-center text-xs">
                <span className="text-[11px] text-[#5a3a22] font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Membaca aktif
                </span>
                <button
                  onClick={() => setSelectedHistory(item)}
                  className="text-[#3a2012] hover:text-[#8a6d1c] font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Rincian Aktivitas
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#f9f6f0] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#d4c3a3]">
            <div className="p-4 border-b border-[#ebdcb8] flex items-center justify-between bg-[#f0e6d2]">
              <h3 className="text-base font-bold text-[#2a160b] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#8a6d1c]" />
                Rincian Aktivitas Membaca Siswa
              </h3>
              <button
                onClick={() => setSelectedHistory(null)}
                className="p-1.5 text-[#5a3a22] hover:bg-[#ebdcb8] rounded-full transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Siswa Card */}
              <div className="bg-[#ebdcb8]/50 p-3.5 rounded-xl border border-[#d4c3a3] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#3a2012] text-[#f9f6f0] font-bold text-sm flex items-center justify-center shadow-xs">
                  {selectedHistory.userName ? selectedHistory.userName.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#2a160b]">
                    {selectedHistory.userName || 'Siswa BacaYuk'}
                  </h4>
                  <p className="text-xs text-[#8a6d1c]">
                    {selectedHistory.userEmail || 'Akun Siswa'}
                  </p>
                </div>
              </div>

              {/* Buku Info */}
              <div className="flex gap-4 items-center">
                <img
                  src={selectedHistory.coverUrl}
                  alt={selectedHistory.bookTitle}
                  className="w-20 h-28 object-cover rounded-lg shadow-xs border border-[#d4c3a3]"
                />
                <div>
                  <h4 className="text-base font-bold text-[#2a160b]">{selectedHistory.bookTitle}</h4>
                  <p className="text-xs text-[#8a6d1c] mb-2">{selectedHistory.author}</p>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      selectedHistory.status === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                  >
                    {selectedHistory.status}
                  </span>
                </div>
              </div>

              {/* Progress & Statistik */}
              <div className="bg-[#f0e6d2] p-4 rounded-xl border border-[#ebdcb8] space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#5a3a22]">Progres Membaca Buku</span>
                    <span className="text-[#8a6d1c]">{selectedHistory.progress}%</span>
                  </div>
                  <div className="w-full bg-[#d4c3a3] rounded-full h-2">
                    <div
                      className="bg-[#3a2012] h-2 rounded-full"
                      style={{ width: `${selectedHistory.progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#ebdcb8]">
                  <div>
                    <p className="text-[11px] text-[#8a6d1c] font-semibold mb-0.5">Halaman Terakhir</p>
                    <p className="font-bold text-sm text-[#2a160b]">
                      Hal {selectedHistory.currentPage}{' '}
                      <span className="text-xs font-normal text-[#8a6d1c]">/ {selectedHistory.totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#8a6d1c] font-semibold mb-0.5">Waktu Akses Terakhir</p>
                    <p className="font-bold text-xs text-[#2a160b] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#8a6d1c]" />
                      {formatDate(selectedHistory.lastRead)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#ebdcb8] bg-[#f0e6d2] flex justify-end">
              <button
                onClick={() => setSelectedHistory(null)}
                className="px-5 py-2 bg-[#2a160b] text-[#f9f6f0] text-xs font-bold hover:bg-[#3a2012] rounded-xl transition-colors cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
