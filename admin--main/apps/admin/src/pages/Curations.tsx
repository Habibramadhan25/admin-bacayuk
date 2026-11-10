import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  MoveUp, 
  MoveDown, 
  Layers, 
  Image as ImageIcon, 
  BookOpen, 
  Flame, 
  Award, 
  Heart, 
  Star, 
  Check, 
  X, 
  ExternalLink,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertTriangle
} from 'lucide-react';
import { 
  PromoBanner, 
  CuratedShelf, 
  Book, 
  initialBanners, 
  initialCurations, 
  initialBooks, 
  initLocalStorage 
} from '../lib/mockData';
import { realtime } from '../lib/realtime';

export const Curations: React.FC = () => {
  initLocalStorage();

  const [activeTab, setActiveTab] = useState<'banners' | 'shelves'>('banners');
  
  // Data State
  const [banners, setBanners] = useState<PromoBanner[]>(() => {
    try {
      const data = localStorage.getItem('bacayuk_banners');
      return data ? JSON.parse(data) : initialBanners;
    } catch {
      return initialBanners;
    }
  });

  const [shelves, setShelves] = useState<CuratedShelf[]>(() => {
    try {
      const data = localStorage.getItem('bacayuk_curations');
      return data ? JSON.parse(data) : initialCurations;
    } catch {
      return initialCurations;
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

  // Mobile preview simulator carousel state
  const [previewBannerIndex, setPreviewBannerIndex] = useState(0);

  // Banner Modal State
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
  const [bannerForm, setBannerForm] = useState<Partial<PromoBanner>>({
    title: '',
    subtitle: '',
    badge: 'Spesial',
    buttonText: 'Jelajahi Koleksi',
    targetType: 'explore',
    targetValue: '',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    bgColor: '#3a2012',
    status: 'Active',
    order: 1
  });

  // Shelf Modal State
  const [showShelfModal, setShowShelfModal] = useState(false);
  const [editingShelf, setEditingShelf] = useState<CuratedShelf | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'banner' | 'shelf'; id: string; title: string } | null>(null);
  const [shelfForm, setShelfForm] = useState<Partial<CuratedShelf>>({
    title: '',
    description: '',
    badge: 'Kurasi Khusus',
    icon: 'Sparkles',
    bookIds: [],
    status: 'Active',
    order: 1
  });
  const [bookSearchTerm, setBookSearchTerm] = useState('');

  // Sync to localStorage and broadcast
  const saveBanners = (updated: PromoBanner[]) => {
    setBanners(updated);
    localStorage.setItem('bacayuk_banners', JSON.stringify(updated));
    window.dispatchEvent(new Event('bacayuk_banners_updated'));
    window.dispatchEvent(new Event('storage'));
    realtime.publish('STATE_SYNCED', { banners: updated });
  };

  const saveShelves = (updated: CuratedShelf[]) => {
    setShelves(updated);
    localStorage.setItem('bacayuk_curations', JSON.stringify(updated));
    window.dispatchEvent(new Event('bacayuk_curations_updated'));
    window.dispatchEvent(new Event('storage'));
    realtime.publish('STATE_SYNCED', { curations: updated });
  };

  // Auto rotate preview banner
  useEffect(() => {
    const activeBanners = banners.filter(b => b.status === 'Active');
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewBannerIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  // Handle Banner Form
  const openAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      title: '',
      subtitle: '',
      badge: 'Spesial',
      buttonText: 'Jelajahi Koleksi',
      targetType: 'explore',
      targetValue: '',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      bgColor: '#3a2012',
      status: 'Active',
      order: banners.length + 1
    });
    setShowBannerModal(true);
  };

  const openEditBanner = (b: PromoBanner) => {
    setEditingBanner(b);
    setBannerForm({ ...b });
    setShowBannerModal(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title?.trim()) return;

    if (editingBanner) {
      const updated = banners.map(b => b.id === editingBanner.id ? { ...b, ...bannerForm } as PromoBanner : b);
      saveBanners(updated);
    } else {
      const newBanner: PromoBanner = {
        id: 'ban_' + Date.now(),
        title: bannerForm.title || '',
        subtitle: bannerForm.subtitle || '',
        badge: bannerForm.badge || 'Unggulan',
        buttonText: bannerForm.buttonText || 'Lihat Sekarang',
        targetType: bannerForm.targetType || 'explore',
        targetValue: bannerForm.targetValue,
        imageUrl: bannerForm.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        bgColor: bannerForm.bgColor || '#3a2012',
        status: bannerForm.status || 'Active',
        order: banners.length + 1
      };
      saveBanners([...banners, newBanner]);
    }
    setShowBannerModal(false);
  };

  const executeDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'banner') {
      const updated = banners.filter(b => b.id !== deleteConfirm.id);
      saveBanners(updated);
    } else {
      const updated = shelves.filter(s => s.id !== deleteConfirm.id);
      saveShelves(updated);
    }
    setDeleteConfirm(null);
  };

  const handleToggleBannerStatus = (id: string) => {
    const updated = banners.map(b => b.id === id ? { ...b, status: (b.status === 'Active' ? 'Inactive' : 'Active') as 'Active' | 'Inactive' } : b);
    saveBanners(updated);
  };

  const handleMoveBanner = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const copy = [...banners];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    const updated = copy.map((item, idx) => ({ ...item, order: idx + 1 }));
    saveBanners(updated);
  };

  // Handle Shelf Form
  const openAddShelf = () => {
    setEditingShelf(null);
    setShelfForm({
      title: '',
      description: '',
      badge: 'Kurasi Khusus',
      icon: 'Sparkles',
      bookIds: [],
      status: 'Active',
      order: shelves.length + 1
    });
    setBookSearchTerm('');
    setShowShelfModal(true);
  };

  const openEditShelf = (s: CuratedShelf) => {
    setEditingShelf(s);
    setShelfForm({ ...s });
    setBookSearchTerm('');
    setShowShelfModal(true);
  };

  const handleSaveShelf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shelfForm.title?.trim()) return;

    if (editingShelf) {
      const updated = shelves.map(s => s.id === editingShelf.id ? { ...s, ...shelfForm } as CuratedShelf : s);
      saveShelves(updated);
    } else {
      const newShelf: CuratedShelf = {
        id: 'cur_' + Date.now(),
        title: shelfForm.title || '',
        description: shelfForm.description || '',
        badge: shelfForm.badge || 'Koleksi',
        icon: shelfForm.icon || 'Sparkles',
        bookIds: shelfForm.bookIds || [],
        status: shelfForm.status || 'Active',
        order: shelves.length + 1
      };
      saveShelves([...shelves, newShelf]);
    }
    setShowShelfModal(false);
  };

  const handleToggleShelfStatus = (id: string) => {
    const updated = shelves.map(s => s.id === id ? { ...s, status: (s.status === 'Active' ? 'Inactive' : 'Active') as 'Active' | 'Inactive' } : s);
    saveShelves(updated);
  };

  const handleMoveShelf = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= shelves.length) return;
    const copy = [...shelves];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    const updated = copy.map((item, idx) => ({ ...item, order: idx + 1 }));
    saveShelves(updated);
  };

  const toggleBookInShelf = (bookId: string) => {
    const current = shelfForm.bookIds || [];
    if (current.includes(bookId)) {
      setShelfForm({ ...shelfForm, bookIds: current.filter(id => id !== bookId) });
    } else {
      setShelfForm({ ...shelfForm, bookIds: [...current, bookId] });
    }
  };

  const renderShelfIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-5 h-5 text-amber-600" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'Award': return <Award className="w-5 h-5 text-purple-600" />;
      case 'Heart': return <Heart className="w-5 h-5 text-rose-600" />;
      case 'Star': return <Star className="w-5 h-5 text-yellow-600" />;
      default: return <Sparkles className="w-5 h-5 text-amber-700" />;
    }
  };

  const activeBanners = banners.filter(b => b.status === 'Active');
  const currentPreviewBanner = activeBanners[previewBannerIndex] || banners[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black font-serif text-[#2a160b] flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-[#8a6d1c]" />
            Banner Promosi & Rak Kurasi
          </h1>
          <p className="text-sm font-medium text-[#5a3a22]">
            Atur karusel banner utama dan kelola rak rekomendasi tematik di aplikasi mobile siswa
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#ebdcb8] p-1 rounded-xl border border-[#d4c3a3]">
          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'banners'
                ? 'bg-[#3a2012] text-[#f9f6f0] shadow-sm'
                : 'text-[#5a3a22] hover:text-[#2a160b]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Karusel Banner ({banners.length})
          </button>
          <button
            onClick={() => setActiveTab('shelves')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'shelves'
                ? 'bg-[#3a2012] text-[#f9f6f0] shadow-sm'
                : 'text-[#5a3a22] hover:text-[#2a160b]'
            }`}
          >
            <Layers className="w-4 h-4" />
            Rak Kurasi Khusus ({shelves.length})
          </button>
        </div>
      </div>

      {/* TAB 1: KARUSEL BANNER PROMOSI */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          {/* Top Preview & Action Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Mobile Banner Simulator */}
            <div className="lg:col-span-2 bg-[#f9f6f0] p-6 rounded-2xl border border-[#d4c3a3] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#8a6d1c]" />
                  <h3 className="font-bold text-[#2a160b] text-sm">Simulasi Tampilan di Layar Mobile</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#8a6d1c] font-bold bg-[#ebdcb8] px-2.5 py-1 rounded-full">
                  <span>Banner {previewBannerIndex + 1} dari {activeBanners.length || 1}</span>
                </div>
              </div>

              {/* Banner Visual Card */}
              {currentPreviewBanner ? (
                <div 
                  className="rounded-2xl p-6 relative overflow-hidden transition-all duration-500 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6 min-h-[190px]"
                  style={{
                    backgroundColor: currentPreviewBanner.bgColor || '#3a2012',
                    color: '#f9f6f0'
                  }}
                >
                  <div className="flex-1 space-y-2 z-10">
                    {currentPreviewBanner.badge && (
                      <span className="inline-block bg-[#8a6d1c] text-[#f9f6f0] text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {currentPreviewBanner.badge}
                      </span>
                    )}
                    <h2 className="text-xl sm:text-2xl font-bold font-serif leading-tight text-white drop-shadow-sm">
                      {currentPreviewBanner.title}
                    </h2>
                    <p className="text-xs text-slate-200 line-clamp-2 max-w-md">
                      {currentPreviewBanner.subtitle}
                    </p>
                    <div className="pt-2">
                      <span className="inline-block px-4 py-2 bg-white text-[#2a160b] font-bold text-xs rounded-lg shadow-sm">
                        {currentPreviewBanner.buttonText} →
                      </span>
                    </div>
                  </div>

                  {currentPreviewBanner.imageUrl && (
                    <div className="w-24 h-36 shrink-0 z-10">
                      <img 
                        src={currentPreviewBanner.imageUrl} 
                        alt="Hero Preview" 
                        className="w-full h-full object-cover rounded-xl shadow-xl border border-white/20"
                      />
                    </div>
                  )}

                  {/* Carousel navigation buttons */}
                  {activeBanners.length > 1 && (
                    <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none z-20">
                      <button 
                        onClick={() => setPreviewBannerIndex(prev => (prev - 1 + activeBanners.length) % activeBanners.length)}
                        className="pointer-events-auto p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setPreviewBannerIndex(prev => (prev + 1) % activeBanners.length)}
                        className="pointer-events-auto p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-[#8a6d1c]">Belum ada banner aktif.</div>
              )}

              {/* Dots */}
              {activeBanners.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {activeBanners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPreviewBannerIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === previewBannerIndex ? 'w-6 bg-[#8a6d1c]' : 'w-2 bg-[#d4c3a3]'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action & Info Card */}
            <div className="bg-[#f9f6f0] p-6 rounded-2xl border border-[#d4c3a3] shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#2a160b] text-base mb-2">Panduan Karusel Banner</h3>
                <p className="text-xs text-[#5a3a22] leading-relaxed mb-4">
                  Banner ini muncul paling atas di halaman utama aplikasi mobile siswa. Anda dapat mengarahkan pembaca langsung ke koleksi buku, kategori tertentu, atau naskah rekomendasi spesial.
                </p>
                <div className="space-y-2 text-xs text-[#8a6d1c] font-semibold bg-[#ebdcb8]/60 p-3 rounded-xl border border-[#d4c3a3]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Sinkronisasi instan ke aplikasi mobile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Dukungan target action (Koleksi / Buku / Kategori)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Bisa diaktifkan/dinonaktifkan sewaktu-waktu</span>
                  </div>
                </div>
              </div>

              <button
                onClick={openAddBanner}
                className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#3a2012] hover:bg-[#2a160b] text-[#f9f6f0] font-bold text-sm rounded-xl transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Tambah Banner Baru
              </button>
            </div>
          </div>

          {/* Banner Table / List */}
          <div className="bg-[#f9f6f0] rounded-2xl border border-[#d4c3a3] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#d4c3a3] bg-[#f0e6d2] flex justify-between items-center">
              <h3 className="font-bold text-[#2a160b] text-sm">Daftar Karusel Banner ({banners.length})</h3>
              <span className="text-xs text-[#8a6d1c] font-bold">Gunakan panah untuk mengubah urutan tayang</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#ebdcb8] text-[#3a2012] text-xs font-bold border-b border-[#d4c3a3]">
                    <th className="p-4 w-12 text-center">Urutan</th>
                    <th className="p-4">Visual & Judul Banner</th>
                    <th className="p-4">Badge & Target Aksi</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebdcb8]">
                  {banners.map((banner, index) => (
                    <tr key={banner.id} className="hover:bg-[#ebdcb8]/40 transition-colors">
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            disabled={index === 0}
                            onClick={() => handleMoveBanner(index, 'up')}
                            className="p-1 text-[#8a6d1c] hover:bg-[#ebdcb8] disabled:opacity-30 rounded transition-colors"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-black text-[#2a160b]">{index + 1}</span>
                          <button
                            disabled={index === banners.length - 1}
                            onClick={() => handleMoveBanner(index, 'down')}
                            className="p-1 text-[#8a6d1c] hover:bg-[#ebdcb8] disabled:opacity-30 rounded transition-colors"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={banner.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'} 
                            alt={banner.title}
                            className="w-14 h-20 object-cover rounded-lg border border-[#d4c3a3] shadow-xs"
                          />
                          <div>
                            <div className="font-bold text-[#2a160b] text-sm">{banner.title}</div>
                            <div className="text-xs text-[#8a6d1c] line-clamp-1 max-w-sm mt-0.5">{banner.subtitle}</div>
                            <div className="text-[11px] text-[#a49373] mt-1 font-mono">
                              Tombol: "{banner.buttonText}"
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2.5 py-0.5 bg-[#ebdcb8] text-[#8a6d1c] border border-[#d4c3a3] rounded-full text-xs font-bold">
                            {banner.badge || 'Spesial'}
                          </span>
                          <div className="text-xs text-[#5a3a22] font-semibold flex items-center gap-1">
                            <span className="text-[#a49373]">Target:</span>
                            <span className="capitalize">{banner.targetType}</span>
                            {banner.targetValue && <span className="text-[#8a6d1c]">({banner.targetValue})</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleBannerStatus(banner.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                            banner.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {banner.status === 'Active' ? '✓ Aktif Tayang' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditBanner(banner)}
                            className="p-2 text-[#8a6d1c] hover:bg-[#ebdcb8] rounded-lg transition-colors"
                            title="Edit Banner"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'banner', id: banner.id, title: banner.title })}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RAK KURASI KHUSUS */}
      {activeTab === 'shelves' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#f9f6f0] p-6 rounded-2xl border border-[#d4c3a3] shadow-sm">
            <div>
              <h3 className="font-bold text-[#2a160b] text-base">Kelola Rak Kurasi Tematik</h3>
              <p className="text-xs text-[#5a3a22] mt-1 max-w-2xl">
                Buat rak koleksi bertema seperti <span className="font-bold">"Pilihan Editor"</span>, <span className="font-bold">"Buku Cerita Rakyat"</span>, atau <span className="font-bold">"Spesial Hari Pahlawan"</span>. Anda bebas memilih naskah apa saja yang tampil di rak tersebut.
              </p>
            </div>
            <button
              onClick={openAddShelf}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#3a2012] hover:bg-[#2a160b] text-[#f9f6f0] font-bold text-xs rounded-xl transition-all shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              Buat Rak Kurasi Baru
            </button>
          </div>

          {/* Curated Shelves Cards */}
          <div className="space-y-6">
            {shelves.map((shelf, shelfIndex) => {
              const shelfBooks = books.filter(b => (shelf.bookIds || []).includes(b.id));

              return (
                <div key={shelf.id} className="bg-[#f9f6f0] rounded-2xl border border-[#d4c3a3] shadow-sm overflow-hidden">
                  {/* Shelf Header */}
                  <div className="p-5 border-b border-[#d4c3a3] bg-[#f0e6d2] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#ebdcb8] border border-[#d4c3a3]">
                        {renderShelfIcon(shelf.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black font-serif text-[#2a160b]">{shelf.title}</h3>
                          {shelf.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ebdcb8] text-[#8a6d1c] border border-[#d4c3a3]">
                              {shelf.badge}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            shelf.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {shelf.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#5a3a22] mt-0.5 font-medium">{shelf.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <div className="flex items-center gap-1 bg-[#ebdcb8] px-2 py-1 rounded-lg border border-[#d4c3a3]">
                        <button
                          disabled={shelfIndex === 0}
                          onClick={() => handleMoveShelf(shelfIndex, 'up')}
                          className="p-1 text-[#8a6d1c] hover:bg-[#d4c3a3] disabled:opacity-30 rounded transition-colors"
                          title="Pindah ke Atas"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black text-[#2a160b] px-1">{shelfIndex + 1}</span>
                        <button
                          disabled={shelfIndex === shelves.length - 1}
                          onClick={() => handleMoveShelf(shelfIndex, 'down')}
                          className="p-1 text-[#8a6d1c] hover:bg-[#d4c3a3] disabled:opacity-30 rounded transition-colors"
                          title="Pindah ke Bawah"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleToggleShelfStatus(shelf.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          shelf.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {shelf.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                      </button>

                      <button
                        onClick={() => openEditShelf(shelf)}
                        className="px-3 py-1.5 bg-white border border-[#d4c3a3] hover:bg-[#ebdcb8] text-[#3a2012] rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#8a6d1c]" /> Kelola Buku ({shelf.bookIds?.length || 0})
                      </button>

                      <button
                        onClick={() => setDeleteConfirm({ type: 'shelf', id: shelf.id, title: shelf.title })}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Rak Ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Shelf Books Horizontal Preview */}
                  <div className="p-5">
                    {shelfBooks.length > 0 ? (
                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                        {shelfBooks.map(b => (
                          <div 
                            key={b.id} 
                            className="w-36 shrink-0 bg-white p-3 rounded-xl border border-[#ebdcb8] shadow-2xs space-y-2 group hover:border-[#8a6d1c] transition-all"
                          >
                            <div className="relative">
                              <img 
                                src={b.coverUrl} 
                                alt={b.title}
                                className="w-full h-44 object-cover rounded-lg border border-[#d4c3a3] shadow-xs group-hover:scale-102 transition-transform"
                              />
                              <div className="absolute top-1.5 right-1.5 bg-[#2a160b]/80 text-[#f9f6f0] text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                {b.rating}
                              </div>
                            </div>
                            <div>
                              <div className="font-bold text-[#2a160b] text-xs line-clamp-1">{b.title}</div>
                              <div className="text-[11px] text-[#8a6d1c] line-clamp-1">{b.author}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-[#8a6d1c] text-xs">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Belum ada buku yang dimasukkan ke dalam rak ini. Klik "Kelola Buku" untuk memilih naskah buku.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: FORM BANNER PROMOSI */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#f9f6f0] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-[#d4c3a3] max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#ebdcb8] bg-[#f0e6d2] flex justify-between items-center">
              <h3 className="font-bold text-[#2a160b] text-base flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#8a6d1c]" />
                {editingBanner ? 'Edit Banner Promosi' : 'Tambah Banner Promosi Baru'}
              </h3>
              <button 
                onClick={() => setShowBannerModal(false)}
                className="p-1 text-[#a49373] hover:text-[#3a2012]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-[#3a2012] mb-1">Judul Utama Banner *</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title || ''}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="Contoh: Spesial Hari Pahlawan: Menelusuri Sejarah"
                  className="w-full px-3.5 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3a2012] mb-1">Subjudul / Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={bannerForm.subtitle || ''}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  placeholder="Contoh: Kisah inspiratif pejuang bangsa dalam membangun peradaban."
                  className="w-full px-3.5 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">Label Badge</label>
                  <input
                    type="text"
                    value={bannerForm.badge || ''}
                    onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                    placeholder="Contoh: Unggulan / Hari Pahlawan"
                    className="w-full px-3.5 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">Teks Tombol (CTA)</label>
                  <input
                    type="text"
                    value={bannerForm.buttonText || ''}
                    onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                    placeholder="Contoh: Jelajahi Sekarang"
                    className="w-full px-3.5 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">Tipe Aksi Tombol</label>
                  <select
                    value={bannerForm.targetType || 'explore'}
                    onChange={(e) => setBannerForm({ ...bannerForm, targetType: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white"
                  >
                    <option value="explore">Jelajahi Semua Koleksi</option>
                    <option value="book">Buka Buku Tertentu</option>
                    <option value="category">Buka Kategori Tertentu</option>
                  </select>
                </div>

                {bannerForm.targetType === 'book' ? (
                  <div>
                    <label className="block text-xs font-bold text-[#3a2012] mb-1">Pilih Buku Target</label>
                    <select
                      value={bannerForm.targetValue || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, targetValue: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white"
                    >
                      <option value="">-- Pilih Buku --</option>
                      {books.map(b => (
                        <option key={b.id} value={b.id}>{b.title} ({b.author})</option>
                      ))}
                    </select>
                  </div>
                ) : bannerForm.targetType === 'category' ? (
                  <div>
                    <label className="block text-xs font-bold text-[#3a2012] mb-1">Nama Kategori</label>
                    <input
                      type="text"
                      value={bannerForm.targetValue || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, targetValue: e.target.value })}
                      placeholder="Contoh: Cerita Anak / Sejarah"
                      className="w-full px-3.5 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white"
                    />
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3a2012] mb-1">URL Gambar Cover / Ilustrasi</label>
                <input
                  type="text"
                  value={bannerForm.imageUrl || ''}
                  onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">Warna Background (Hex)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bannerForm.bgColor || '#3a2012'}
                      onChange={(e) => setBannerForm({ ...bannerForm, bgColor: e.target.value })}
                      className="w-10 h-8 rounded border border-[#c2b192] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bannerForm.bgColor || '#3a2012'}
                      onChange={(e) => setBannerForm({ ...bannerForm, bgColor: e.target.value })}
                      className="flex-1 px-3 py-1.5 text-xs border border-[#c2b192] rounded-lg outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">Status Penayangan</label>
                  <select
                    value={bannerForm.status || 'Active'}
                    onChange={(e) => setBannerForm({ ...bannerForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white"
                  >
                    <option value="Active">Aktif Tayang</option>
                    <option value="Inactive">Nonaktif (Draft)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 border-t border-[#ebdcb8] flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#5a3a22] hover:bg-[#ebdcb8] rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3a2012] hover:bg-[#2a160b] text-[#f9f6f0] text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  Simpan Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FORM RAK KURASI & BUKU PICKER */}
      {showShelfModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#f9f6f0] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[#d4c3a3] max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#ebdcb8] bg-[#f0e6d2] flex justify-between items-center">
              <h3 className="font-bold text-[#2a160b] text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#8a6d1c]" />
                {editingShelf ? 'Edit Rak Kurasi' : 'Buat Rak Kurasi Baru'}
              </h3>
              <button 
                onClick={() => setShowShelfModal(false)}
                className="p-1 text-[#a49373] hover:text-[#3a2012]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShelf} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">Nama Rak Kurasi *</label>
                  <input
                    type="text"
                    required
                    value={shelfForm.title || ''}
                    onChange={(e) => setShelfForm({ ...shelfForm, title: e.target.value })}
                    placeholder="Contoh: Pilihan Editor / Cerita Rakyat"
                    className="w-full px-3.5 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">Label Badge</label>
                  <input
                    type="text"
                    value={shelfForm.badge || ''}
                    onChange={(e) => setShelfForm({ ...shelfForm, badge: e.target.value })}
                    placeholder="Contoh: Rekomendasi Utama / Warisan Budaya"
                    className="w-full px-3.5 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3a2012] mb-1">Deskripsi Singkat Rak</label>
                <input
                  type="text"
                  value={shelfForm.description || ''}
                  onChange={(e) => setShelfForm({ ...shelfForm, description: e.target.value })}
                  placeholder="Contoh: Kumpulan naskah pilihan dengan nilai budi pekerti terbaik."
                  className="w-full px-3.5 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">Ikon Rak</label>
                  <select
                    value={shelfForm.icon || 'Sparkles'}
                    onChange={(e) => setShelfForm({ ...shelfForm, icon: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white"
                  >
                    <option value="Sparkles">Sparkles (Kilauan)</option>
                    <option value="Flame">Flame (Api Semangat / Populer)</option>
                    <option value="BookOpen">BookOpen (Buku Terbuka)</option>
                    <option value="Award">Award (Penghargaan)</option>
                    <option value="Heart">Heart (Favorit)</option>
                    <option value="Star">Star (Bintang)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">Status</label>
                  <select
                    value={shelfForm.status || 'Active'}
                    onChange={(e) => setShelfForm({ ...shelfForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white"
                  >
                    <option value="Active">Aktif (Tampil di Home Mobile)</option>
                    <option value="Inactive">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* BOOK PICKER CHECKLIST */}
              <div className="pt-2 border-t border-[#ebdcb8]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#3a2012]">
                    Pilih Buku untuk Rak Ini ({shelfForm.bookIds?.length || 0} buku terpilih)
                  </label>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a49373]" />
                    <input
                      type="text"
                      placeholder="Cari judul..."
                      value={bookSearchTerm}
                      onChange={(e) => setBookSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1 text-xs border border-[#c2b192] rounded-lg outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto border border-[#d4c3a3] rounded-xl p-2 bg-white space-y-1">
                  {books
                    .filter(b => b.title.toLowerCase().includes(bookSearchTerm.toLowerCase()) || b.author.toLowerCase().includes(bookSearchTerm.toLowerCase()))
                    .map(b => {
                      const isSelected = (shelfForm.bookIds || []).includes(b.id);
                      return (
                        <div
                          key={b.id}
                          onClick={() => toggleBookInShelf(b.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#ebdcb8] border border-[#d4c3a3]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img src={b.coverUrl} alt={b.title} className="w-8 h-11 object-cover rounded shadow-2xs shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#2a160b] truncate">{b.title}</p>
                              <p className="text-[11px] text-[#8a6d1c] truncate">{b.author} • {b.category}</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                            isSelected ? 'bg-[#3a2012] border-[#3a2012] text-white' : 'border-[#d4c3a3]'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="p-4 border-t border-[#ebdcb8] flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowShelfModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#5a3a22] hover:bg-[#ebdcb8] rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3a2012] hover:bg-[#2a160b] text-[#f9f6f0] text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  Simpan Rak Kurasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL: HAPUS BANNER / RAK */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#f9f6f0] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-[#d4c3a3] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#ebdcb8] bg-[#f0e6d2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-[#2a160b] text-sm">
                  {deleteConfirm.type === 'banner' ? 'Hapus Banner Promosi' : 'Hapus Rak Kurasi'}
                </h3>
              </div>
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="p-1 text-[#a49373] hover:text-[#3a2012]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-[#5a3a22] leading-relaxed">
                Apakah Anda yakin ingin menghapus {deleteConfirm.type === 'banner' ? 'banner' : 'rak kurasi'}{' '}
                <b className="text-[#2a160b]">"{deleteConfirm.title}"</b>? Aksi ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="p-4 border-t border-[#ebdcb8] bg-[#f0e6d2] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-bold text-[#5a3a22] hover:bg-[#ebdcb8] rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Curations;
