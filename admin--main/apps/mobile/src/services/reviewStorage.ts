import { useState, useEffect } from 'react';
import { BookReview, MOCK_REVIEWS } from '../data/mockData';

import { mobileRealtime } from './realtime';

const REVIEWS_STORAGE_KEY = 'bacayuk_reviews';
const BOOKS_STORAGE_KEY = 'bacayuk_books';

export const MobileReviewStorage = {
  getReviews(bookId?: string): BookReview[] {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
        let list: BookReview[] = [];
        if (raw) {
          list = JSON.parse(raw);
        } else {
          list = MOCK_REVIEWS;
          localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(MOCK_REVIEWS));
        }

        if (bookId) {
          return list.filter((r) => String(r.bookId) === String(bookId));
        }
        return list;
      } catch (err) {
        console.warn('Gagal membaca reviews dari storage:', err);
      }
    }

    if (bookId) {
      return MOCK_REVIEWS.filter((r) => String(r.bookId) === String(bookId));
    }
    return MOCK_REVIEWS;
  },

  addReview(newReview: Omit<BookReview, 'id' | 'createdAt'>): BookReview {
    const all = this.getReviews();
    const created: BookReview = {
      ...newReview,
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [created, ...all];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updated));

        // Sync rating to book
        this.syncBookRating(newReview.bookId, updated);

        // Kirim event real-time ke semua tab dan server
        mobileRealtime.publish('REVIEWS_UPDATED', {
          review: created,
          bookId: newReview.bookId,
          reviews: updated,
        });

        window.dispatchEvent(new Event('bacayuk_reviews_updated'));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.warn('Gagal simpan review ke storage:', err);
      }
    }

    return created;
  },

  syncBookRating(bookId: string, allReviews: BookReview[]) {
    if (typeof localStorage === 'undefined') return;
    try {
      const bookReviews = allReviews.filter((r) => String(r.bookId) === String(bookId));
      const rawBooks = localStorage.getItem(BOOKS_STORAGE_KEY);
      if (!rawBooks) return;

      const books = JSON.parse(rawBooks);
      if (!Array.isArray(books)) return;

      const avg =
        bookReviews.length > 0
          ? Number(
              (
                bookReviews.reduce((acc, curr) => acc + curr.rating, 0) /
                bookReviews.length
              ).toFixed(1)
            )
          : 5.0;

      const updatedBooks = books.map((b: any) => {
        if (String(b.id) === String(bookId)) {
          return {
            ...b,
            rating: avg,
            readers: (b.readers || 0) + 1,
            reviewsCount: bookReviews.length,
          };
        }
        return b;
      });

      localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(updatedBooks));
      window.dispatchEvent(new Event('bacayuk_books_updated'));
    } catch (err) {
      console.warn('Gagal sinkronisasi rating buku:', err);
    }
  },
};

/**
 * Hook reaktif untuk mengambil ulasan buku secara real-time
 */
export function useBookReviews(bookId: string) {
  const [reviews, setReviews] = useState<BookReview[]>(() =>
    MobileReviewStorage.getReviews(bookId)
  );

  useEffect(() => {
    const refresh = () => {
      setReviews(MobileReviewStorage.getReviews(bookId));
    };

    const unsubscribe = mobileRealtime.subscribe((msg) => {
      if (msg.type.includes('REVIEW') && (!msg.data?.bookId || String(msg.data.bookId) === String(bookId))) {
        refresh();
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', refresh);
      window.addEventListener('bacayuk_reviews_updated', refresh);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', refresh);
        window.removeEventListener('bacayuk_reviews_updated', refresh);
      }
    };
  }, [bookId]);

  return { reviews, reload: () => setReviews(MobileReviewStorage.getReviews(bookId)) };
}
