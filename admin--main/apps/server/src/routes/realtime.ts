import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// In-memory list of connected SSE clients
type SseClient = {
  id: string;
  res: Response;
  connectedAt: Date;
};

let clients: SseClient[] = [];

// Path to fallback local storage sync file (persists state across server restarts)
const DATA_DIR = path.join(__dirname, '../../data');
const SYNC_FILE = path.join(DATA_DIR, 'runtime-sync.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

interface ServerSyncState {
  books?: any[];
  reviews?: any[];
  categories?: any[];
  notifications?: any[];
  loans?: any[];
  history?: any[];
  lastUpdated: string;
}

let syncState: ServerSyncState = {
  books: [],
  reviews: [],
  categories: [],
  notifications: [],
  loans: [],
  history: [],
  lastUpdated: new Date().toISOString(),
};

// Load saved state if exists
if (fs.existsSync(SYNC_FILE)) {
  try {
    const raw = fs.readFileSync(SYNC_FILE, 'utf-8');
    syncState = JSON.parse(raw);
  } catch (err) {
    console.warn('⚠️ Gagal membaca runtime-sync.json:', err);
  }
}

function saveSyncState() {
  try {
    fs.writeFileSync(SYNC_FILE, JSON.stringify(syncState, null, 2), 'utf-8');
  } catch (err) {
    console.warn('⚠️ Gagal menulis runtime-sync.json:', err);
  }
}

/**
 * Broadcast event ke seluruh client SSE yang aktif
 */
export function broadcastRealtimeEvent(event: {
  type: string;
  data?: any;
  sender?: string;
  timestamp?: string;
}) {
  const payload = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  const message = `event: message\ndata: ${JSON.stringify(payload)}\n\n`;

  clients.forEach((client) => {
    try {
      client.res.write(message);
    } catch {
      // client disconnected
    }
  });
}

/**
 * GET /api/realtime/stream
 * Server-Sent Events (SSE) connection endpoint
 */
router.get('/stream', (req: Request, res: Response) => {
  // Set headers untuk SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no',
  });

  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newClient: SseClient = {
    id: clientId,
    res,
    connectedAt: new Date(),
  };

  clients.push(newClient);

  // Kirim initial connection handshake
  res.write(
    `event: connected\ndata: ${JSON.stringify({
      status: 'connected',
      clientId,
      activeClients: clients.length,
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  // Heartbeat ping setiap 20 detik agar koneksi tetap hidup
  const pingInterval = setInterval(() => {
    try {
      res.write(`event: ping\ndata: ${JSON.stringify({ t: Date.now() })}\n\n`);
    } catch {
      clearInterval(pingInterval);
    }
  }, 20000);

  // Bersihkan client saat koneksi terputus
  req.on('close', () => {
    clearInterval(pingInterval);
    clients = clients.filter((c) => c.id !== clientId);
  });
});

/**
 * POST /api/realtime/publish
 * Menerima event dari client (Admin atau Siswa) dan membroadcast ke semua client lain
 */
router.post('/publish', (req: Request, res: Response) => {
  const { type, data, sender } = req.body;

  if (!type) {
    return res.status(400).json({ success: false, message: 'Field "type" wajib diisi' });
  }

  // Jika event menyertakan update buku atau ulasan, simpan juga ke syncState server
  if ((type === 'BOOKS_UPDATED' || type === 'BOOK_CREATED') && Array.isArray(data?.books)) {
    syncState.books = data.books;
    syncState.lastUpdated = new Date().toISOString();
    saveSyncState();
  } else if (type === 'REVIEWS_UPDATED' && Array.isArray(data?.reviews)) {
    syncState.reviews = data.reviews;
    syncState.lastUpdated = new Date().toISOString();
    saveSyncState();
  }

  // Jika payload membawa objek notifikasi atau event pembuatan buku/ulasan
  if (data?.notification) {
    if (!Array.isArray(syncState.notifications)) {
      syncState.notifications = [];
    }
    // Simpan notifikasi terbaru di depan, batasi maks 50
    syncState.notifications = [data.notification, ...syncState.notifications].slice(0, 50);
    saveSyncState();
  } else if (type === 'BOOK_CREATED' || type === 'BOOKS_UPDATED') {
    if (data?.title) {
      if (!Array.isArray(syncState.notifications)) {
        syncState.notifications = [];
      }
      const autoNotif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: type === 'BOOK_CREATED' ? 'BOOK_CREATED' : 'BOOK_UPDATED',
        title: type === 'BOOK_CREATED' ? 'Buku Baru Ditambahkan!' : 'Koleksi Buku Diperbarui',
        message: type === 'BOOK_CREATED'
          ? `Admin baru saja menambahkan buku "${data.title}" ke katalog.`
          : `Informasi buku "${data.title}" telah diperbarui.`,
        time: new Date().toISOString(),
        read: false,
        targetId: data.bookId,
        targetType: 'book',
        meta: {
          bookTitle: data.title,
          bookCover: data.coverUrl,
          bookAuthor: data.author,
          bookCategory: data.category,
        },
      };
      syncState.notifications = [autoNotif, ...syncState.notifications].slice(0, 50);
      saveSyncState();
    }
  } else if (type === 'USER_REGISTERED' || type === 'USER_JOINED') {
    const user = data?.user;
    if (user || data?.userName) {
      if (!Array.isArray(syncState.notifications)) {
        syncState.notifications = [];
      }
      const studentName = user?.name || user?.fullName || user?.username || data?.userName || 'Siswa Baru';
      const userNotif = {
        id: `notif_reg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'USER_JOINED',
        title: 'Pengguna Baru Terdaftar',
        message: `Siswa ${studentName} baru saja mendaftar akun BacaYuk.`,
        time: new Date().toISOString(),
        read: false,
        targetUrl: '/users',
        targetId: user?.id,
        meta: {
          userName: studentName,
          school: user?.school || data?.school,
          email: user?.email || data?.email,
        },
      };
      syncState.notifications = [userNotif, ...syncState.notifications].slice(0, 50);
      saveSyncState();
    }
  } else if (type === 'LOAN_CREATED' || type === 'LOAN_UPDATED') {
    if (data?.loan) {
      if (!Array.isArray(syncState.loans)) {
        syncState.loans = [];
      }
      syncState.loans = [data.loan, ...syncState.loans.filter((l: any) => l.id !== data.loan.id)];
      
      if (!Array.isArray(syncState.notifications)) {
        syncState.notifications = [];
      }
      const loanNotif = {
        id: `notif_loan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'LOAN_ALERT',
        title: 'Peminjaman Buku Baru',
        message: `${data.loan.userName || 'Siswa'} meminjam "${data.loan.bookTitle}" (Jatuh tempo: ${data.loan.dueDate}).`,
        time: new Date().toISOString(),
        read: false,
        targetUrl: '/circulation',
        targetId: data.loan.id,
        meta: {
          userName: data.loan.userName,
          userEmail: data.loan.userEmail,
          bookTitle: data.loan.bookTitle,
          borrowDate: data.loan.borrowDate,
          dueDate: data.loan.dueDate,
        },
      };
      syncState.notifications = [loanNotif, ...syncState.notifications].slice(0, 50);
      saveSyncState();
    }
  } else if (type === 'READING_HISTORY_UPDATED' || type === 'READING_ACTIVITY') {
    if (data?.historyItem) {
      if (!Array.isArray(syncState.history)) {
        syncState.history = [];
      }
      syncState.history = [
        data.historyItem,
        ...syncState.history.filter((h: any) => h.id !== data.historyItem.id && !(h.userId === data.historyItem.userId && h.bookId === data.historyItem.bookId))
      ].slice(0, 100);
      saveSyncState();
    }
  }

  broadcastRealtimeEvent({ type, data, sender });

  return res.json({
    success: true,
    broadcastedTo: clients.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/realtime/notifications
 * Mengambil daftar notifikasi tersinkronisasi
 */
router.get('/notifications', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    notifications: syncState.notifications || [],
    total: syncState.notifications?.length || 0,
  });
});

/**
 * POST /api/realtime/notifications
 * Menyimpan notifikasi baru ke server
 */
router.post('/notifications', (req: Request, res: Response) => {
  const { notification } = req.body;
  if (!notification || !notification.id) {
    return res.status(400).json({ success: false, message: 'Objek notifikasi tidak valid' });
  }

  if (!Array.isArray(syncState.notifications)) {
    syncState.notifications = [];
  }
  syncState.notifications = [notification, ...syncState.notifications.filter((n: any) => n.id !== notification.id)].slice(0, 50);
  saveSyncState();

  broadcastRealtimeEvent({
    type: 'NOTIFICATION_BROADCAST',
    data: { notification },
    sender: 'system',
  });

  return res.json({
    success: true,
    notification,
  });
});

/**
 * GET /api/realtime/state
 * Mengambil state data buku & ulasan yang tersinkronisasi di server
 */
router.get('/state', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: syncState,
    activeClients: clients.length,
  });
});

/**
 * POST /api/realtime/state
 * Menyinkronkan seluruh state buku / ulasan ke server
 */
router.post('/state', (req: Request, res: Response) => {
  const { books, reviews, categories, loans, history } = req.body;

  if (Array.isArray(books) && books.length > 0) {
    syncState.books = books;
  }
  if (Array.isArray(reviews) && reviews.length > 0) {
    syncState.reviews = reviews;
  }
  if (Array.isArray(categories) && categories.length > 0) {
    syncState.categories = categories;
  }
  if (Array.isArray(loans) && loans.length > 0) {
    syncState.loans = loans;
  }
  if (Array.isArray(history) && history.length > 0) {
    syncState.history = history;
  }
  syncState.lastUpdated = new Date().toISOString();
  saveSyncState();

  // Beritahu seluruh client bahwa state telah disinkronkan
  broadcastRealtimeEvent({
    type: 'STATE_SYNCED',
    data: {
      booksCount: syncState.books?.length || 0,
      reviewsCount: syncState.reviews?.length || 0,
      loansCount: syncState.loans?.length || 0,
      historyCount: syncState.history?.length || 0,
    },
  });

  return res.json({
    success: true,
    data: syncState,
  });
});

/**
 * GET /api/realtime/status
 * Menampilkan status koneksi real-time
 */
router.get('/status', (_req: Request, res: Response) => {
  return res.json({
    status: 'online',
    engine: 'SSE + BroadcastChannel',
    activeClients: clients.length,
    timestamp: new Date().toISOString(),
  });
});

export default router;
