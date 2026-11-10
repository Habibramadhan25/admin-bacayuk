import { useState, useEffect } from 'react';
import { MOCK_BOOKS, BookItem } from '../data/mockData';
import { BULAN_CHAPTERS } from '../data/bulanChapters';

const STORAGE_KEY = 'bacayuk_books';

/**
 * Normalisasi data buku dari format Admin / LocalStorage ke format BookItem Mobile
 */
export function mapRawToBookItem(raw: any): BookItem {
  if (!raw) return MOCK_BOOKS[0];

  const defaultCover =
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600';

  const isBulan =
    (raw.title && /bulan/i.test(String(raw.title))) ||
    String(raw.id).includes('bulan') ||
    String(raw.id).includes('1793889302336') ||
    (raw.fileName && /bulan/i.test(String(raw.fileName))) ||
    (raw.fileUrl && /1Asc4x3ydaAE6YLNUiwsVbYHMMjYyk2W_/i.test(String(raw.fileUrl)));

  const chapters = isBulan
    ? BULAN_CHAPTERS
    : (Array.isArray(raw.chapters) && raw.chapters.length > 0
        ? raw.chapters
        : [
            {
              id: 'c1',
              title: `1. Bab Pembuka: ${raw.title || 'Pendahuluan'}`,
              content: `${
                raw.description || raw.synopsis || 'Pengantar bacaan naskah lengkap karya sastra.'
              }\n\nSelamat datang di lembaran naskah digital perpustakaan BacaYuk! Naskah ini telah diintegrasikan secara terstruktur ke dalam pembaca digital berfitur lengkap.\n\nSetiap bab menyajikan renungan mendalam, alur pemikiran sistematis, dan pembelajaran berharga yang dapat dipetik pembaca.`,
            },
            {
              id: 'c2',
              title: '2. Bab Pengantar & Latar Cerita',
              content:
                'Latar belakang dan narasi utama dari naskah ini membimbing pembaca menyelami inti pemikiran serta kisah yang hendak disampaikan oleh penulis.\n\nDalam dinamika alur yang disajikan, setiap tokoh dan gagasan berkembang selaras dengan tema utama bacaan.',
            },
            {
              id: 'c3',
              title: '3. Bab Inti & Pembahasan Pokok',
              content:
                'Pada bagian ini, inti pesan dan perjalanan gagasan disajikan secara komprehensif. Pembaca diajak untuk menganalisis dan merefleksikan nilai-nilai penting yang tertuang dalam setiap paragraf naskah.',
            },
            {
              id: 'c4',
              title: '4. Bab Penutup & Kesimpulan',
              content:
                'Sebuah penutup yang merangkum keseluruhan pelajaran berharga dari naskah ini. Membaca membuka jendela pengetahuan dan membebaskan jiwa dari ketidaktahuan.',
            },
          ]);

  return {
    id: String(raw.id),
    title: raw.title || 'Tanpa Judul',
    author: isBulan ? (raw.author || 'Tere Liye') : (raw.author || 'Anonim'),
    coverUrl: raw.coverUrl || defaultCover,
    category: raw.category || 'Umum',
    rating: typeof raw.rating === 'number' && raw.rating > 0 ? raw.rating : 4.8,
    reviewsCount: raw.readers || raw.reviewsCount || 120,
    language: raw.language || 'Indonesia',
    totalPages: isBulan ? 401 : (raw.totalPages || 180),
    publisher: raw.publisher || 'Penerbit BacaYuk',
    publishedYear:
      raw.publishedYear ||
      (typeof raw.year === 'number' ? raw.year : new Date().getFullYear()),
    synopsis:
      raw.synopsis ||
      raw.description ||
      'Sinopsis lengkap buku ini belum dimasukkan oleh pengelola perpustakaan.',
    progressPercentage: raw.progressPercentage || 0,
    lastReadTime: raw.lastReadTime,
    isFavorite: Boolean(raw.isFavorite),
    isDownloaded: Boolean(raw.isDownloaded),
    chapters,
    sourceName: raw.sourceName,
    sourceUrl: raw.sourceUrl,
    fileName: raw.fileName,
    fileSize: raw.fileSize,
    fileType: raw.fileType,
    fileUrl: raw.fileUrl,
  };
}

export const BookStorage = {
  /**
   * Mengambil semua daftar buku (dari localStorage yang terhubung dengan Admin)
   */
  getBooks(): BookItem[] {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Auto-heal data buku BULAN jika di localStorage babnya belum lengkap
            let healed = false;
            const normalized = parsed.map((b: any) => {
              const isBulan =
                (b.title && /bulan/i.test(String(b.title))) ||
                String(b.id).includes('bulan') ||
                String(b.id).includes('1793889302336') ||
                (b.fileName && /bulan/i.test(String(b.fileName))) ||
                (b.fileUrl && /1Asc4x3ydaAE6YLNUiwsVbYHMMjYyk2W_/i.test(String(b.fileUrl)));

              if (isBulan) {
                if (!b.chapters || b.chapters.length < 25 || b.totalPages !== 401) {
                  healed = true;
                  return {
                    ...b,
                    author: b.author || 'Tere Liye',
                    totalPages: 401,
                    fileSize: '401 Halaman',
                    chapters: BULAN_CHAPTERS,
                  };
                }
              }
              return b;
            });

            if (healed) {
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
              } catch {}
            }

            // Filter hanya buku yang dipublikasikan jika memiliki properti status
            const filtered = normalized.filter(
              (b: any) => !b.status || b.status === 'Published'
            );
            return filtered.map(mapRawToBookItem);
          }
        } else {
          // Jika belum ada data di localStorage, inisialisasi dengan data awal MOCK_BOOKS
          localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_BOOKS));
        }
      } catch (err) {
        console.warn('Gagal membaca buku dari storage:', err);
      }
    }
    return MOCK_BOOKS;
  },

  /**
   * Mengambil detail satu buku berdasarkan ID
   */
  getBookById(id: string): BookItem | null {
    const all = this.getBooks();
    return all.find((b) => String(b.id) === String(id)) || null;
  },
};

import { mobileRealtime } from './realtime';

/**
 * Hook reaktif agar halaman otomatis update secara real-time saat admin menambahkan / mengubah / menghapus buku
 */
export function useBooks() {
  const [books, setBooks] = useState<BookItem[]>(() => BookStorage.getBooks());

  useEffect(() => {
    const refresh = () => {
      setBooks(BookStorage.getBooks());
    };

    // 1. Sinkronisasi real-time instan melalui mobileRealtime (BroadcastChannel + SSE)
    const unsubscribe = mobileRealtime.subscribe((msg) => {
      if (msg.type.includes('BOOK') || msg.type === 'STATE_SYNCED') {
        if (msg.data?.books && Array.isArray(msg.data.books)) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(msg.data.books));
          } catch {}
        } else if (msg.data?.book) {
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const list = raw ? JSON.parse(raw) : [];
            const updated = [msg.data.book, ...list.filter((b: any) => b.id !== msg.data.book.id)];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {}
        }
        refresh();
      }
    });

    // 2. Sinkronisasi awal dengan server runtime state
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      fetch('/api/realtime/state')
        .then((r) => r.json())
        .then((res) => {
          if (res?.success && Array.isArray(res.data?.books) && res.data.books.length > 0) {
            let currentList: any[] = [];
            try {
              const current = localStorage.getItem(STORAGE_KEY);
              if (current) currentList = JSON.parse(current);
            } catch {}

            const map = new Map<string, any>();
            currentList.forEach((b: any) => {
              if (b?.id) map.set(String(b.id), b);
            });

            // Timpa / lengkapi dengan data dari server
            res.data.books.forEach((serverBook: any) => {
              if (!serverBook?.id) return;
              const existing = map.get(String(serverBook.id));
              if (
                !existing ||
                (serverBook.chapters && serverBook.chapters.length > (existing.chapters?.length || 0))
              ) {
                map.set(String(serverBook.id), { ...existing, ...serverBook });
              }
            });

            const merged = Array.from(map.values());
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            refresh();
          } else {
            // Jika server belum memiliki data buku, kirim data lokal ke server untuk dibroadcast
            const current = localStorage.getItem(STORAGE_KEY);
            if (current) {
              try {
                const parsed = JSON.parse(current);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  fetch('/api/realtime/state', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ books: parsed }),
                  }).catch(() => {});
                }
              } catch {}
            }
          }
        })
        .catch(() => {});
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', refresh);
      window.addEventListener('bacayuk_books_updated', refresh);
      window.addEventListener('focus', refresh);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', refresh);
        window.removeEventListener('bacayuk_books_updated', refresh);
        window.removeEventListener('focus', refresh);
      }
    };
  }, []);

  return { books, refreshBooks: () => setBooks(BookStorage.getBooks()) };
}
