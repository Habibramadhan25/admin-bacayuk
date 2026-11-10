import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookCopy, 
  PlusCircle, 
  Tags, 
  Users, 
  Star, 
  History, 
  Activity, 
  Settings, 
  LogOut,
  Menu,
  Bell,
  Search,
  X,
  Radio,
  Sparkles,
  Repeat,
  FileBarChart,
  BookOpen
} from 'lucide-react';
import { useRealtimeStatus, useRealtimeEvent } from '../lib/realtime';
import { useAdminNotifications, AdminNotification } from '../lib/notificationStorage';

function formatRelativeTime(isoString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
    return `${Math.floor(diff / 86400)} hari yang lalu`;
  } catch {
    return 'Baru saja';
  }
}

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatar, setAvatar] = useState(() => localStorage.getItem('bacayuk_admin_avatar') || '');
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [liveToast, setLiveToast] = useState<{ title: string; desc: string } | null>(null);
  const isLive = useRealtimeStatus();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useAdminNotifications();

  useRealtimeEvent((msg) => {
    if (msg.sender !== 'admin_portal') {
      if (msg.type === 'REVIEWS_UPDATED' || msg.type === 'REVIEW_CREATED') {
        const reviewer = msg.data?.review?.userName || 'Seorang Siswa';
        setLiveToast({
          title: '⭐ Ulasan Baru Masuk!',
          desc: `${reviewer} baru saja mengirimkan ulasan naskah buku digital secara real-time.`,
        });
        setTimeout(() => setLiveToast(null), 5000);
      } else if (msg.type === 'USER_REGISTERED' || msg.type === 'USER_JOINED') {
        const studentName =
          msg.data?.user?.name ||
          msg.data?.user?.fullName ||
          msg.data?.userName ||
          'Siswa Baru';
        const school =
          msg.data?.user?.school ||
          msg.data?.school ||
          'SMP Juara Bangsa';
        setLiveToast({
          title: '👤 Siswa Baru Mendaftar!',
          desc: `${studentName} (${school}) baru saja mendaftar akun BacaYuk secara real-time.`,
        });
        setTimeout(() => setLiveToast(null), 6000);
      }
    }
  });

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const handleAvatarUpdate = () => {
      setAvatar(localStorage.getItem('bacayuk_admin_avatar') || '');
    };
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, []);

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('bacayuk_admin_auth');
      sessionStorage.removeItem('bacayuk_admin_user');
      localStorage.removeItem('bacayuk_admin_auth');
      localStorage.removeItem('bacayuk_admin_user');
    } catch {}
    window.dispatchEvent(new Event('auth_changed'));
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Kelola Buku', path: '/books', icon: BookCopy },
    { name: 'Tambah Buku', path: '/books/add', icon: PlusCircle },
    { name: 'Kategori', path: '/categories', icon: Tags },
    { name: 'Pengguna', path: '/users', icon: Users },
    { name: 'Banner & Kurasi', path: '/curations', icon: Sparkles },
    { name: 'Sirkulasi & Pinjam', path: '/circulation', icon: Repeat },
    { name: 'Laporan & Ekspor', path: '/reports', icon: FileBarChart },
    { name: 'Rating Buku', path: '/ratings', icon: Star },
    { name: 'Riwayat Bacaan', path: '/history', icon: History },
    { name: 'Activity Log', path: '/activity', icon: Activity },
    { name: 'Pengaturan', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f0e6d2] flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#2a160b]/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#f9f6f0] border-r border-[#d4c3a3] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 print:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-[#d4c3a3]">
            <div className="flex items-center gap-2 text-[#3a2012] font-black font-serif text-2xl">
              <img src="/admin/logo.png" alt="BacaYuk Logo" className="w-9 h-9 object-contain" />
              <span>BacaYuk</span>
            </div>
            <button 
              className="ml-auto lg:hidden text-[#8a6d1c] hover:text-[#3a2012]"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }: { isActive: boolean }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition-colors ${
                    isActive 
                      ? 'bg-[#ebdcb8] text-[#8a6d1c] border border-[#d4c3a3]' 
                      : 'text-[#5a3a22] hover:bg-[#e6ddc5] hover:text-[#2a160b]'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </div>

          <div className="p-4 border-t border-[#d4c3a3]">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg font-bold text-[#5a3a22] hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-[#f9f6f0] border-b border-[#d4c3a3] flex items-center justify-between px-4 lg:px-8 z-10 shrink-0 relative shadow-sm print:hidden">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-[#8a6d1c] hover:text-[#3a2012]"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden md:block w-64">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a49373]" />
              <input 
                type="text" 
                placeholder="Cari sesuatu..." 
                className="w-full pl-10 pr-4 py-2 bg-[#ebdcb8] border-transparent rounded-full text-sm focus:bg-[#f9f6f0] focus:border-[#d4c3a3] focus:ring-2 focus:ring-[#8a6d1c]/20 outline-none transition-all placeholder-[#a49373] text-[#3a2012]"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6 relative">
            {/* Real-time status badge */}
            <div 
              title={isLive ? "Tersambung Real-Time (SSE + BroadcastChannel)" : "Menghubungkan..."}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                isLive 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs' 
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {isLive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="hidden sm:inline">Real-Time Sync</span>
              <span className="sm:hidden">Live</span>
            </div>

            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-[#3a2012]">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-xs font-bold text-[#8a6d1c]">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className={`relative p-2 text-[#5a3a22] hover:bg-[#ebdcb8] rounded-full transition-colors ${showNotifications ? 'bg-[#ebdcb8]' : ''}`}
                title="Notifikasi Sistem"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center rounded-full border-2 border-[#faf7f2] shadow-xs animate-in zoom-in-75">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-3 w-88 bg-[#f9f6f0] rounded-2xl shadow-2xl border border-[#d4c3a3] z-50 overflow-hidden transform origin-top-right animate-in fade-in scale-95 duration-200">
                    <div className="p-4 border-b border-[#d4c3a3] bg-[#ebdcb8]/50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#2a160b]">Notifikasi</h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-full border border-rose-200">
                            {unreadCount} Baru
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-[#8a6d1c] hover:text-[#5a3a22] font-bold hover:underline transition-colors cursor-pointer"
                        >
                          Tandai semua dibaca
                        </button>
                      )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-[#ebdcb8]/50">
                      {notifications.length > 0 ? (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              markAsRead(item.id);
                              setShowNotifications(false);
                              if (item.targetUrl) navigate(item.targetUrl);
                            }}
                            className={`p-3.5 hover:bg-[#ebdcb8]/50 transition-colors cursor-pointer flex gap-3 items-start ${
                              !item.read ? 'bg-[#ebdcb8]/25' : ''
                            }`}
                          >
                            <div className="w-9 h-9 rounded-xl bg-[#ebdcb8] text-[#8a6d1c] flex items-center justify-center shrink-0 border border-[#d4c3a3] mt-0.5">
                              {item.type.includes('BOOK') ? (
                                <BookOpen className="w-4 h-4 text-[#8a6d1c]" />
                              ) : item.type === 'REVIEW_CREATED' ? (
                                <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                              ) : item.type === 'USER_JOINED' ? (
                                <Users className="w-4 h-4 text-emerald-700" />
                              ) : item.type === 'CIRCULATION' ? (
                                <Repeat className="w-4 h-4 text-blue-700" />
                              ) : (
                                <Bell className="w-4 h-4 text-[#8a6d1c]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-bold text-[#2a160b] truncate">{item.title}</p>
                                {!item.read && (
                                  <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
                                )}
                              </div>
                              <p className="text-xs text-[#5c3e1e] mt-0.5 line-clamp-2 leading-relaxed">
                                {item.message}
                              </p>
                              <p className="text-[10px] text-[#a49373] mt-1 font-semibold">
                                {formatRelativeTime(item.time)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-10 text-center text-xs text-[#8a6d1c]">
                          Belum ada notifikasi baru
                        </div>
                      )}
                    </div>

                    <div className="p-3 border-t border-[#d4c3a3] text-center bg-[#ebdcb8]/40">
                      <button 
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/activity');
                        }}
                        className="text-xs text-[#3a2012] font-bold hover:text-[#5a3a22] transition-colors cursor-pointer"
                      >
                        Lihat Semua Riwayat Aktivitas ↗
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className={`focus:outline-none rounded-full ring-2 ring-transparent transition-all ${showProfileMenu ? 'ring-[#8a6d1c]/50' : 'hover:ring-[#8a6d1c]/30'}`}
              >
                {avatar ? (
                  <img src={avatar} alt="Admin" className="h-9 w-9 rounded-full object-cover shadow-sm border border-[#d4c3a3]" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-[#ebdcb8] flex items-center justify-center text-[#8a6d1c] font-bold shadow-sm border border-[#d4c3a3]">
                    A
                  </div>
                )}
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-3 w-56 bg-[#f9f6f0] rounded-xl shadow-xl border border-[#d4c3a3] z-50 overflow-hidden transform origin-top-right animate-in fade-in scale-95 duration-200">
                    <div className="p-4 border-b border-[#d4c3a3] bg-[#ebdcb8]">
                      <p className="font-bold text-[#2a160b] truncate">Administrator BacaYuk</p>
                      <p className="text-xs text-[#8a6d1c] font-bold truncate mt-0.5">admin@bacayuk.com</p>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/settings');
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-[#5a3a22] hover:bg-[#ebdcb8] hover:text-[#3a2012] font-bold rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" /> Pengaturan Akun
                      </button>
                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/activity');
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-[#5a3a22] hover:bg-[#ebdcb8] hover:text-[#3a2012] font-bold rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Activity className="w-4 h-4" /> Log Aktivitas
                      </button>
                    </div>
                    <div className="p-2 border-t border-[#d4c3a3]">
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 font-bold"
                      >
                        <LogOut className="w-4 h-4" /> Keluar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 print:p-0 print:overflow-visible">
          <div className="max-w-7xl mx-auto page-transition-enter-active">
            <Outlet />
          </div>
        </div>

        {/* Real-time Live Toast */}
        {liveToast && (
          <div className="fixed top-20 right-6 z-50 max-w-sm bg-[#3a2012] text-[#f9f6f0] p-4 rounded-2xl shadow-2xl border border-[#ebdcb8]/40 animate-in slide-in-from-top-4 duration-300 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#8a6d1c] flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-sm">
              ⚡
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-[#ebdcb8]">{liveToast.title}</h4>
              <p className="text-xs text-[#d4c3a3] mt-0.5 leading-relaxed">{liveToast.desc}</p>
            </div>
            <button 
              onClick={() => setLiveToast(null)} 
              className="text-[#a49373] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminLayout;
