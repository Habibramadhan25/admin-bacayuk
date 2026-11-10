import { useState, useEffect, useCallback } from 'react';
import { mobileRealtime, RealtimeMessage } from './realtime';

export interface StudentNotification {
  id: string;
  type: 'BOOK_CREATED' | 'BOOK_UPDATED' | 'SYSTEM' | 'CURATION';
  title: string;
  message: string;
  time: string; // ISO string
  read: boolean;
  targetId?: string;
  meta?: {
    bookTitle?: string;
    bookCover?: string;
    bookAuthor?: string;
    bookCategory?: string;
  };
}

const STORAGE_KEY = 'bacayuk_student_notifications';

const INITIAL_STUDENT_SEEDS: StudentNotification[] = [
  {
    id: 's_notif_1',
    type: 'BOOK_CREATED',
    title: 'Buku Rekomendasi Baru!',
    message: 'Admin menambahkan buku "Bumi Manusia" karya Pramoedya Ananta Toer ke koleksi sastra.',
    time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false,
    targetId: 'book_1',
    meta: {
      bookTitle: 'Bumi Manusia',
      bookAuthor: 'Pramoedya Ananta Toer',
      bookCategory: 'Fiksi Sastra',
      bookCover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    },
  },
  {
    id: 's_notif_2',
    type: 'SYSTEM',
    title: 'Selamat Datang di BacaYuk!',
    message: 'Jelajahi ribuan buku digital berkualitas dan baca naskah langsung dari browser.',
    time: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    read: true,
  },
];

export const StudentNotificationStorage = {
  getNotifications(): StudentNotification[] {
    if (typeof localStorage === 'undefined') return INITIAL_STUDENT_SEEDS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STUDENT_SEEDS));
      return INITIAL_STUDENT_SEEDS;
    } catch {
      return INITIAL_STUDENT_SEEDS;
    }
  },

  saveNotifications(list: StudentNotification[]) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
      window.dispatchEvent(new Event('bacayuk_student_notif_changed'));
    } catch (e) {
      console.warn('Gagal menyimpan notifikasi siswa:', e);
    }
  },

  addNotification(
    data: Omit<StudentNotification, 'id' | 'time' | 'read'> & {
      id?: string;
      time?: string;
      read?: boolean;
    }
  ): StudentNotification {
    const list = this.getNotifications();
    const created: StudentNotification = {
      ...data,
      id: data.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      time: data.time || new Date().toISOString(),
      read: data.read ?? false,
    };

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
 * Format relative time dalam bahasa Indonesia
 */
export function formatStudentRelativeTime(isoString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  } catch {
    return 'Baru saja';
  }
}

/**
 * Hook utama notifikasi real-time untuk siswa
 */
export function useStudentNotifications() {
  const [notifications, setNotifications] = useState<StudentNotification[]>(() =>
    StudentNotificationStorage.getNotifications()
  );
  const [bannerAlert, setBannerAlert] = useState<StudentNotification | null>(null);

  const refresh = useCallback(() => {
    setNotifications(StudentNotificationStorage.getNotifications());
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', refresh);
      window.addEventListener('bacayuk_student_notif_changed', refresh);
    }

    // Ambil data notifikasi tersinkronisasi dari server saat terhubung
    if (typeof fetch !== 'undefined') {
      fetch('/api/realtime/notifications')
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && Array.isArray(data.notifications) && data.notifications.length > 0) {
            const current = StudentNotificationStorage.getNotifications();
            const existingIds = new Set(current.map((n) => n.id));
            let hasNew = false;
            data.notifications.forEach((srvNotif: any) => {
              if (!existingIds.has(srvNotif.id)) {
                current.unshift(srvNotif);
                existingIds.add(srvNotif.id);
                hasNew = true;
              }
            });
            if (hasNew) {
              StudentNotificationStorage.saveNotifications(current);
              refresh();
            }
          }
        })
        .catch(() => {});
    }

    // Dengarkan event real-time dari SSE & BroadcastChannel
    const unsubscribe = mobileRealtime.subscribe((msg: RealtimeMessage) => {
      // 1. Notifikasi spesifik dari server atau admin
      if (msg.type === 'NOTIFICATION_BROADCAST' && msg.data?.notification) {
        const notif = StudentNotificationStorage.addNotification(msg.data.notification);
        setBannerAlert(notif);
        return;
      }

      // 2. Event pembuatan / pembaruan buku oleh Admin
      if (msg.type === 'BOOK_CREATED' || msg.type === 'BOOKS_UPDATED') {
        const notifPayload = msg.data?.notification;
        if (notifPayload) {
          const created = StudentNotificationStorage.addNotification(notifPayload);
          setBannerAlert(created);
        } else if (msg.data?.title) {
          const isEdit = msg.data.action === 'updated';
          const created = StudentNotificationStorage.addNotification({
            type: isEdit ? 'BOOK_UPDATED' : 'BOOK_CREATED',
            title: isEdit ? 'Koleksi Diperbarui' : 'Buku Baru Ditambahkan!',
            message: isEdit
              ? `Admin memperbarui buku "${msg.data.title}". Cek edisi terbarunya sekarang!`
              : `Admin baru saja menambahkan buku "${msg.data.title}" oleh ${msg.data.author || 'Penulis'}. Siap dibaca!`,
            targetId: msg.data.bookId,
            meta: {
              bookTitle: msg.data.title,
              bookCover: msg.data.coverUrl,
              bookAuthor: msg.data.author,
              bookCategory: msg.data.category,
            },
          });
          setBannerAlert(created);
        }
      }
    });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', refresh);
        window.removeEventListener('bacayuk_student_notif_changed', refresh);
      }
      unsubscribe();
    };
  }, [refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    bannerAlert,
    dismissBanner: () => setBannerAlert(null),
    markAsRead: StudentNotificationStorage.markAsRead.bind(StudentNotificationStorage),
    markAllAsRead: StudentNotificationStorage.markAllAsRead.bind(StudentNotificationStorage),
    deleteNotification: StudentNotificationStorage.deleteNotification.bind(StudentNotificationStorage),
    clearAll: StudentNotificationStorage.clearAll.bind(StudentNotificationStorage),
    addNotification: StudentNotificationStorage.addNotification.bind(StudentNotificationStorage),
    refresh,
  };
}

