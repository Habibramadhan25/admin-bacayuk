import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Award, BookOpen, Clock, Settings, Shield, Trophy, Flame, Hexagon, Star, CheckCircle2, Lock, Bell, Globe, Image as ImageIcon, Save } from 'lucide-react';

const ProfilSiswa = () => {
  const location = useLocation();
  const [studentName, setStudentName] = useState('Siswa');
  const [studentAvatar, setStudentAvatar] = useState('');
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'statistik');
  
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);
  
  // Settings Form State
  const [activeSettingsTab, setActiveSettingsTab] = useState('profil');
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const settingTabs = [
    { id: 'profil', label: 'Profil Siswa', icon: User },
    { id: 'keamanan', label: 'Keamanan Akun', icon: Lock },
    { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
    { id: 'regional', label: 'Regional & Bahasa', icon: Globe },
  ];

  useEffect(() => {
    const name = localStorage.getItem('bacayuk_siswa_name') || 'Siswa';
    const avatar = localStorage.getItem('bacayuk_siswa_avatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff&size=256`;
    
    setStudentName(name);
    setStudentAvatar(avatar);
    setEditName(name);
    setEditAvatar(localStorage.getItem('bacayuk_siswa_avatar') || '');
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('bacayuk_siswa_name', editName);
    if (editAvatar) {
      localStorage.setItem('bacayuk_siswa_avatar', editAvatar);
    } else {
      localStorage.removeItem('bacayuk_siswa_avatar');
    }
    
    setStudentName(editName);
    setStudentAvatar(editAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(editName)}&background=4f46e5&color=fff&size=256`);
    
    // Dispatch event so layout updates
    window.dispatchEvent(new Event('profile_updated'));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const stats = [
    { label: 'Level Saat Ini', value: 'Pemula', icon: Shield, color: 'text-[#8a6d1c]', bg: 'bg-[#d4c3a3]' },
    { label: 'Total Poin', value: '0', icon: Star, color: 'text-[#8a6d1c]', bg: 'bg-amber-100' },
    { label: 'Buku Selesai', value: '0', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Hari Beruntun', value: '0 Hari', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-100' },
  ];

  const leaderboard = [
    { rank: 1, name: 'Siti Aminah', points: 3450, badge: 'Master' },
    { rank: 2, name: 'Budi Santoso', points: 2890, badge: 'Senior' },
    { rank: 3, name: 'Andi Wijaya', points: 950, badge: 'Junior' },
    { rank: 4, name: 'Rina Melati', points: 820, badge: 'Junior' },
    { rank: 5, name: studentName, points: 0, badge: 'Pemula', isMe: true },
  ];

  const badges = [
    { name: 'Pembaca Kilat', desc: 'Selesaikan 1 buku dalam 24 jam', earned: false },
    { name: 'Kolektor Fiksi', desc: 'Baca 5 buku fiksi', earned: false },
    { name: 'Ulat Buku', desc: 'Membaca 7 hari berturut-turut', earned: false },
    { name: 'Kritikus Cerdas', desc: 'Beri ulasan pada 10 buku', earned: false },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#3a2012] rounded-3xl p-8 sm:p-10 text-[#f9f6f0] shadow-xl shadow-[#3a2012]/30 relative overflow-hidden flex flex-col sm:flex-row items-center gap-8">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 shrink-0">
          <div className="w-32 h-32 bg-[#f9f6f0] rounded-full p-2 shadow-lg relative">
            <img 
              src={studentAvatar} 
              alt="Profile" 
              className="w-full h-full rounded-full object-cover"
            />
            <div className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-900 w-12 h-12 rounded-full border-4 border-white flex items-center justify-center font-black shadow-sm">
              Lvl.1
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center sm:text-left flex-1">
          <div className="inline-flex items-center gap-2 bg-[#8a6d1c]/50 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-[#8a6d1c]/50">
            <Shield className="w-4 h-4" /> Gelar: Pemula
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{studentName}</h1>
          <p className="text-[#ebdcb8] mb-4 max-w-md">Teruslah membaca untuk naik ke level "Kutu Buku" dan buka lencana eksklusif baru!</p>
          
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="w-full sm:w-64 h-3 bg-[#2a160b]/50 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full w-0"></div>
            </div>
            <span className="text-xs font-bold text-[#ebdcb8]">0% menuju Level 2</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#d4c3a3]">
        <button 
          onClick={() => setActiveTab('statistik')}
          className={`px-6 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'statistik' ? 'border-[#8a6d1c] text-[#8a6d1c]' : 'border-transparent text-[#8a6d1c] hover:text-slate-700'}`}
        >
          Statistik & Lencana
        </button>
        <button 
          onClick={() => setActiveTab('leaderboard')}
          className={`px-6 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'leaderboard' ? 'border-[#8a6d1c] text-[#8a6d1c]' : 'border-transparent text-[#8a6d1c] hover:text-slate-700'}`}
        >
          Papan Peringkat
        </button>
        <button 
          onClick={() => setActiveTab('pengaturan')}
          className={`px-6 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'pengaturan' ? 'border-[#8a6d1c] text-[#8a6d1c]' : 'border-transparent text-[#8a6d1c] hover:text-slate-700'}`}
        >
          Pengaturan
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'statistik' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-bold text-[#2a160b]">Statistik Membaca</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-[#f9f6f0] p-5 rounded-2xl shadow-sm border border-[#ebdcb8] flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shrink-0`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-[#8a6d1c] font-medium">{stat.label}</p>
                  <p className="text-xl font-black text-[#2a160b]">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold text-[#2a160b] pt-4">Koleksi Lencana</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((badge, i) => (
              <div key={i} className={`p-5 rounded-2xl border text-center transition-all ${badge.earned ? 'bg-[#f9f6f0] border-amber-200 shadow-sm hover:shadow-md' : 'bg-[#f0e6d2] border-[#d4c3a3] opacity-60 grayscale'}`}>
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${badge.earned ? 'bg-amber-100 text-[#8a6d1c]' : 'bg-[#d4c3a3] text-[#a49373]'}`}>
                  <Hexagon className="w-10 h-10" />
                </div>
                <h4 className="font-bold text-[#2a160b] text-sm mb-1">{badge.name}</h4>
                <p className="text-xs text-[#8a6d1c] leading-tight">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="bg-[#f9f6f0] rounded-3xl p-6 md:p-8 shadow-sm border border-[#ebdcb8] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[#2a160b] flex items-center gap-2">
                <Trophy className="w-7 h-7 text-[#8a6d1c]" /> Papan Peringkat
              </h2>
              <p className="text-[#8a6d1c] text-sm mt-1">Siapa pembaca terbaik bulan ini?</p>
            </div>
            <div className="bg-[#ebdcb8] text-[#8a6d1c] px-4 py-2 rounded-xl font-bold text-sm">
              Peringkatmu: #{leaderboard.find(l => l.isMe)?.rank}
            </div>
          </div>

          <div className="space-y-3">
            {leaderboard.map((user) => (
              <div 
                key={user.rank} 
                className={`flex items-center p-4 rounded-2xl transition-colors ${user.isMe ? 'bg-[#3a2012] shadow-md' : 'bg-[#f0e6d2] hover:bg-[#e6ddc5]'}`}
              >
                <div className={`w-8 font-black text-lg text-center ${user.isMe ? 'text-[#d4c3a3]' : user.rank <= 3 ? 'text-[#8a6d1c]' : 'text-[#a49373]'}`}>
                  #{user.rank}
                </div>
                <div className="w-10 h-10 ml-4 rounded-full bg-[#f9f6f0] shrink-0 shadow-sm overflow-hidden">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} alt={user.name} />
                </div>
                <div className="ml-4 flex-1">
                  <h4 className={`font-bold text-sm ${user.isMe ? 'text-[#f9f6f0]' : 'text-[#2a160b]'}`}>
                    {user.name} {user.isMe && '(Kamu)'}
                  </h4>
                  <p className={`text-xs ${user.isMe ? 'text-[#d4c3a3]' : 'text-[#8a6d1c]'}`}>{user.badge}</p>
                </div>
                <div className={`font-black text-lg ${user.isMe ? 'text-[#d4af37]' : 'text-[#8a6d1c]'}`}>
                  {user.points.toLocaleString()} <span className={`text-xs font-medium ${user.isMe ? 'text-[#d4c3a3]' : 'text-[#a49373]'}`}>pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pengaturan' && (
        <div className="bg-[#f9f6f0] rounded-xl shadow-sm border border-[#d4c3a3] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row min-h-[500px]">
            <div className="w-full md:w-64 bg-[#f0e6d2] border-r border-[#d4c3a3] p-4">
              <nav className="space-y-1">
                {settingTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSettingsTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                      activeSettingsTab === tab.id 
                        ? 'bg-[#ebdcb8] text-[#8a6d1c] font-bold border border-[#d4c3a3]' 
                        : 'text-[#5a3a22] hover:bg-[#d4c3a3]'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="flex-1 p-6 md:p-8">
              {showSuccess && (
                <div className="mb-6 p-4 bg-emerald-100/50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <p className="text-sm font-bold">Pengaturan berhasil diperbarui!</p>
                </div>
              )}

              {activeSettingsTab === 'profil' && (
                <>
                  <h2 className="text-lg font-bold text-[#2a160b] mb-6">Informasi Profil</h2>
                  
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-[#ebdcb8] border-2 border-[#d4c3a3] rounded-full flex items-center justify-center text-[#8a6d1c] font-bold text-3xl overflow-hidden">
                        {editAvatar ? (
                          <img src={editAvatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-[#a49373]" />
                        )}
                      </div>
                      <div>
                        <input 
                          type="file" 
                          id="avatarUpload"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <button 
                          type="button" 
                          onClick={() => document.getElementById('avatarUpload')?.click()}
                          className="flex items-center gap-2 px-4 py-2 border border-[#d4c3a3] rounded-lg text-sm font-medium hover:bg-[#ebdcb8] hover:text-[#8a6d1c] transition-colors"
                        >
                          <ImageIcon className="w-4 h-4" /> Ubah Foto Profil
                        </button>
                        {editAvatar && (
                          <button 
                            type="button"
                            onClick={() => setEditAvatar('')}
                            className="text-xs text-red-600 mt-2 hover:underline focus:outline-none block w-full text-left"
                          >
                            Hapus foto
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-[#3a2012] mb-2">Nama Lengkap</label>
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-4 py-2.5 border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-[#f9f6f0]" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#3a2012] mb-2">Email Publik</label>
                        <input type="email" defaultValue={`${studentName.toLowerCase().replace(' ', '.')}@siswa.com`} className="w-full px-4 py-2.5 border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-[#f9f6f0]" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#3a2012] mb-2">Bio / Keterangan Singkat</label>
                      <textarea rows={3} className="w-full px-4 py-2.5 border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-[#f9f6f0]" defaultValue={`Saya adalah murid yang suka membaca berbagai macam buku petualangan!`}></textarea>
                    </div>

                    <div className="pt-6 border-t border-[#d4c3a3] flex justify-end">
                      <button type="submit" className="flex items-center gap-2 bg-[#3a2012] text-[#f9f6f0] px-6 py-2.5 rounded-lg hover:bg-[#2a160b] transition-colors font-bold shadow-sm">
                        <Save className="w-4 h-4" /> Simpan Perubahan
                      </button>
                    </div>
                  </form>
                </>
              )}

              {activeSettingsTab === 'keamanan' && (
                <>
                  <h2 className="text-lg font-bold text-[#2a160b] mb-6">Keamanan Akun</h2>
                  
                  <form className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-[#3a2012] mb-2">Password Saat Ini</label>
                      <input type="password" placeholder="Masukkan password saat ini" className="w-full md:w-2/3 px-4 py-2.5 border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-[#f9f6f0]" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#3a2012] mb-2">Password Baru</label>
                      <input type="password" placeholder="Minimal 8 karakter" className="w-full md:w-2/3 px-4 py-2.5 border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-[#f9f6f0]" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#3a2012] mb-2">Konfirmasi Password Baru</label>
                      <input type="password" placeholder="Ulangi password baru" className="w-full md:w-2/3 px-4 py-2.5 border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-[#f9f6f0]" />
                    </div>
                    
                    <div className="pt-4">
                      <div className="flex items-center justify-between p-4 bg-[#f0e6d2] border border-[#d4c3a3] rounded-xl">
                        <div>
                          <p className="font-bold text-[#2a160b]">Autentikasi Dua Faktor (2FA)</p>
                          <p className="text-sm text-[#8a6d1c]">Tingkatkan keamanan akun dengan verifikasi dua langkah.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-[#d4c3a3] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#f9f6f0] after:border-[#c2b192] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3a2012]"></div>
                        </label>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-[#d4c3a3] flex justify-end">
                      <button type="button" onClick={(e) => handleSaveSettings(e as any)} className="flex items-center gap-2 bg-[#3a2012] text-[#f9f6f0] px-6 py-2.5 rounded-lg hover:bg-[#2a160b] transition-colors font-bold shadow-sm">
                        <Save className="w-4 h-4" /> Perbarui Keamanan
                      </button>
                    </div>
                  </form>
                </>
              )}

              {activeSettingsTab === 'notifikasi' && (
                <>
                  <h2 className="text-lg font-bold text-[#2a160b] mb-6">Preferensi Notifikasi</h2>
                  
                  <div className="space-y-4">
                    {[
                      { title: 'Pengingat Membaca', desc: 'Dapatkan pengingat untuk melanjutkan buku yang sedang dibaca' },
                      { title: 'Buku Baru', desc: 'Notifikasi saat ada koleksi buku baru di perpustakaan' },
                      { title: 'Peringkat & Lencana', desc: 'Email pemberitahuan jika Anda naik level atau mendapat lencana' },
                      { title: 'Pesan Sistem', desc: 'Pemberitahuan dari admin mengenai perbaikan sistem' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start justify-between p-4 bg-[#f9f6f0] border border-[#d4c3a3] rounded-xl hover:border-[#8a6d1c]/50 transition-colors">
                        <div className="pr-4">
                          <p className="font-bold text-[#2a160b] mb-1">{item.title}</p>
                          <p className="text-sm text-[#8a6d1c] leading-relaxed">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                          <input type="checkbox" defaultChecked={i < 2} className="sr-only peer" />
                          <div className="w-11 h-6 bg-[#d4c3a3] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#f9f6f0] after:border-[#c2b192] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3a2012]"></div>
                        </label>
                      </div>
                    ))}

                    <div className="pt-6 mt-6 border-t border-[#d4c3a3] flex justify-end">
                      <button type="button" onClick={(e) => handleSaveSettings(e as any)} className="flex items-center gap-2 bg-[#3a2012] text-[#f9f6f0] px-6 py-2.5 rounded-lg hover:bg-[#2a160b] transition-colors font-bold shadow-sm">
                        <Save className="w-4 h-4" /> Simpan Preferensi
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeSettingsTab === 'regional' && (
                <>
                  <h2 className="text-lg font-bold text-[#2a160b] mb-6">Regional & Bahasa</h2>
                  
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-[#3a2012] mb-2">Bahasa Aplikasi</label>
                        <select className="w-full px-4 py-2.5 border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-[#f9f6f0]">
                          <option value="id">Bahasa Indonesia</option>
                          <option value="en">English (US)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#3a2012] mb-2">Zona Waktu</label>
                        <select className="w-full px-4 py-2.5 border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-[#f9f6f0]">
                          <option value="WIB">WIB (Waktu Indonesia Barat)</option>
                          <option value="WITA">WITA (Waktu Indonesia Tengah)</option>
                          <option value="WIT">WIT (Waktu Indonesia Timur)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#3a2012] mb-2">Format Tanggal</label>
                      <div className="space-y-3 mt-3">
                        <label className="flex items-center gap-3 p-3 border border-[#d4c3a3] rounded-lg hover:bg-[#ebdcb8] cursor-pointer transition-colors">
                          <input type="radio" name="dateFormat" defaultChecked className="w-4 h-4 text-[#8a6d1c] focus:ring-[#8a6d1c]" />
                          <span className="text-[#3a2012] text-sm">DD/MM/YYYY (contoh: 31/12/2026)</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-[#d4c3a3] rounded-lg hover:bg-[#ebdcb8] cursor-pointer transition-colors">
                          <input type="radio" name="dateFormat" className="w-4 h-4 text-[#8a6d1c] focus:ring-[#8a6d1c]" />
                          <span className="text-[#3a2012] text-sm">MM/DD/YYYY (contoh: 12/31/2026)</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-[#d4c3a3] flex justify-end">
                      <button type="button" onClick={(e) => handleSaveSettings(e as any)} className="flex items-center gap-2 bg-[#3a2012] text-[#f9f6f0] px-6 py-2.5 rounded-lg hover:bg-[#2a160b] transition-colors font-bold shadow-sm">
                        <Save className="w-4 h-4" /> Simpan Pengaturan
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilSiswa;
