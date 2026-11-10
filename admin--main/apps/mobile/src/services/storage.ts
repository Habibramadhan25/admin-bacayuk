/**
 * Layanan penyimpanan lokal per akun untuk memisahkan data setiap siswa
 */
import { mobileRealtime } from './realtime';

const STORAGE_PREFIX = 'bacayuk_user_';

export const UserStorage = {
  /**
   * Mengambil daftar buku favorit khusus milik akun tertentu
   */
  getFavorites(userId?: string | null): string[] {
    if (!userId) return [];
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}_favorites`);
        if (raw) {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch (err) {
        console.warn('Gagal membaca storage favorit:', err);
      }
    }
    return [];
  },

  /**
   * Menyimpan daftar buku favorit khusus akun tertentu
   */
  saveFavorites(userId: string, favorites: string[]): void {
    if (!userId) return;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(
          `${STORAGE_PREFIX}${userId}_favorites`,
          JSON.stringify(favorites)
        );
      } catch (err) {
        console.warn('Gagal menyimpan storage favorit:', err);
      }
    }
  },

  /**
   * Toggle buku favorit untuk akun aktif
   */
  toggleFavorite(userId: string, bookId: string): string[] {
    const current = this.getFavorites(userId);
    const updated = current.includes(bookId)
      ? current.filter((id) => id !== bookId)
      : [...current, bookId];
    this.saveFavorites(userId, updated);
    return updated;
  },

  /**
   * Mengambil riwayat bacaan per akun
   */
  getReadingHistory(userId?: string | null): Array<{ bookId: string; progress: number; lastRead: string }> {
    if (!userId) return [];
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}_history`);
        if (raw) {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch (err) {
        console.warn('Gagal membaca riwayat:', err);
      }
    }
    return [];
  },

  /**
   * Menyimpan riwayat bacaan per akun dan sinkronisasi ke Admin
   */
  saveReadingProgress(
    userId: string,
    bookId: string,
    progress: number,
    extra?: {
      bookTitle?: string;
      author?: string;
      coverUrl?: string;
      currentPage?: number;
      totalPages?: number;
    }
  ): void {
    if (!userId) return;
    const history = this.getReadingHistory(userId);
    const existingIndex = history.findIndex((h) => h.bookId === bookId);
    const nowIso = new Date().toISOString();
    const nowFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const entry = {
      bookId,
      progress,
      lastRead: nowFormatted,
    };

    if (existingIndex >= 0) {
      history[existingIndex] = entry;
    } else {
      history.unshift(entry);
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(
          `${STORAGE_PREFIX}${userId}_history`,
          JSON.stringify(history)
        );

        // Sinkronisasi ke Riwayat Bacaan Global (bacayuk_history) untuk dipantau Admin
        const user = this.getActiveSessionUser();
        const studentName = user?.name || user?.fullName || user?.username || 'Siswa';
        const studentEmail = user?.email || `${user?.username || 'siswa'}@bacayuk.sch.id`;

        const rawGlobal = localStorage.getItem('bacayuk_history');
        const globalHistory: any[] = rawGlobal ? JSON.parse(rawGlobal) : [];

        const curPage = extra?.currentPage || Math.max(1, Math.round((progress / 100) * (extra?.totalPages || 100)));
        const totPage = extra?.totalPages || (extra?.bookTitle?.includes('BULAN') ? 401 : 100);

        const globalItem = {
          id: `hist_${userId}_${bookId}`,
          bookId,
          bookTitle: extra?.bookTitle || 'Buku Digital',
          author: extra?.author || 'Penulis',
          coverUrl: extra?.coverUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300',
          userId,
          userName: studentName,
          userEmail: studentEmail,
          userAvatar: user?.avatar,
          progress,
          currentPage: curPage,
          totalPages: totPage,
          lastRead: nowIso,
          status: progress >= 100 ? 'Selesai' : 'Sedang Dibaca',
        };

        const filteredGlobal = globalHistory.filter((h: any) => !(h.userId === userId && h.bookId === bookId));
        const updatedGlobal = [globalItem, ...filteredGlobal];
        localStorage.setItem('bacayuk_history', JSON.stringify(updatedGlobal));
        window.dispatchEvent(new Event('bacayuk_history_updated'));

        // Broadcast event real-time ke portal admin
        mobileRealtime.publish('READING_HISTORY_UPDATED', {
          historyItem: globalItem,
          userName: studentName,
          bookTitle: globalItem.bookTitle,
          page: curPage,
          totalPages: totPage,
          time: nowIso,
        });
      } catch (err) { }
    }
  },

  /**
   * Fitur Siswa Meminjam Buku Digital
   */
  borrowBook(
    userId: string,
    book: { id: string; title: string; coverUrl?: string; author?: string }
  ): { success: boolean; message: string; loan?: any } {
    if (!userId || !book) return { success: false, message: 'Data peminjaman tidak lengkap' };
    if (typeof localStorage === 'undefined') return { success: false, message: 'Storage tidak tersedia' };

    try {
      const user = this.getActiveSessionUser();
      const studentName = user?.name || user?.fullName || user?.username || 'Siswa';
      const studentEmail = user?.email || `${user?.username || 'siswa'}@bacayuk.sch.id`;

      const rawLoans = localStorage.getItem('bacayuk_circulation') || localStorage.getItem('bacayuk_loans');
      const loans: any[] = rawLoans ? JSON.parse(rawLoans) : [];

      // Cek apakah buku sedang aktif dipinjam siswa
      const existing = loans.find(
        (l) => l.userId === userId && l.bookId === book.id && l.status === 'Dipinjam'
      );
      if (existing) {
        return {
          success: false,
          message: `Buku "${book.title}" sedang Anda pinjam (Jatuh tempo: ${existing.dueDate}).`,
          loan: existing,
        };
      }

      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const newLoan = {
        id: `ln-${Date.now()}`,
        bookId: book.id,
        bookTitle: book.title,
        bookCover: book.coverUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300',
        userId,
        userName: studentName,
        userEmail: studentEmail,
        borrowDate: today,
        dueDate,
        returnDate: null,
        status: 'Dipinjam',
        fineAmount: 0,
        notes: 'Peminjaman mandiri oleh siswa via platform BacaYuk',
      };

      const updatedLoans = [newLoan, ...loans];
      localStorage.setItem('bacayuk_circulation', JSON.stringify(updatedLoans));
      localStorage.setItem('bacayuk_loans', JSON.stringify(updatedLoans));
      window.dispatchEvent(new Event('bacayuk_circulation_updated'));

      // Broadcast peminjaman baru ke portal admin real-time
      mobileRealtime.publish('LOAN_CREATED', {
        loan: newLoan,
        userName: studentName,
        bookTitle: book.title,
        borrowDate: today,
        dueDate,
      });

      return {
        success: true,
        message: `Buku "${book.title}" berhasil dipinjam! Batas waktu pengembalian s.d. ${dueDate}.`,
        loan: newLoan,
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal meminjam buku' };
    }
  },

  /**
   * Mengambil riwayat pinjam buku milik siswa
   */
  getActiveLoans(userId: string): any[] {
    if (!userId || typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem('bacayuk_circulation') || localStorage.getItem('bacayuk_loans');
      const loans: any[] = raw ? JSON.parse(raw) : [];
      return loans.filter((l) => l.userId === userId);
    } catch {
      return [];
    }
  },

  /**
   * Ambil sesi login aktif saat ini (disimpan per sesi browser/tab)
   */
  getActiveSessionUser(): any | null {
    if (typeof sessionStorage !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('bacayuk_active_session_user');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Simpan sesi login aktif ke sessionStorage (dan bersihkan localStorage agar saat buka baru selalu lewat login)
   */
  setActiveSessionUser(user: any | null): void {
    if (typeof sessionStorage !== 'undefined') {
      try {
        if (user) {
          sessionStorage.setItem('bacayuk_active_session_user', JSON.stringify(user));
        } else {
          sessionStorage.removeItem('bacayuk_active_session_user');
        }
      } catch { }
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('bacayuk_active_session_user');
      } catch { }
    }
  },

  /**
   * Reset seluruh sesi saat logout
   */
  clearSession(): void {
    this.setActiveSessionUser(null);
  },

  /**
   * Cek cepat status autentikasi:
   * true bila ada sesi login aktif, false bila belum login
   */
  isAuthenticated(): boolean {
    return Boolean(this.getActiveSessionUser());
  },
};
