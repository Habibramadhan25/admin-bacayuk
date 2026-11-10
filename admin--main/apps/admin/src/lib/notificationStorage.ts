import { useState, useEffect, useCallback } from 'react';
import { realtime, RealtimeMessage } from './realtime';

export interface AdminNotification {
  id: string;
  type: 'BOOK_CREATED' | 'BOOK_UPDATED' | 'REVIEW_CREATED' | 'CIRCULATION' | 'USER_JOINED' | 'SYSTEM';
  title: string;
  message: string;
  time: string; // ISO string
  read: boolean;
  targetUrl?: string;
  targetId?: string;
  meta?: {
    bookTitle?: string;
    bookCover?: string;
    bookAuthor?: string;
    bookCategory?: string;
    userName?: string;
    school?: string;
    email?: string;
    rating?: number;
    action?: string;
  };
}

const STORAGE_KEY = 'bacayuk_admin_notifications';

const INITIAL_SEEDS: AdminNotification[] = [
  {
    id: 'notif_seed_1',
    type: 'USER_JOINED',
    title: 'Pengguna Baru Terdaftar',
    message: 'Siswa Budi Santoso baru saja mendaftar akun BacaYuk.',
    time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
    targetUrl: '/users',
    meta: { userName: 'Budi Santoso' },
  },
  {
    id: 'notif_seed_2',
    type: 'REVIEW_CREATED',
    title: 'Ulasan Baru Diterima',
    message: 'Siti Aminah memberikan penilaian 5 bintang pada buku "Laskar Pelangi".',
    time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    read: false,
    targetUrl: '/ratings',
    meta: { userName: 'Siti Aminah', bookTitle: 'Laskar Pelangi', rating: 5 },
  },
  {
    id: 'notif_seed_3',
    type: 'CIRCULATION',
    title: 'Sirkulasi Peminjaman',
    message: 'Peminjaman buku "Bumi Manusia" telah tercatat dalam sistem sirkulasi.',
    time: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    read: true,
    targetUrl: '/circulation',
    meta: { bookTitle: 'Bumi Manusia' },
  },
];

export const AdminNotificationStorage = {
  getNotifications(): AdminNotification[] {
    if (typeof localStorage === 'undefined') return INITIAL_SEEDS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEEDS));
      return INITIAL_SEEDS;
    } catch {
      return INITIAL_SEEDS;
    }
  },

  saveNotifications(list: AdminNotification[]) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
      window.dispatchEvent(new Event('bacayuk_admin_notif_changed'));
    } catch (e) {
      console.warn('Gagal menyimpan notifikasi admin:', e);
    }
  },

  addNotification(
    data: Omit<AdminNotification, 'id' | 'time' | 'read'> & {
      id?: string;
      time?: string;
      read?: boolean;
    }
  ): AdminNotification {
    const list = this.getNotifications();
    const created: AdminNotification = {
      ...data,
      id: data.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      time: data.time || new Date().toISOString(),
      read: data.read ?? false,
    };

    // Cegah duplikasi ID
    const updated = [created, ...list.filter((item) => item.id !== created.id)].slice(0, 50);
    this.saveNotifications(updated);
    return created;
  },

  markAsRead(id: string) {
    const list = this.getNotifications();
    const updated = list.map((item) => (item.id === id ? { ...item, read: true } : item));
    this.saveNotifications(updated);
  },

  markAllAsRead() {
    const list = this.getNotifications();
    const updated = list.map((item) => ({ ...item, read: true }));
    this.saveNotifications(updated);
  },

  deleteNotification(id: string) {
    const list = this.getNotifications();
    const updated = list.filter((item) => item.id !== id);
    this.saveNotifications(updated);
  },

  clearAll() {
    this.saveNotifications([]);
  },

  getUnreadCount(): number {
    return this.getNotifications().filter((n) => !n.read).length;
  },
};

/**
 * Hook untuk memantau notifikasi real-time di UI Admin
 */
export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>(() =>
    AdminNotificationStorage.getNotifications()
  );

  const refresh = useCallback(() => {
    setNotifications(AdminNotificationStorage.getNotifications());
  }, []);

  useEffect(() => {
    // 1. Dengarkan event local DOM & storage
    window.addEventListener('storage', refresh);
    window.addEventListener('bacayuk_admin_notif_changed', refresh);

    // 2. Dengarkan event real-time dari SSE / BroadcastChannel
    const unsubscribe = realtime.subscribe((msg: RealtimeMessage) => {
      if (msg.type === 'REVIEW_CREATED' || msg.type === 'REVIEWS_UPDATED') {
        const review = msg.data?.review;
        if (review) {
          AdminNotificationStorage.addNotification({
            type: 'REVIEW_CREATED',
            title: 'Ulasan Pembaca Baru!',
            message: `${review.userName || 'Siswa'} baru saja memberi penilaian ${review.rating}★: "${review.comment ? review.comment.slice(0, 60) + '...' : 'Ulasan baru'}"`,
            targetUrl: '/ratings',
            meta: {
              userName: review.userName,
              rating: review.rating,
              bookTitle: review.bookTitle,
            },
          });
        }
      } else if (msg.type === 'BOOK_CREATED' && msg.sender !== 'admin_portal') {
        // Jika ada penambahan dari channel lain
        AdminNotificationStorage.addNotification({
          type: 'BOOK_CREATED',
          title: 'Koleksi Buku Ditambahkan',
          message: `Buku baru "${msg.data?.title || 'Buku'}" telah ditambahkan ke sistem.`,
          targetUrl: '/books',
          meta: {
            bookTitle: msg.data?.title,
          },
        });
      } else if (msg.type === 'USER_REGISTERED' || msg.type === 'USER_JOINED') {
        const user = msg.data?.user;
        const studentName = user?.name || user?.fullName || user?.username || msg.data?.userName || 'Siswa Baru';
        AdminNotificationStorage.addNotification({
          type: 'USER_JOINED',
          title: 'Pengguna Baru Terdaftar',
          message: `Siswa ${studentName} baru saja mendaftar akun BacaYuk.`,
          targetUrl: '/users',
          meta: {
            userName: studentName,
            school: user?.school || msg.data?.school,
            email: user?.email || msg.data?.email,
          },
        });
      }
    });

    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('bacayuk_admin_notif_changed', refresh);
      unsubscribe();
    };
  }, [refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead: AdminNotificationStorage.markAsRead.bind(AdminNotificationStorage),
    markAllAsRead: AdminNotificationStorage.markAllAsRead.bind(AdminNotificationStorage),
    deleteNotification: AdminNotificationStorage.deleteNotification.bind(AdminNotificationStorage),
    clearAll: AdminNotificationStorage.clearAll.bind(AdminNotificationStorage),
    addNotification: AdminNotificationStorage.addNotification.bind(AdminNotificationStorage),
    refresh,
  };
}
