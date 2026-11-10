import { useState, useEffect } from 'react';
import { initialBooks, type Book, type BookReview } from '../lib/mockData';
import { ReviewStorage } from '../lib/reviewStorage';
import { realtime } from '../lib/realtime';
import { Star, MessageSquare, Search, Trash2, Send, Plus, UserCheck } from 'lucide-react';

const Ratings = () => {
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const data = localStorage.getItem('bacayuk_books');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialBooks;
  });

  const [reviews, setReviews] = useState<BookReview[]>(() => ReviewStorage.getReviews());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  // Form tambah ulasan dari admin
  const [showAddReviewForm, setShowAddReviewForm] = useState(false);
  const [newReviewerName, setNewReviewerName] = useState('Admin Perpustakaan');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const data = localStorage.getItem('bacayuk_books');
        if (data) setBooks(JSON.parse(data));
      } catch {}
      setReviews(ReviewStorage.getReviews());
    };

    const unsubscribe = realtime.subscribe((msg) => {
      if (msg.type.includes('REVIEW') || msg.type.includes('BOOK') || msg.type === 'STATE_SYNCED') {
        handleUpdate();
      }
    });

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('bacayuk_books_updated', handleUpdate);
    window.addEventListener('bacayuk_reviews_updated', handleUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('bacayuk_books_updated', handleUpdate);
      window.removeEventListener('bacayuk_reviews_updated', handleUpdate);
    };
  }, []);

  const filtered = (books || []).filter(b => 
    b && (b.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating: number, size = 'w-4 h-4') => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < Math.floor(rating)
            ? 'fill-amber-400 text-amber-400'
            : i < rating
            ? 'fill-amber-400/50 text-amber-400'
            : 'fill-slate-200 text-[#ebdcb8]'
        }`}
      />
    ));
  };

  const selectedBookReviews = selectedBook
    ? reviews.filter((r) => r.bookId === selectedBook.id)
    : [];

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !newComment.trim()) return;

    ReviewStorage.addReview({
      bookId: selectedBook.id,
      userName: newReviewerName.trim() || 'Admin Perpustakaan',
      userAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      rating: newRating,
      comment: newComment.trim(),
    });

    setNewComment('');
    setShowAddReviewForm(false);
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviewToDelete(reviewId);
  };

  const confirmDeleteReview = () => {
    if (reviewToDelete) {
      ReviewStorage.deleteReview(reviewToDelete);
      setReviewToDelete(null);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2a160b]">Rating & Ulasan Buku</h1>
          <p className="text-[#8a6d1c]">Kelola ulasan, komentar, dan penilaian buku dari komunitas pembaca</p>
        </div>
      </div>

      <div className="bg-[#f9f6f0] rounded-xl shadow-sm border border-[#d4c3a3] overflow-hidden">
        <div className="p-4 border-b border-[#d4c3a3] flex justify-between items-center bg-[#f0e6d2]">
          <div className="relative w-full max-w-sm">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a49373]" />
            <input 
              type="text" 
              placeholder="Cari judul buku..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#c2b192] rounded-lg text-sm focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f0e6d2] border-b border-[#d4c3a3] text-[#8a6d1c] text-sm">
                <th className="p-4 font-medium w-96">Informasi Buku</th>
                <th className="p-4 font-medium">Rating Rata-rata</th>
                <th className="p-4 font-medium">Jumlah Ulasan</th>
                <th className="p-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((book) => {
                const bookReviewsCount = reviews.filter((r) => r.bookId === book.id).length;
                return (
                  <tr key={book.id} className="hover:bg-[#ebdcb8] transition-colors">
                    <td className="p-4 flex items-center gap-4">
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-16 h-24 object-cover rounded-md shadow-sm border border-[#d4c3a3]"
                      />
                      <div>
                        <div className="font-bold text-[#2a160b]">{book.title}</div>
                        <div className="text-xs text-[#8a6d1c] mt-0.5">{book.author} • {book.category}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(book.rating)}</div>
                        <span className="font-bold text-[#2a160b]">{book.rating}</span>
                      </div>
                    </td>
                    <td className="p-4 text-[#5a3a22]">
                      <span className="bg-[#ebdcb8] px-3 py-1 rounded-full text-xs font-semibold text-[#3a2012] border border-[#d4c3a3]">
                        {bookReviewsCount} ulasan teks
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedBook(book);
                          setShowAddReviewForm(false);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#d4c3a3] bg-white rounded-lg text-sm font-semibold text-[#5a3a22] hover:bg-[#ebdcb8] hover:text-[#8a6d1c] transition-colors shadow-xs"
                      >
                        <MessageSquare className="w-4 h-4 text-[#8a6d1c]" /> Lihat & Kelola Ulasan
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center">
              <Star className="w-12 h-12 text-[#ebdcb8] mb-3" />
              <p className="text-[#8a6d1c] font-medium">Buku tidak ditemukan.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Modal with Real Reviews and Interactive Management */}
      {selectedBook && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#f9f6f0] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-[#d4c3a3]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#ebdcb8] flex items-center justify-between bg-[#f0e6d2]">
              <div className="flex items-center gap-3">
                <img
                  src={selectedBook.coverUrl}
                  alt={selectedBook.title}
                  className="w-10 h-14 object-cover rounded-md shadow-xs border border-[#d4c3a3]"
                />
                <div>
                  <h3 className="text-lg font-bold text-[#2a160b] leading-tight">Ulasan Pembaca</h3>
                  <p className="text-xs text-[#8a6d1c] font-medium">{selectedBook.title} ({selectedBook.author})</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBook(null)}
                className="p-2 text-[#a49373] hover:bg-[#d4c3a3] rounded-full transition-colors"
              >
                <span className="sr-only">Tutup</span>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Rating Summary Card */}
              <div className="bg-[#f0e6d2] p-4 rounded-xl border border-[#ebdcb8] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-extrabold text-[#2a160b]">{selectedBook.rating}</div>
                  <div>
                    <div className="flex">{renderStars(selectedBook.rating, 'w-5 h-5')}</div>
                    <p className="text-xs text-[#8a6d1c] mt-1 font-medium">
                      Berdasarkan {selectedBookReviews.length} ulasan pembaca
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddReviewForm((prev) => !prev)}
                  className="px-4 py-2 bg-[#3a2012] text-[#f9f6f0] text-xs font-bold rounded-lg hover:bg-[#2a160b] transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddReviewForm ? 'Batal Tambah' : 'Tambah Ulasan'}</span>
                </button>
              </div>

              {/* Form Tambah Ulasan */}
              {showAddReviewForm && (
                <form
                  onSubmit={handleAddReview}
                  className="bg-white p-4 rounded-xl border border-[#c2b192] space-y-3 shadow-xs animate-in slide-in-from-top-3"
                >
                  <h4 className="text-sm font-bold text-[#2a160b]">Tulis Ulasan Baru</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#5a3a22] mb-1">Nama Pengulas</label>
                      <input
                        type="text"
                        value={newReviewerName}
                        onChange={(e) => setNewReviewerName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c]"
                        placeholder="Contoh: Admin atau Pembaca"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5a3a22] mb-1">Beri Nilai Bintang</label>
                      <div className="flex items-center gap-1.5 pt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setNewRating(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-[#8a6d1c] ml-2">{newRating} / 5</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#5a3a22] mb-1">Isi Ulasan</label>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c]"
                      placeholder="Tulis ulasan menarik tentang naskah buku ini..."
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddReviewForm(false)}
                      className="px-3 py-1.5 text-xs text-[#5a3a22] hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#8a6d1c] hover:bg-[#6e5614] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Ulasan</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Daftar Ulasan */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#8a6d1c] uppercase tracking-wider">
                  Daftar Ulasan ({selectedBookReviews.length})
                </h4>

                {selectedBookReviews.length > 0 ? (
                  selectedBookReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 bg-white rounded-xl border border-[#ebdcb8] shadow-xs space-y-2 group hover:border-[#c2b192] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          {rev.userAvatar ? (
                            <img
                              src={rev.userAvatar}
                              alt={rev.userName}
                              className="w-8 h-8 rounded-full object-cover border border-[#d4c3a3]"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#ebdcb8] text-[#3a2012] font-bold text-xs flex items-center justify-center">
                              {rev.userName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-[#2a160b] flex items-center gap-1.5">
                              <span>{rev.userName}</span>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="flex">{renderStars(rev.rating, 'w-3 h-3')}</div>
                              <span className="text-[10px] text-[#a49373]">
                                {new Date(rev.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id)}
                          title="Hapus Ulasan Ini"
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-70 hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-[#4a3525] leading-relaxed pl-10">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center flex flex-col items-center justify-center text-[#a49373]">
                    <MessageSquare className="w-10 h-10 mb-2 text-[#ebdcb8]" />
                    <p className="text-xs font-semibold text-[#5a3a22]">Belum ada ulasan untuk buku ini.</p>
                    <p className="text-[11px] text-[#8a6d1c] mt-0.5">
                      Klik "Tambah Ulasan" di atas untuk menambahkan ulasan pertama.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#ebdcb8] bg-[#f0e6d2] text-right">
              <button
                onClick={() => setSelectedBook(null)}
                className="px-5 py-2 bg-[#2a160b] text-[#f9f6f0] text-xs font-bold hover:bg-slate-800 rounded-xl transition-colors"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Hapus Review */}
      {reviewToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#fcfaf7] border border-[#d4c3a3] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-700 font-bold">
              <div className="p-2 bg-rose-100 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <span className="text-base">Hapus Ulasan?</span>
            </div>
            <p className="text-xs text-[#5c3e1e] leading-relaxed">
              Apakah Anda yakin ingin menghapus ulasan pembaca ini? Ulasan yang dihapus tidak dapat dipulihkan.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReviewToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-[#5c3e1e] hover:bg-[#ebdcb8] rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteReview}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ratings;
