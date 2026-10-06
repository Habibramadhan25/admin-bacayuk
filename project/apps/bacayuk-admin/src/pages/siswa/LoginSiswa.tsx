import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, User, Lock, Eye, EyeOff, Loader2, Sparkles, Medal, Book, Bookmark } from 'lucide-react';

const LoginSiswa = () => {
  const [nis, setNis] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nis || !password) {
      setError('Username/Email dan password harus diisi');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (nis.length >= 4 && password.length >= 4) {
        const registeredNis = localStorage.getItem('registered_siswa_nis');
        const registeredName = localStorage.getItem('registered_siswa_name');
        
        let finalName = nis;
        if (nis === 'siswa') {
          finalName = 'Budi Santoso';
        } else if (nis === registeredNis && registeredName) {
          finalName = registeredName;
        }

        localStorage.setItem('bacayuk_siswa_auth', 'true');
        localStorage.setItem('bacayuk_siswa_name', finalName);
        window.dispatchEvent(new Event('auth_changed'));
        navigate('/siswa');
      } else {
        setError('Username atau password salah. Coba lagi.');
        setLoading(false);
      }
    }, 1200);
  };

  const handleDemo = () => {
    setNis('siswa');
    setPassword('123456');
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 sm:p-8"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1601058268499-e52658b8ebf8?auto=format&fit=crop&q=80&w=2000")' }}
    >
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        
        {/* Left Section - The Book Page */}
        <div className="hidden lg:block relative group perspective-1000">
          <div className="absolute inset-0 bg-black/10 rounded-tr-3xl rounded-br-3xl transform translate-x-2 translate-y-4 blur-md"></div>
          <div className="relative bg-[#f9f6f0] p-12 rounded-tr-3xl rounded-br-3xl shadow-2xl border-l-4 border-[#d4c3a3] text-[#3a2012]">
            
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#8a6d1c] rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-7 h-7 text-[#f9f6f0]" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#3a2012] font-serif">BacaYuk</h1>
                <p className="text-xs font-bold text-[#8a6d1c] tracking-widest uppercase">Perpustakaan Digital Pelajar</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ebdcb8] text-[#8a6d1c] rounded-full text-xs font-bold mb-8 border border-[#d4c3a3]">
              <Book className="w-3 h-3" /> GERAKAN LITERASI SEKOLAH
            </div>

            <h2 className="text-5xl font-black mb-8 leading-tight font-serif text-[#2a160b]">
              Membuka cakrawala ilmu,<br/>satu halaman setiap hari.
            </h2>

            <div className="bg-[#f0e6d2] border border-[#d4c3a3] rounded-xl p-6 mb-10 shadow-inner relative">
              <div className="absolute -top-3 -left-2 text-4xl text-[#d4af37]">"</div>
              <p className="text-[#5a3a22] font-medium italic relative z-10 text-lg leading-relaxed">
                Buku adalah lentera yang tak pernah padam di tengah pekatnya ketidaktahuan. Setiap kata yang dibaca adalah langkah kecil menuju cita-cita luhur.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-[#8a6d1c]">
                <div className="w-6 h-[1px] bg-[#8a6d1c]"></div>
                Pustaka Juara BacaYuk
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#ebdcb8] flex items-center justify-center shrink-0 border border-[#d4c3a3]">
                  <Book className="w-5 h-5 text-[#8a6d1c]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#3a2012] text-lg">1.200+ Buku Terkurasi</h3>
                  <p className="text-[#5a3a22] text-sm">Sastra, fiksi, cerita rakyat & ensiklopedia anak.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#ebdcb8] flex items-center justify-center shrink-0 border border-[#d4c3a3]">
                  <Bookmark className="w-5 h-5 text-[#8a6d1c]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#3a2012] text-lg">Jurnal Baca & Streak</h3>
                  <p className="text-[#5a3a22] text-sm">Catat jam membaca harian dan progres bacaan.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#ebdcb8] flex items-center justify-center shrink-0 border border-[#d4c3a3]">
                  <Medal className="w-5 h-5 text-[#8a6d1c]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#3a2012] text-lg">Lencana Kehormatan</h3>
                  <p className="text-[#5a3a22] text-sm">Kumpulkan poin literasi untuk sekolahmu.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Section - Login Form (Paper Stack) */}
        <div className="relative max-w-md w-full mx-auto">
          {/* Stack effect papers */}
          <div className="absolute inset-0 bg-[#f0e6d2] rounded-2xl transform rotate-3 shadow-lg"></div>
          <div className="absolute inset-0 bg-[#e6ddc5] rounded-2xl transform -rotate-2 shadow-lg"></div>
          
          <div className="relative bg-[#f9f6f0] p-8 sm:p-10 rounded-2xl shadow-xl border border-[#ebdcb8]">
            {/* Tabs */}
            <div className="flex p-1 bg-[#ebdcb8] rounded-xl mb-8">
              <button className="flex-1 py-2.5 bg-[#f9f6f0] text-[#3a2012] font-bold rounded-lg shadow-sm flex items-center justify-center gap-2">
                Masuk
              </button>
              <Link to="/siswa/register" className="flex-1 py-2.5 text-[#8a6d1c] font-bold rounded-lg hover:bg-white/50 transition-colors flex items-center justify-center gap-2">
                Daftar Akun
              </Link>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-[#5a3a22] mb-2">Username atau Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-[#8a6d1c]" />
                  </div>
                  <input
                    type="text"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-[#ebdcb8] border border-[#d4c3a3] rounded-xl text-[#3a2012] font-medium placeholder-[#a49373] focus:ring-2 focus:ring-[#8a6d1c] focus:bg-[#f0e6d2] focus:outline-none transition-all"
                    placeholder="Masukkan username (cth: siswa)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#5a3a22] mb-2">Kata Sandi</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-[#8a6d1c]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3.5 bg-[#ebdcb8] border border-[#d4c3a3] rounded-xl text-[#3a2012] font-medium placeholder-[#a49373] focus:ring-2 focus:ring-[#8a6d1c] focus:bg-[#f0e6d2] focus:outline-none transition-all"
                    placeholder="Masukkan kata sandi akun"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#8a6d1c] hover:text-[#5a3a22]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#3a2012] hover:bg-[#2a160b] text-[#f9f6f0] font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk ke Perpustakaan →'}
              </button>
            </form>


            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-[#8a6d1c] hover:text-[#5a3a22] font-bold underline underline-offset-4">
                Masuk sebagai Pengurus (Admin)
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginSiswa;
