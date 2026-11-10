import { MOCK_CATEGORIES, MOCK_USER, BookItem } from '../data/mockData';
import { BookStorage } from './bookStorage';
import { MobileReviewStorage } from './reviewStorage';
import { mobileRealtime } from './realtime';

// Konfigurasi URL API Backend MySQL
// Gunakan IP lokal jika ditest di perangkat fisik Android/iOS (misal: http://192.168.1.x:5000)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Helper fetch dengan timeout dan error handling aman
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch {
    // Fallback diam jika server MySQL offline
    return null;
  }
}

export const BooksApi = {
  /**
   * Mengambil daftar buku dari MySQL (dengan fallback ke data lokal yang tersinkronisasi)
   */
  async getBooks(category?: string, query?: string): Promise<BookItem[]> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (query) params.append('q', query);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const remoteData = await apiFetch<BookItem[]>(`/books${queryStr}`);

    if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
      return remoteData;
    }

    // Local / Storage fallback (tersinkronisasi dengan admin)
    const allBooks = BookStorage.getBooks();
    return allBooks.filter((b) => {
      const matchCat = !category || category === 'all' || b.category.toLowerCase() === category.toLowerCase();
      const matchQ = !query || b.title.toLowerCase().includes(query.toLowerCase()) || b.author.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  },

  /**
   * Mengambil detail buku beserta chapter
   */
  async getBookById(id: string): Promise<BookItem | null> {
    const remoteBook = await apiFetch<BookItem>(`/books/${id}`);
    if (remoteBook) return remoteBook;

    return BookStorage.getBookById(id);
  },

  /**
   * Mengambil bab/chapter buku
   */
  async getBookChapters(bookId: string) {
    const remoteChapters = await apiFetch<any[]>(`/books/${bookId}/chapters`);
    return remoteChapters || [];
  },

  /**
   * Mengambil kategori dari MySQL
   */
  async getCategories() {
    const remoteCategories = await apiFetch<any[]>('/categories');
    if (remoteCategories && Array.isArray(remoteCategories) && remoteCategories.length > 0) {
      return remoteCategories;
    }
    return MOCK_CATEGORIES;
  },

  /**
   * Mengambil daftar buku favorit pengguna
   */
  async getFavorites(): Promise<string[]> {
    const remoteFavs = await apiFetch<string[]>('/favorites');
    if (remoteFavs && Array.isArray(remoteFavs)) {
      return remoteFavs;
    }
    return ['b1', 'b2', 'b3', 'b7', 'b9'];
  },

  /**
   * Toggle status favorit pada database MySQL
   */
  async toggleFavorite(bookId: string): Promise<boolean | null> {
    const res = await apiFetch<{ isFavorite: boolean }>('/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ bookId }),
    });
    return res ? res.isFavorite : null;
  },

  /**
   * Simpan riwayat & progres bacaan ke MySQL
   */
  async saveReadingProgress(bookId: string, currentChapter: number, progressPercentage: number) {
    return await apiFetch('/progress/update', {
      method: 'POST',
      body: JSON.stringify({
        bookId,
        currentChapter,
        progressPercentage,
      }),
    });
  },

  /**
   * Profil pengguna
   */
  async getProfile() {
    const profile = await apiFetch('/profile');
    return profile || MOCK_USER;
  }
};

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email?: string;
  school?: string;
  avatarUrl?: string;
  booksRead?: number;
  readingHours?: number;
  readingGoalBooks?: number;
}

// Penyimpanan persisten untuk akun siswa offline agar tidak hilang saat reload
const STORAGE_ACCOUNTS_KEY = 'bacayuk_student_accounts';

let currentSessionUser: UserProfile | null = null;

const SEED_STUDENT_ACCOUNTS: Array<{ user: UserProfile; password: string }> = [
  {
    user: {
      id: 'u1',
      username: 'andi_juara',
      name: 'Andi Pratama',
      email: 'andi@sekolah.id',
      school: 'Kelas 7 • SMP Juara Bangsa',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      booksRead: 18,
      readingHours: 42,
      readingGoalBooks: 25,
    },
    password: 'password123',
  },
  {
    user: {
      id: 'u_rafli',
      username: 'rafli',
      name: 'Rafli',
      email: 'rafli@example.com',
      school: 'SMP Juara Bangsa',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      booksRead: 8,
      readingHours: 24,
      readingGoalBooks: 12,
    },
    password: 'password123',
  },
];

function getStoredStudentAccounts(): Array<{ user: UserProfile; password: string }> {
  if (typeof localStorage === 'undefined') return SEED_STUDENT_ACCOUNTS;
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(SEED_STUDENT_ACCOUNTS));
    return SEED_STUDENT_ACCOUNTS;
  } catch {
    return SEED_STUDENT_ACCOUNTS;
  }
}

function saveStoredStudentAccounts(list: Array<{ user: UserProfile; password: string }>) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(list));
  } catch {}
}

function notifyAdminStudentRegistered(user: UserProfile) {
  // 1. BroadcastChannel (antar tab di browser yang sama / proxy 8081)
  try {
    mobileRealtime.publish('USER_REGISTERED', {
      user,
      userName: user.name,
      school: user.school,
      email: user.email,
    });
  } catch {}

  // 2. Broadcast via API Realtime Server (untuk semua admin yang online lewat SSE)
  try {
    fetch('/api/realtime/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'USER_REGISTERED',
        data: {
          user,
          notification: {
            id: `notif_reg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: 'USER_JOINED',
            title: 'Pengguna Baru Terdaftar',
            message: `Siswa ${user.name} baru saja mendaftar akun BacaYuk.`,
            time: new Date().toISOString(),
            read: false,
            targetUrl: '/users',
            meta: { userName: user.name, school: user.school, email: user.email },
          },
        },
        sender: 'student_app',
      }),
    }).catch(() => {});
  } catch {}
}

export const AuthApi = {
  /**
   * Mendaftarkan akun siswa baru
   */
  async register(data: {
    username: string;
    fullName: string;
    email?: string;
    password: string;
    school?: string;
  }): Promise<{ success: boolean; user?: UserProfile; message: string }> {
    let remoteUser: UserProfile | null = null;
    const cleanUsername = data.username.trim().toLowerCase();
    const cleanFullName = data.fullName.trim();
    const cleanEmail = data.email ? data.email.trim().toLowerCase() : `${cleanUsername}@sekolah.id`;
    const cleanPassword = data.password.trim();

    try {
      const res = await apiFetch<UserProfile>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: cleanUsername,
          fullName: cleanFullName,
          email: cleanEmail,
          password: cleanPassword,
          school: data.school,
        }),
      });

      if (res && res.id) {
        remoteUser = res;
      }
    } catch {
      // Fallback ke penyimpanan lokal jika server offline
    }

    const accounts = getStoredStudentAccounts();
    const exists = accounts.some(
      (u) =>
        u.user.username.toLowerCase() === cleanUsername ||
        (cleanEmail && u.user.email?.toLowerCase() === cleanEmail)
    );

    if (exists && !remoteUser) {
      return { success: false, message: 'Username atau Email sudah terdaftar. Silakan pilih yang lain.' };
    }

    const newUser: UserProfile = remoteUser || {
      id: 'u_' + Date.now(),
      username: cleanUsername,
      name: cleanFullName,
      email: cleanEmail,
      school: data.school || 'SMP Juara Bangsa',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      booksRead: 0,
      readingHours: 0,
      readingGoalBooks: 20,
    };

    // Selalu simpan ke localStorage agar tidak hilang saat reload/login kembali
    if (!exists) {
      accounts.push({ user: newUser, password: cleanPassword });
      saveStoredStudentAccounts(accounts);
    }

    currentSessionUser = newUser;
    notifyAdminStudentRegistered(newUser);

    return { success: true, user: newUser, message: 'Pendaftaran berhasil!' };
  },

  /**
   * Masuk / Login dengan username & password
   */
  async login(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; user?: UserProfile; message: string }> {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPw = password.trim();

    try {
      const res = await apiFetch<UserProfile>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: cleanId, password: cleanPw }),
      });

      if (res && res.id) {
        currentSessionUser = res;
        // Simpan juga ke cache lokal agar offline tetap bisa login
        const accounts = getStoredStudentAccounts();
        if (!accounts.some((a) => a.user.id === res.id)) {
          accounts.push({ user: res, password: cleanPw });
          saveStoredStudentAccounts(accounts);
        }
        return { success: true, user: res, message: 'Login berhasil!' };
      }
    } catch {
      // Lanjut ke fallback offline
    }

    // Cek di penyimpanan persisten localStorage
    const accounts = getStoredStudentAccounts();
    const found = accounts.find(
      (u) =>
        (u.user.username.toLowerCase() === cleanId ||
          (u.user.email && u.user.email.toLowerCase() === cleanId)) &&
        (u.password === cleanPw || u.password === password)
    );

    if (found) {
      currentSessionUser = found.user;
      return { success: true, user: found.user, message: 'Login berhasil!' };
    }

    return {
      success: false,
      message: 'Username/Email atau password salah. Coba lagi atau daftarkan akun baru.',
    };
  },

  /**
   * Keluar / Logout
   */
  async logout(): Promise<void> {
    currentSessionUser = null;
  },

  /**
   * Ambil data pengguna saat ini
   */
  getCurrentUser(): UserProfile | null {
    return currentSessionUser;
  },
};

export const ReviewsApi = {
  async getReviews(bookId: string) {
    const remote = await apiFetch<any[]>(`/reviews?bookId=${bookId}`);
    if (remote && Array.isArray(remote) && remote.length > 0) {
      return remote;
    }
    return MobileReviewStorage.getReviews(bookId);
  },

  async addReview(data: {
    bookId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    comment: string;
  }) {
    await apiFetch('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return MobileReviewStorage.addReview(data);
  },
};


