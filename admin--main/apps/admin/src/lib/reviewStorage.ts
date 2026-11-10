import { BookReview, initialReviews, Book } from './mockData';
import { realtime } from './realtime';

const REVIEWS_STORAGE_KEY = 'bacayuk_reviews';
const BOOKS_STORAGE_KEY = 'bacayuk_books';

export const ReviewStorage = {
  getReviews(bookId?: string): BookReview[] {
    try {
      const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
      let reviews: BookReview[] = [];
      if (raw) {
        reviews = JSON.parse(raw);
      } else {
        reviews = initialReviews;
        localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(initialReviews));
      }

      if (bookId) {
        return reviews.filter((r) => r.bookId === bookId);
      }
      return reviews;
    } catch {
      return initialReviews;
    }
  },

  addReview(newReview: Omit<BookReview, 'id' | 'createdAt'>): BookReview {
    const reviews = this.getReviews();
    const created: BookReview = {
      ...newReview,
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [created, ...reviews];
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updated));

    // Update book rating & reader/review count in localStorage
    this.syncBookRating(newReview.bookId, updated);

    realtime.publish('REVIEWS_UPDATED', {
      action: 'created',
      review: created,
      reviews: updated,
    });

    window.dispatchEvent(new Event('bacayuk_reviews_updated'));
    window.dispatchEvent(new Event('storage'));
    return created;
  },

  deleteReview(reviewId: string) {
    const reviews = this.getReviews();
    const target = reviews.find((r) => r.id === reviewId);
    const updated = reviews.filter((r) => r.id !== reviewId);
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updated));

    if (target) {
      this.syncBookRating(target.bookId, updated);
    }

    realtime.publish('REVIEWS_UPDATED', {
      action: 'deleted',
      reviewId,
      reviews: updated,
    });

    window.dispatchEvent(new Event('bacayuk_reviews_updated'));
    window.dispatchEvent(new Event('storage'));
  },

  syncBookRating(bookId: string, allReviews: BookReview[]) {
    try {
      const bookReviews = allReviews.filter((r) => r.bookId === bookId);
      const rawBooks = localStorage.getItem(BOOKS_STORAGE_KEY);
      if (!rawBooks) return;

      const books: Book[] = JSON.parse(rawBooks);
      const avg =
        bookReviews.length > 0
          ? Number(
              (
                bookReviews.reduce((acc, curr) => acc + curr.rating, 0) /
                bookReviews.length
              ).toFixed(1)
            )
          : 5.0;

      const updatedBooks = books.map((b) => {
        if (b.id === bookId) {
          return {
            ...b,
            rating: avg,
          };
        }
        return b;
      });

      localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(updatedBooks));
      window.dispatchEvent(new Event('bacayuk_books_updated'));
    } catch (err) {
      console.warn('Gagal sync rating buku:', err);
    }
  },
};
