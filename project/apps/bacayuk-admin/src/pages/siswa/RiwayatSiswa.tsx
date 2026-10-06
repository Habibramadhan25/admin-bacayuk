import React from 'react';
import { Clock, BookOpen, Flame, Search, CheckCircle } from 'lucide-react';

const RiwayatSiswa = () => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-[#8a6d1c] tracking-widest uppercase">
              Arsip & Jejak Literasi
            </span>
          </div>
          <h1 className="text-4xl font-black font-serif text-[#2a160b] mb-2">
            Riwayat Bacaan
          </h1>
          <p className="text-[#5a3a22] text-sm md:text-base max-w-xl">
            Pantau rekaman waktu, progres baca yang sedang berjalan, dan seluruh buku yang telah Anda tamatkan.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#f4f0e6] px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-xs font-bold text-[#5a3a22]">Sinkron Cloud</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Waktu Baca */}
        <div className="bg-[#f4f0e6] rounded-2xl p-6 relative overflow-hidden group hover:bg-[#ebdcb8] transition-colors cursor-pointer border border-transparent hover:border-[#d4c3a3]">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-[#5a3a22]">Waktu Baca</h3>
            <Clock className="w-5 h-5 text-[#8a6d1c]" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#2a160b]">24</span>
              <span className="text-lg font-medium text-[#5a3a22]">Jam</span>
            </div>
            <p className="text-xs text-[#8a6d1c] font-bold mt-1">+3.5 jam mgg ini</p>
          </div>
        </div>

        {/* Buku Selesai */}
        <div className="bg-[#f4f0e6] rounded-2xl p-6 relative overflow-hidden group hover:bg-[#ebdcb8] transition-colors cursor-pointer border border-transparent hover:border-[#d4c3a3]">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-[#5a3a22]">Buku Selesai</h3>
            <CheckCircle className="w-5 h-5 text-[#8a6d1c]" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#2a160b]">8</span>
              <span className="text-lg font-medium text-[#5a3a22]">Buku</span>
            </div>
            <p className="text-xs text-[#5a3a22] font-medium mt-1">Target: 12 tahun ini</p>
          </div>
        </div>

        {/* Halaman Dibaca */}
        <div className="bg-[#f4f0e6] rounded-2xl p-6 relative overflow-hidden group hover:bg-[#ebdcb8] transition-colors cursor-pointer border border-transparent hover:border-[#d4c3a3]">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-[#5a3a22]">Halaman Dibaca</h3>
            <BookOpen className="w-5 h-5 text-[#8a6d1c]" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#2a160b]">1.420</span>
              <span className="text-lg font-medium text-[#5a3a22]">Hal</span>
            </div>
            <p className="text-xs text-[#5a3a22] font-medium mt-1">Rata-rata 45 hal/hari</p>
          </div>
        </div>

        {/* Streak Harian */}
        <div className="bg-[#f4f0e6] rounded-2xl p-6 relative overflow-hidden group hover:bg-[#ebdcb8] transition-colors cursor-pointer border border-transparent hover:border-[#d4c3a3]">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-[#5a3a22]">Streak Harian</h3>
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#2a160b]">7</span>
              <span className="text-lg font-medium text-[#5a3a22]">Hari</span>
            </div>
            <p className="text-xs text-[#8a6d1c] font-bold mt-1">Rekor terbaik!</p>
          </div>
        </div>

      </div>

      {/* Filter and Search */}
      <div className="space-y-4 pt-4 border-t border-[#ebdcb8]">
        <div className="relative w-full max-w-2xl">
          <input 
            type="text" 
            placeholder="Cari judul, penulis, atau catatan..." 
            className="w-full pl-12 pr-4 py-3 bg-[#f4f0e6] border-none rounded-2xl text-[#2a160b] placeholder-[#a49373] focus:outline-none focus:ring-2 focus:ring-[#d4c3a3] transition-shadow text-sm font-medium"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a49373]" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button className="whitespace-nowrap px-4 py-2 bg-[#ebdcb8] text-[#2a160b] font-bold rounded-full text-sm border border-[#d4c3a3]">Semua (7)</button>
          <button className="whitespace-nowrap px-4 py-2 bg-transparent text-[#5a3a22] font-medium hover:bg-[#f4f0e6] rounded-full text-sm transition-colors border border-transparent">Sedang Dibaca (3)</button>
          <button className="whitespace-nowrap px-4 py-2 bg-transparent text-[#5a3a22] font-medium hover:bg-[#f4f0e6] rounded-full text-sm transition-colors border border-transparent">Selesai (3)</button>
          <button className="whitespace-nowrap px-4 py-2 bg-transparent text-[#5a3a22] font-medium hover:bg-[#f4f0e6] rounded-full text-sm transition-colors border border-transparent">Bulan Ini</button>
        </div>
      </div>

      {/* Sedang Berjalan Section */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-[#2a160b]" />
          <h2 className="text-xl font-bold font-serif text-[#2a160b]">Sedang Berjalan</h2>
          <span className="text-xs font-medium text-[#a49373] ml-auto">3 Buku aktif</span>
        </div>
        
        {/* Placeholder for list */}
        <div className="bg-[#f4f0e6] border border-[#ebdcb8] rounded-2xl p-8 text-center text-[#5a3a22]">
          Belum ada buku yang ditambahkan ke riwayat sistem. (Data statis untuk desain)
        </div>
      </div>

    </div>
  );
};

export default RiwayatSiswa;
