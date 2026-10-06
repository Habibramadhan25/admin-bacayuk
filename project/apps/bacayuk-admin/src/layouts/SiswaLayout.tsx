import React, { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { BookOpen, LogOut, Search, User, Bell, Settings, Activity, Sun } from 'lucide-react';

const SiswaLayout = () => {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState(localStorage.getItem('bacayuk_siswa_name') || 'Siswa');
  const [studentAvatar, setStudentAvatar] = useState(localStorage.getItem('bacayuk_siswa_avatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(localStorage.getItem('bacayuk_siswa_name') || 'Siswa')}&background=4f46e5&color=fff&rounded=true`);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  React.useEffect(() => {
    const handleProfileUpdate = () => {
      const name = localStorage.getItem('bacayuk_siswa_name') || 'Siswa';
      const avatar = localStorage.getItem('bacayuk_siswa_avatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff&rounded=true`;
      setStudentName(name);
      setStudentAvatar(avatar);
    };

    window.addEventListener('profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('profile_updated', handleProfileUpdate);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('bacayuk_siswa_auth');
    localStorage.removeItem('bacayuk_siswa_name');
    window.dispatchEvent(new Event('auth_changed'));
    navigate('/siswa/login');
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col font-sans">
      {/* Navbar Minimalis */}
      <header className="bg-[#faf8f5] border-b border-[#ebdcb8] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 w-1/4">
              <Link to="/siswa" className="flex items-center gap-3">
                <div className="w-10 h-12 bg-[#3a2012] rounded-md flex items-center justify-center relative overflow-hidden">
                  <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-white/20"></div>
                  <BookOpen className="w-5 h-5 text-[#f9f6f0] ml-1" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-2xl font-black font-serif text-[#2a160b] block leading-none">BacaYuk</span>
                  <span className="text-xs text-[#8a6d1c] font-medium tracking-wide">Perpustakaan Siswa</span>
                </div>
              </Link>
            </div>
            
            {/* Center Navigation */}
            <div className="flex-1 flex justify-center items-center gap-2 sm:gap-8">
              <Link 
                to="/siswa" 
                className="text-sm font-bold text-[#2a160b] px-4 py-2 bg-[#f4f0e6] rounded-full transition-colors"
              >
                Beranda
              </Link>
              <Link 
                to="/siswa/katalog" 
                className="text-sm font-medium text-[#5a3a22] hover:text-[#2a160b] transition-colors"
              >
                Koleksi Buku
              </Link>
              <Link 
                to="/siswa/favorit" 
                className="text-sm font-medium text-[#5a3a22] hover:text-[#2a160b] transition-colors"
              >
                Favorit
              </Link>
              <Link 
                to="/siswa/riwayat" 
                className="text-sm font-medium text-[#5a3a22] hover:text-[#2a160b] transition-colors hidden sm:block"
              >
                Riwayat Baca
              </Link>
            </div>

            {/* Right Icons */}
            <div className="flex items-center justify-end gap-4 w-1/4">
              <button 
                className="p-2.5 rounded-full bg-[#f4f0e6] text-[#5a3a22] hover:bg-[#ebdcb8] transition-colors focus:outline-none hidden sm:block"
              >
                <Sun className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center focus:outline-none"
                >
                  <img 
                    src={studentAvatar}
                    alt="Profile" 
                    className="w-10 h-10 rounded-full shadow-sm object-cover border-2 border-transparent hover:border-[#d4c3a3] transition-all"
                  />
                </button>
                
                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden transform origin-top-right animate-in fade-in scale-95 duration-200">
                      <div className="p-4 border-b border-gray-100 bg-[#fbfaf8]">
                        <p className="font-bold text-[#2a160b] truncate text-sm">{studentName}</p>
                        <p className="text-xs text-[#8a6d1c] font-medium truncate">Siswa Aktif</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <button 
                          onClick={() => {
                            setShowProfileMenu(false);
                            navigate('/siswa/profil', { state: { tab: 'pengaturan' } });
                          }}
                          className="w-full text-left px-3 py-2.5 text-sm text-[#5a3a22] font-medium hover:bg-[#f4f0e6] hover:text-[#2a160b] rounded-xl transition-colors flex items-center gap-2"
                        >
                          <Settings className="w-4 h-4" /> Pengaturan
                        </button>
                      </div>
                      <div className="p-2 border-t border-gray-100">
                        <button 
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 font-medium"
                        >
                          <LogOut className="w-4 h-4" /> Keluar
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      
      <footer className="bg-[#faf8f5] border-t border-[#ebdcb8] mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-[#8a6d1c] font-medium text-sm">
          &copy; {new Date().getFullYear()} BacaYuk. Perpustakaan Digital Siswa.
        </div>
      </footer>
    </div>
  );
};

export default SiswaLayout;
