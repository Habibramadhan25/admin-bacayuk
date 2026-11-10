import { Router, Request, Response } from 'express';
import { query } from '../db/connection';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { broadcastRealtimeEvent } from './realtime';

const router = Router();

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users-sync.json');

interface StoredUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  password_hash: string;
  password?: string;
  school: string;
  avatar_url: string;
  reading_goal_books: number;
  booksRead: number;
}

const DEFAULT_USERS: StoredUser[] = [
  {
    id: 'u1',
    username: 'andi_juara',
    full_name: 'Andi Pratama',
    email: 'andi@sekolah.id',
    password_hash: hashPassword('password123'),
    password: 'password123',
    school: 'SMP Juara Bangsa',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    reading_goal_books: 25,
    booksRead: 18,
  },
  {
    id: 'u_rafli',
    username: 'rafli',
    full_name: 'Rafli',
    email: 'rafli@example.com',
    password_hash: hashPassword('password123'),
    password: 'password123',
    school: 'SMP Juara Bangsa',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    reading_goal_books: 20,
    booksRead: 8,
  },
];

function getStoredUsers(): StoredUser[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) return list;
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), 'utf-8');
    return DEFAULT_USERS;
  } catch (err) {
    console.warn('Gagal membaca users-sync.json:', err);
    return DEFAULT_USERS;
  }
}

function saveStoredUsers(list: StoredUser[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Gagal menyimpan users-sync.json:', err);
  }
}

/**
 * Hash password dengan SHA-256 dan salt sederhana
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_bacayuk_salt_2026').digest('hex');
}

/**
 * POST /api/auth/register
 * Mendaftarkan akun siswa baru (mendukung MySQL dengan auto-fallback JSON storage)
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, fullName, email, password, school } = req.body;

    if (!username || !fullName || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, Nama Lengkap, dan Password wajib diisi.',
      });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanFullName = String(fullName).trim();
    const cleanEmail = email ? String(email).trim().toLowerCase() : `${cleanUsername}@sekolah.id`;
    const cleanSchool = school ? String(school).trim() : 'SMP Juara Bangsa';
    const pwdHash = hashPassword(password);
    const newId = 'u_' + Date.now();
    const defaultAvatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80`;

    let registeredViaDb = false;

    // 1. Coba simpan ke database MySQL jika server MySQL aktif
    try {
      const existing = await query<any[]>(
        'SELECT id FROM profiles WHERE username = ? OR email = ? LIMIT 1',
        [cleanUsername, cleanEmail]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Username atau Email sudah terdaftar. Silakan gunakan yang lain.',
        });
      }

      await query(
        `INSERT INTO profiles (id, username, full_name, email, password_hash, school, avatar_url, reading_goal_books, subscription_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, cleanUsername, cleanFullName, cleanEmail, pwdHash, cleanSchool, defaultAvatar, 20, 'free']
      );
      registeredViaDb = true;
    } catch {
      // MySQL offline / database belum diinisialisasi -> Gunakan penyimpanan failover JSON
    }

    // 2. Selalu simpan ke users-sync.json agar login selalu berhasil meski tanpa MySQL
    const localUsers = getStoredUsers();
    const duplicate = localUsers.some(
      (u) =>
        u.username.toLowerCase() === cleanUsername ||
        (u.email && u.email.toLowerCase() === cleanEmail)
    );

    if (duplicate && !registeredViaDb) {
      return res.status(409).json({
        success: false,
        message: 'Username atau Email sudah terdaftar. Silakan gunakan yang lain.',
      });
    }

    if (!duplicate) {
      localUsers.push({
        id: newId,
        username: cleanUsername,
        full_name: cleanFullName,
        email: cleanEmail,
        password_hash: pwdHash,
        password: String(password),
        school: cleanSchool,
        avatar_url: defaultAvatar,
        reading_goal_books: 20,
        booksRead: 0,
      });
      saveStoredUsers(localUsers);
    }

    const userProfile = {
      id: newId,
      username: cleanUsername,
      name: cleanFullName,
      email: cleanEmail,
      school: cleanSchool,
      avatarUrl: defaultAvatar,
      booksRead: 0,
      readingHours: 0,
      readingGoalBooks: 20,
    };

    // Broadcast notifikasi pendaftaran siswa baru ke portal admin secara real-time
    try {
      broadcastRealtimeEvent({
        type: 'USER_REGISTERED',
        data: {
          user: userProfile,
          notification: {
            id: `notif_reg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: 'USER_JOINED',
            title: 'Pengguna Baru Terdaftar',
            message: `Siswa ${cleanFullName} baru saja mendaftar akun BacaYuk.`,
            time: new Date().toISOString(),
            read: false,
            targetUrl: '/users',
            meta: { userName: cleanFullName, school: cleanSchool, email: cleanEmail },
          },
        },
        sender: 'student_auth',
      });
    } catch (e) {
      console.warn('Gagal broadcast USER_REGISTERED event:', e);
    }

    return res.status(201).json({
      success: true,
      message: 'Pendaftaran akun berhasil!',
      data: userProfile,
    });
  } catch (err: any) {
    console.error('Error during register:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat pendaftaran.',
      error: err.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Masuk dengan username/email dan password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email dan Password wajib diisi.',
      });
    }

    const cleanIdentifier = String(username).trim().toLowerCase();
    const cleanPassword = String(password).trim();
    const pwdHash = hashPassword(cleanPassword);

    // 1. Coba cari di MySQL lebih dulu jika MySQL aktif
    try {
      const users = await query<any[]>(
        `SELECT id, username, full_name, email, password_hash, school, avatar_url, reading_goal_books
         FROM profiles 
         WHERE LOWER(username) = ? OR LOWER(email) = ?
         LIMIT 1`,
        [cleanIdentifier, cleanIdentifier]
      );

      if (users.length > 0) {
        const user = users[0];
        if (!user.password_hash || user.password_hash === pwdHash) {
          const userProfile = {
            id: user.id,
            username: user.username,
            name: user.full_name,
            email: user.email || `${user.username}@sekolah.id`,
            school: user.school || 'SMP Juara Bangsa',
            avatarUrl: user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
            booksRead: 0,
            readingHours: 0,
            readingGoalBooks: user.reading_goal_books || 20,
          };

          return res.json({
            success: true,
            message: 'Login berhasil!',
            data: userProfile,
          });
        }
      }
    } catch {
      // MySQL offline -> Lanjut ke pencarian penyimpanan failover JSON
    }

    // 2. Cari di users-sync.json (failover storage)
    const localUsers = getStoredUsers();
    const found = localUsers.find(
      (u) =>
        (u.username.toLowerCase() === cleanIdentifier ||
          (u.email && u.email.toLowerCase() === cleanIdentifier)) &&
        (u.password_hash === pwdHash || u.password === cleanPassword || u.password === password)
    );

    if (found) {
      const userProfile = {
        id: found.id,
        username: found.username,
        name: found.full_name,
        email: found.email || `${found.username}@sekolah.id`,
        school: found.school || 'SMP Juara Bangsa',
        avatarUrl: found.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        booksRead: found.booksRead || 0,
        readingHours: 0,
        readingGoalBooks: found.reading_goal_books || 20,
      };

      return res.json({
        success: true,
        message: 'Login berhasil!',
        data: userProfile,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Username/Email atau Password salah. Silakan periksa kembali data Anda.',
    });
  } catch (err: any) {
    console.error('Error during login:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat login.',
      error: err.message,
    });
  }
});

export default router;
