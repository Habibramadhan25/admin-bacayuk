import { BULAN_CHAPTERS } from './bulanChapters';

export interface BookChapter {
  id: string;
  title: string;
  content: string;
  startPage?: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  year: number;
  publisher: string;
  isbn: string;
  status: 'Published' | 'Draft';
  rating: number;
  readers: number;
  dateAdded: string;
  coverUrl: string;
  description: string;
  sourceName?: string;
  sourceUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  fileUrl?: string;
  chapters?: BookChapter[];
}

export interface BookReview {
  id: string;
  bookId: string;
  userId?: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  joinDate: string;
  booksRead: number;
  booksCompleted: number;
  status: 'Active' | 'Inactive';
  avatar: string;
}

export interface Category {
  id: string;
  name: string;
  bookCount: number;
}

export interface HistoryItem {
  id: string;
  bookId: string;
  bookTitle: string;
  author: string;
  coverUrl: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  progress: number;
  currentPage: number;
  totalPages: number;
  lastRead: string;
  status: 'Sedang Dibaca' | 'Selesai' | 'Belum Selesai';
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  status: 'Success' | 'Warning' | 'Error';
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  buttonText: string;
  targetType: 'explore' | 'book' | 'category' | 'url';
  targetValue?: string;
  imageUrl?: string;
  bgColor?: string;
  status: 'Active' | 'Inactive';
  order: number;
}

export interface CuratedShelf {
  id: string;
  title: string;
  description: string;
  badge?: string;
  icon?: string;
  bookIds: string[];
  status: 'Active' | 'Inactive';
  order: number;
}

export interface CirculationLoan {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCover: string;
  userId: string;
  userName: string;
  userEmail: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: 'Dipinjam' | 'Terlambat' | 'Dikembalikan';
  fineAmount?: number;
  notes?: string;
}


export const initialBooks: Book[] = [
  {
    id: 'book_1793889302336',
    title: 'BULAN',
    author: 'Tere Liye',
    category: 'Fiksi',
    year: 2026,
    publisher: 'Gramedia Pustaka Utama',
    isbn: '9786020314112',
    status: 'Published',
    rating: 4.9,
    readers: 1420,
    dateAdded: '2026-11-10T08:00:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=300',
    description: 'Namanya Raib, usianya 15 tahun, kelas sepuluh. Dia sama seperti remaja pada umumnya, kecuali satu hal: dia bisa menghilang. Bersama Seli yang bisa mengeluarkan petir dan Ali sang jenius yang bisa berubah menjadi beruang, petualangan mereka di Klan Bulan dan Klan Matahari dimulai.',
    sourceName: 'Google Drive Naskah Lengkap',
    sourceUrl: 'https://drive.google.com/file/d/1Asc4x3ydaAE6YLNUiwsVbYHMMjYyk2W_/view?usp=sharing',
    fileName: 'Tere Liye - Bulan.pdf',
    fileSize: '401 Halaman',
    fileType: 'PDF',
    fileUrl: 'https://drive.google.com/file/d/1Asc4x3ydaAE6YLNUiwsVbYHMMjYyk2W_/view?usp=sharing',
    chapters: BULAN_CHAPTERS,
  },
  {
    id: 'b1',
    title: 'Bumi Manusia',
    author: 'Pramoedya Ananta Toer',
    category: 'Fiksi',
    year: 1980,
    publisher: 'Hasta Mitra',
    isbn: '9789799731234',
    status: 'Published',
    rating: 4.8,
    readers: 1250,
    dateAdded: '2023-01-15T10:00:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300',
    description: 'Bumi Manusia adalah buku pertama dari Tetralogi Buru karya Pramoedya Ananta Toer.',
    sourceName: 'Perpustakaan Nasional RI',
    sourceUrl: 'https://perpusnas.go.id'
  },
  {
    id: 'b2',
    title: 'Laskar Pelangi',
    author: 'Andrea Hirata',
    category: 'Fiksi',
    year: 2005,
    publisher: 'Bentang Pustaka',
    isbn: '9789793062792',
    status: 'Published',
    rating: 4.9,
    readers: 3400,
    dateAdded: '2026-11-10T09:30:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=300',
    description: 'Buku pertama dari Tetralogi Laskar Pelangi, menceritakan kisah 10 anak Belitung.',
    sourceName: 'Kemendikbud BSKAP',
    sourceUrl: 'https://buku.kemdikbud.go.id'
  },
  {
    id: 'b3',
    title: 'Sapiens: Riwayat Singkat Umat Manusia',
    author: 'Yuval Noah Harari',
    category: 'Sejarah',
    year: 2011,
    publisher: 'KPG',
    isbn: '9786024242784',
    status: 'Published',
    rating: 4.7,
    readers: 890,
    dateAdded: '2023-05-10T09:15:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=300',
    description: 'Eksplorasi sejarah umat manusia dari zaman batu hingga abad ke-21.'
  },
  {
    id: 'b4',
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Nonfiksi',
    year: 2018,
    publisher: 'Gramedia',
    isbn: '9786020633176',
    status: 'Published',
    rating: 4.9,
    readers: 5200,
    dateAdded: '2023-08-05T11:45:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=300',
    description: 'Cara mudah dan terbukti untuk membentuk kebiasaan baik dan menghilangkan kebiasaan buruk.'
  },
  {
    id: 'b5',
    title: 'Filosofi Teras',
    author: 'Henry Manampiring',
    category: 'Nonfiksi',
    year: 2018,
    publisher: 'Penerbit Buku Kompas',
    isbn: '9786024125186',
    status: 'Published',
    rating: 4.8,
    readers: 2100,
    dateAdded: '2023-11-12T16:20:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=300',
    description: 'Pengantar filsafat Stoa (Stoikisme) untuk kehidupan masa kini yang lebih damai.'
  },
  {
    id: 'b6',
    title: 'Cantik Itu Luka',
    author: 'Eka Kurniawan',
    category: 'Fiksi',
    year: 2002,
    publisher: 'Gramedia Pustaka Utama',
    isbn: '9786020312583',
    status: 'Published',
    rating: 4.6,
    readers: 1750,
    dateAdded: '2024-01-20T08:00:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=300',
    description: 'Novel epik pemenang berbagai penghargaan tentang sejarah kolonialisme.'
  },
  {
    id: 'b7',
    title: 'Pulang',
    author: 'Tere Liye',
    category: 'Novel',
    year: 2015,
    publisher: 'Republika',
    isbn: '9786020822129',
    status: 'Published',
    rating: 4.8,
    readers: 4500,
    dateAdded: '2024-02-10T10:00:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300',
    description: 'Kisah tentang perjalanan menemukan arti sejati dari pulang.'
  },
  {
    id: 'b8',
    title: 'Gadis Kretek',
    author: 'Ratih Kumala',
    category: 'Fiksi',
    year: 2012,
    publisher: 'Gramedia',
    isbn: '9789792281415',
    status: 'Published',
    rating: 4.7,
    readers: 3100,
    dateAdded: '2024-02-15T09:00:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1524578964522-6321288b83ac?auto=format&fit=crop&q=80&w=300',
    description: 'Menelusuri jejak industri kretek Nusantara lewat kisah cinta masa lalu.'
  },
  {
    id: 'b9',
    title: 'Hujan',
    author: 'Tere Liye',
    category: 'Novel',
    year: 2016,
    publisher: 'Gramedia',
    isbn: '9786020324784',
    status: 'Published',
    rating: 4.6,
    readers: 5600,
    dateAdded: '2024-03-01T14:00:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=300',
    description: 'Tentang persahabatan, cinta, melupakan, dan hujan.'
  },
  {
    id: 'b10',
    title: 'Dunia Sophie',
    author: 'Jostein Gaarder',
    category: 'Pendidikan',
    year: 1991,
    publisher: 'Mizan',
    isbn: '9789794335550',
    status: 'Published',
    rating: 4.8,
    readers: 2900,
    dateAdded: '2024-03-10T11:30:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&q=80&w=300',
    description: 'Sebuah novel sejarah filsafat yang dibalut dalam cerita misteri.'
  },
  {
    id: 'b11',
    title: 'Tetralogi Buru: Anak Semua Bangsa',
    author: 'Pramoedya Ananta Toer',
    category: 'Sejarah',
    year: 1980,
    publisher: 'Hasta Mitra',
    isbn: '9789799731241',
    status: 'Published',
    rating: 4.9,
    readers: 1800,
    dateAdded: '2024-03-20T08:15:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1474366521946-c3d4b507abf2?auto=format&fit=crop&q=80&w=300',
    description: 'Lanjutan dari Bumi Manusia yang mengeksplorasi perlawanan terhadap kolonialisme.'
  },
  {
    id: 'b12',
    title: 'Ronggeng Dukuh Paruk',
    author: 'Ahmad Tohari',
    category: 'Fiksi',
    year: 1982,
    publisher: 'Gramedia',
    isbn: '9789792277289',
    status: 'Published',
    rating: 4.7,
    readers: 2200,
    dateAdded: '2024-04-05T13:45:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=300',
    description: 'Tragedi kehidupan penari ronggeng di tengah pergolakan sosial-politik.'
  },
  {
    id: 'b13',
    title: 'Negeri 5 Menara',
    author: 'A. Fuadi',
    category: 'Novel',
    year: 2009,
    publisher: 'Gramedia',
    isbn: '9789792248616',
    status: 'Published',
    rating: 4.6,
    readers: 4100,
    dateAdded: '2024-04-12T10:20:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&q=80&w=300',
    description: 'Man jadda wajada. Siapa yang bersungguh-sungguh, pasti berhasil.'
  },
  {
    id: 'b14',
    title: 'Garis Waktu',
    author: 'Fiersa Besari',
    category: 'Fiksi',
    year: 2016,
    publisher: 'Mediakita',
    isbn: '9789797945251',
    status: 'Published',
    rating: 4.5,
    readers: 3800,
    dateAdded: '2024-04-18T16:00:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b62f40c4?auto=format&fit=crop&q=80&w=300',
    description: 'Sebuah perjalanan menghapus luka.'
  },
  {
    id: 'b15',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    category: 'Nonfiksi',
    year: 2020,
    publisher: 'Penerbit Baca',
    isbn: '9786026486586',
    status: 'Published',
    rating: 4.8,
    readers: 6700,
    dateAdded: '2024-05-02T09:30:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=300',
    description: 'Pelajaran abadi mengenai kekayaan, ketamakan, dan kebahagiaan.'
  },
  {
    id: 'b16',
    title: 'Perahu Kertas',
    author: 'Dee Lestari',
    category: 'Novel',
    year: 2009,
    publisher: 'Bentang Pustaka',
    isbn: '9789791227780',
    status: 'Published',
    rating: 4.7,
    readers: 4200,
    dateAdded: '2024-05-15T14:15:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&q=80&w=300',
    description: 'Kisah tentang impian, persahabatan, dan cinta yang tak terduga.'
  },
  {
    id: 'b17',
    title: 'Supernova: Kesatria, Putri, dan Bintang Jatuh',
    author: 'Dee Lestari',
    category: 'Fiksi',
    year: 2001,
    publisher: 'Truedee Books',
    isbn: '9789799625700',
    status: 'Published',
    rating: 4.6,
    readers: 2500,
    dateAdded: '2024-05-20T11:00:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1505682614136-0a12f9f7beea?auto=format&fit=crop&q=80&w=300',
    description: 'Bagian pertama dari seri Supernova yang menggabungkan romansa dan sains.'
  },
  {
    id: 'b18',
    title: 'Laut Bercerita',
    author: 'Leila S. Chudori',
    category: 'Sejarah',
    year: 2017,
    publisher: 'Kepustakaan Populer Gramedia',
    isbn: '9786024246942',
    status: 'Published',
    rating: 4.9,
    readers: 8100,
    dateAdded: '2024-06-05T08:30:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1439405326854-014607f694d7?auto=format&fit=crop&q=80&w=300',
    description: 'Menyuarakan mereka yang hilang dalam sejarah kelam Indonesia.'
  },
  {
    id: 'b19',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    category: 'Pendidikan',
    year: 2011,
    publisher: 'Gramedia',
    isbn: '9786020637174',
    status: 'Published',
    rating: 4.7,
    readers: 3400,
    dateAdded: '2024-06-12T15:45:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=300',
    description: 'Mengupas dua sistem berpikir yang mengendalikan cara kita mengambil keputusan.'
  },
  {
    id: 'b20',
    title: 'Bumi',
    author: 'Tere Liye',
    category: 'Cerita Anak',
    year: 2014,
    publisher: 'Gramedia',
    isbn: '9786020301129',
    status: 'Published',
    rating: 4.8,
    readers: 5900,
    dateAdded: '2024-06-25T10:10:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=300',
    description: 'Petualangan Raib di dunia paralel yang menyimpan banyak misteri.'
  },
  {
    id: 'b21',
    title: 'Si Anak Singkong',
    author: 'Chairul Tanjung',
    category: 'Nonfiksi',
    year: 2012,
    publisher: 'Kompas',
    isbn: '9789797096502',
    status: 'Draft',
    rating: 0,
    readers: 0,
    dateAdded: '2024-07-01T12:00:00Z',
    coverUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=300',
    description: 'Biografi perjalanan hidup pengusaha Chairul Tanjung.'
  }
];

export const initialCategories: Category[] = [
  { id: '1', name: 'Novel', bookCount: 45 },
  { id: '2', name: 'Pendidikan', bookCount: 120 },
  { id: '3', name: 'Teknologi', bookCount: 85 },
  { id: '4', name: 'Komik', bookCount: 230 },
  { id: '5', name: 'Sejarah', bookCount: 34 },
  { id: '6', name: 'Agama', bookCount: 60 },
  { id: '7', name: 'Cerita Anak', bookCount: 150 },
  { id: '8', name: 'Fiksi', bookCount: 205 },
  { id: '9', name: 'Nonfiksi', bookCount: 95 },
];

export const initialUsers: User[] = [
  {
    id: 'u_habib',
    name: 'Habib Ramadhan',
    email: 'habib26@sekolah.id',
    username: 'habib26',
    joinDate: '2026-11-10T08:00:00Z',
    booksRead: 1,
    booksCompleted: 0,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'u1',
    name: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    username: 'budisantoso',
    joinDate: '2026-11-10T08:00:00Z',
    booksRead: 15,
    booksCompleted: 12,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'u2',
    name: 'Siti Aminah',
    email: 'siti.aminah@email.com',
    username: 'sitiaminah',
    joinDate: '2026-11-10T09:15:00Z',
    booksRead: 42,
    booksCompleted: 38,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'u3',
    name: 'Andi Wiryawan',
    email: 'andi.w@email.com',
    username: 'andiwiryawan',
    joinDate: '2023-06-20T09:15:00Z',
    booksRead: 5,
    booksCompleted: 2,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'u4',
    name: 'Rina Kartika',
    email: 'rina.kar@email.com',
    username: 'rinakartika',
    joinDate: '2023-08-05T11:45:00Z',
    booksRead: 28,
    booksCompleted: 20,
    status: 'Inactive',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'u5',
    name: 'Dewi Lestari',
    email: 'dewi.l@email.com',
    username: 'dewilestari',
    joinDate: '2023-11-12T16:20:00Z',
    booksRead: 56,
    booksCompleted: 50,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
  }
];

export const initialHistory: HistoryItem[] = [
  {
    id: 'h-today-1',
    bookId: 'book_1793889302336',
    bookTitle: 'BULAN',
    author: 'Tere Liye',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=300',
    userId: 'u1',
    userName: 'Andi Pratama',
    userEmail: 'andi.pratama@email.com',
    progress: 30,
    currentPage: 120,
    totalPages: 401,
    lastRead: '2026-11-10T09:20:00.000Z',
    status: 'Sedang Dibaca'
  },
  {
    id: 'h-today-2',
    bookId: 'b2',
    bookTitle: 'Laskar Pelangi',
    author: 'Andrea Hirata',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=300',
    userId: 'u2',
    userName: 'Siti Aminah',
    userEmail: 'siti.aminah@email.com',
    progress: 10,
    currentPage: 53,
    totalPages: 529,
    lastRead: '2026-11-10T10:15:00.000Z',
    status: 'Sedang Dibaca'
  },
  {
    id: 'h-bulan',
    bookId: 'book_1793889302336',
    bookTitle: 'BULAN',
    author: 'Tere Liye',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=300',
    userId: 'u1',
    userName: 'Andi Pratama',
    userEmail: 'andi.pratama@email.com',
    progress: 18,
    currentPage: 72,
    totalPages: 401,
    lastRead: '2026-11-05T14:35:00.000Z',
    status: 'Sedang Dibaca'
  },
  {
    id: 'h1',
    bookId: 'b1',
    bookTitle: 'Bumi Manusia',
    author: 'Pramoedya Ananta Toer',
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300',
    userId: 'u2',
    userName: 'Siti Aminah',
    userEmail: 'siti.aminah@email.com',
    progress: 45,
    currentPage: 135,
    totalPages: 300,
    lastRead: '2026-11-05T11:20:00.000Z',
    status: 'Sedang Dibaca'
  },
  {
    id: 'h2',
    bookId: 'b4',
    bookTitle: 'Atomic Habits',
    author: 'James Clear',
    coverUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=300',
    userId: 'u3',
    userName: 'Budi Santoso',
    userEmail: 'budi.santoso@email.com',
    progress: 100,
    currentPage: 320,
    totalPages: 320,
    lastRead: '2026-11-04T10:15:00.000Z',
    status: 'Selesai'
  },
  {
    id: 'h3',
    bookId: 'b3',
    bookTitle: 'Sapiens: Riwayat Singkat Umat Manusia',
    author: 'Yuval Noah Harari',
    coverUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=300',
    userId: 'u4',
    userName: 'Dewi Lestari',
    userEmail: 'dewi.lestari@email.com',
    progress: 12,
    currentPage: 50,
    totalPages: 416,
    lastRead: '2026-11-01T08:20:00.000Z',
    status: 'Sedang Dibaca'
  }
];

export const initialActivity: ActivityLog[] = [
  {
    id: 'a1',
    user: 'Siti Aminah',
    action: 'Mendaftar',
    target: 'Akun Baru',
    time: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    status: 'Success'
  },
  {
    id: 'a2',
    user: 'Budi Santoso',
    action: 'Menyelesaikan',
    target: 'Buku: Atomic Habits',
    time: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    status: 'Success'
  },
  {
    id: 'a3',
    user: 'Andi Wiryawan',
    action: 'Gagal Login',
    target: 'Sistem',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    status: 'Error'
  },
  {
    id: 'a4',
    user: 'Admin',
    action: 'Menambahkan',
    target: 'Buku: Filosofi Teras',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    status: 'Success'
  },
  {
    id: 'a5',
    user: 'Rina Kartika',
    action: 'Membaca',
    target: 'Buku: Bumi Manusia',
    time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    status: 'Success'
  }
];

export const initialReviews: BookReview[] = [
  {
    id: 'rev1',
    bookId: 'b1',
    userName: 'Andi Pratama',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    rating: 5,
    comment: 'Buku karya Pramoedya ini benar-benar membuka mata tentang sejarah dan martabat manusia. Alur kisahnya sangat menyentuh!',
    createdAt: '2024-03-10T14:20:00Z'
  },
  {
    id: 'rev2',
    bookId: 'b1',
    userName: 'Siti Nurhaliza',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    rating: 5,
    comment: 'Gaya bahasanya puitis tapi tegas. Karakter Minke dan Nyai Ontosoroh sangat membekas di ingatan.',
    createdAt: '2024-03-12T09:15:00Z'
  },
  {
    id: 'rev3',
    bookId: 'b2',
    userName: 'Budi Santoso',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
    rating: 5,
    comment: 'Kisah Laskar Pelangi selalu berhasil membakar semangat belajar. Perjuangan anak-anak Belitong patut dicontoh semua siswa.',
    createdAt: '2024-03-14T11:45:00Z'
  },
  {
    id: 'rev4',
    bookId: 'b2',
    userName: 'Rina Kartika',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
    rating: 4,
    comment: 'Sangat inspiratif dan menyentuh. Humor khas Melayu Belitung membuat novel ini renyah dibaca sampai tuntas.',
    createdAt: '2024-03-15T16:30:00Z'
  },
  {
    id: 'rev5',
    bookId: 'b3',
    userName: 'Dewi Lestari',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    rating: 5,
    comment: 'Stoisisme yang dibawakan dengan bahasa Indonesia yang santai dan relate dengan keresahan generasi masa kini.',
    createdAt: '2024-03-16T18:00:00Z'
  }
];

export const initialBanners: PromoBanner[] = [
  {
    id: 'ban1',
    title: 'Jelajahi Dunia Literasi Bersama BacaYuk',
    subtitle: 'Baca kapan saja, di mana saja. Ribuan naskah digital membuka cakrawala pengetahuan.',
    badge: 'Unggulan',
    buttonText: 'Jelajahi Koleksi',
    targetType: 'explore',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    bgColor: '#3a2012',
    status: 'Active',
    order: 1
  },
  {
    id: 'ban2',
    title: 'Spesial Hari Pahlawan: Jejak Sejarah Bangsa',
    subtitle: 'Kisah perjuangan, keteguhan, dan kemerdekaan dalam lembaran naskah bersejarah.',
    badge: 'Spesial Hari Pahlawan',
    buttonText: 'Baca Sekarang',
    targetType: 'book',
    targetValue: 'b11',
    imageUrl: 'https://images.unsplash.com/photo-1474366521946-c3d4b507abf2?auto=format&fit=crop&w=600&q=80',
    bgColor: '#8a6d1c',
    status: 'Active',
    order: 2
  },
  {
    id: 'ban3',
    title: 'Cerita Rakyat & Fabel Nusantara untuk Generasi Cerdas',
    subtitle: 'Koleksi dongeng kaya pesan moral dan budi pekerti luhur warisan leluhur Indonesia.',
    badge: 'Cerita Nusantara',
    buttonText: 'Lihat Buku',
    targetType: 'category',
    targetValue: 'Cerita Anak',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    bgColor: '#2d3748',
    status: 'Active',
    order: 3
  }
];

export const initialCurations: CuratedShelf[] = [
  {
    id: 'cur1',
    title: 'Pilihan Editor',
    description: 'Naskah pilihan kurator BacaYuk dengan kedalaman cerita, inspirasi, dan rating tertinggi.',
    badge: 'Rekomendasi Utama',
    icon: 'Sparkles',
    bookIds: ['b1', 'b4', 'b18', 'b2'],
    status: 'Active',
    order: 1
  },
  {
    id: 'cur2',
    title: 'Buku Cerita Rakyat & Nusantara',
    description: 'Kearifan lokal dan dongeng warisan nusantara yang mendidik serta memikat anak-anak.',
    badge: 'Warisan Budaya',
    icon: 'BookOpen',
    bookIds: ['b20', 'b12', 'b13', 'b8'],
    status: 'Active',
    order: 2
  },
  {
    id: 'cur3',
    title: 'Spesial Hari Pahlawan & Sejarah',
    description: 'Napak tilas perjuangan kemerdekaan, perlawanan, dan saksi sejarah bangsa Indonesia.',
    badge: 'Refleksi Sejarah',
    icon: 'Flame',
    bookIds: ['b11', 'b18', 'b1', 'b3'],
    status: 'Active',
    order: 3
  }
];

export const initialLoans: CirculationLoan[] = [
  {
    id: 'ln-105',
    bookId: 'b2',
    bookTitle: 'Laskar Pelangi',
    bookCover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=300',
    userId: 'u2',
    userName: 'Siti Aminah',
    userEmail: 'siti.aminah@email.com',
    borrowDate: '2026-11-10',
    dueDate: '2026-11-17',
    status: 'Dipinjam',
    fineAmount: 0,
    notes: 'Peminjaman buku Laskar Pelangi oleh siswa Siti Aminah.'
  },
  {
    id: 'ln-100',
    bookId: 'book_1793889302336',
    bookTitle: 'BULAN',
    bookCover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=300',
    userId: 'u1',
    userName: 'Andi Pratama',
    userEmail: 'andi.pratama@email.com',
    borrowDate: '2026-11-10',
    dueDate: '2026-11-17',
    status: 'Dipinjam',
    fineAmount: 0,
    notes: 'Peminjaman novel BULAN karya Tere Liye oleh siswa.'
  },
  {
    id: 'ln-101',
    bookId: 'b1',
    bookTitle: 'Bumi Manusia',
    bookCover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300',
    userId: 'u1',
    userName: 'Budi Santoso',
    userEmail: 'budi.santoso@email.com',
    borrowDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString().split('T')[0],
    status: 'Dipinjam',
    fineAmount: 0,
    notes: 'Peminjaman daring untuk tugas literasi sekolah.'
  },
  {
    id: 'ln-102',
    bookId: 'b4',
    bookTitle: 'Atomic Habits',
    bookCover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=300',
    userId: 'u2',
    userName: 'Siti Aminah',
    userEmail: 'siti.aminah@email.com',
    borrowDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString().split('T')[0],
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0],
    status: 'Terlambat',
    fineAmount: 3000,
    notes: 'Terlambat 3 hari. Pengingat SMS & Notifikasi telah dikirim.'
  },
  {
    id: 'ln-103',
    bookId: 'b18',
    bookTitle: 'Laut Bercerita',
    bookCover: 'https://images.unsplash.com/photo-1439405326854-014607f694d7?auto=format&fit=crop&q=80&w=300',
    userId: 'u5',
    userName: 'Dewi Lestari',
    userEmail: 'dewi.l@email.com',
    borrowDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().split('T')[0],
    status: 'Dipinjam',
    fineAmount: 0,
    notes: 'Akses digital premium 7 hari.'
  },
  {
    id: 'ln-104',
    bookId: 'b2',
    bookTitle: 'Laskar Pelangi',
    bookCover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=300',
    userId: 'u3',
    userName: 'Andi Wiryawan',
    userEmail: 'andi.w@email.com',
    borrowDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0],
    returnDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString().split('T')[0],
    status: 'Dikembalikan',
    fineAmount: 0,
    notes: 'Dikembalikan tepat waktu.'
  }
];

// Helper to initialize local storage
export const initLocalStorage = () => {
  if (!localStorage.getItem('bacayuk_books')) {
    localStorage.setItem('bacayuk_books', JSON.stringify(initialBooks));
  }
  if (!localStorage.getItem('bacayuk_categories')) {
    localStorage.setItem('bacayuk_categories', JSON.stringify(initialCategories));
  }
  if (!localStorage.getItem('bacayuk_users')) {
    localStorage.setItem('bacayuk_users', JSON.stringify(initialUsers));
  }
  if (!localStorage.getItem('bacayuk_history')) {
    localStorage.setItem('bacayuk_history', JSON.stringify(initialHistory));
  }
  if (!localStorage.getItem('bacayuk_activity')) {
    localStorage.setItem('bacayuk_activity', JSON.stringify(initialActivity));
  }
  if (!localStorage.getItem('bacayuk_reviews')) {
    localStorage.setItem('bacayuk_reviews', JSON.stringify(initialReviews));
  }
  if (!localStorage.getItem('bacayuk_banners')) {
    localStorage.setItem('bacayuk_banners', JSON.stringify(initialBanners));
  }
  if (!localStorage.getItem('bacayuk_curations')) {
    localStorage.setItem('bacayuk_curations', JSON.stringify(initialCurations));
  }
  if (!localStorage.getItem('bacayuk_circulation')) {
    localStorage.setItem('bacayuk_circulation', JSON.stringify(initialLoans));
  }
  if (!localStorage.getItem('bacayuk_loans')) {
    localStorage.setItem('bacayuk_loans', JSON.stringify(initialLoans));
  }

  // Auto-heal data jika belum lengkap dengan tanggal terkini
  try {
    const existingBooks = localStorage.getItem('bacayuk_books');
    if (existingBooks) {
      const parsed = JSON.parse(existingBooks);
      if (Array.isArray(parsed)) {
        let changed = false;
        const updated = parsed.map((b: any) => {
          if (b.id === 'book_1793889302336' && !b.dateAdded?.startsWith('2026-11-10')) {
            changed = true;
            return { ...b, dateAdded: '2026-11-10T08:00:00Z' };
          }
          if (b.id === 'b2' && !b.dateAdded?.startsWith('2026-11-10')) {
            changed = true;
            return { ...b, dateAdded: '2026-11-10T09:30:00Z' };
          }
          return b;
        });
        if (changed) {
          localStorage.setItem('bacayuk_books', JSON.stringify(updated));
        }
      }
    }

    const existingUsers = localStorage.getItem('bacayuk_users');
    if (existingUsers) {
      const parsed = JSON.parse(existingUsers);
      if (Array.isArray(parsed)) {
        let changed = false;
        let updated = parsed.map((u: any) => {
          if (u.id === 'u1' && !u.joinDate?.startsWith('2026-11-10')) {
            changed = true;
            return { ...u, joinDate: '2026-11-10T08:00:00Z' };
          }
          if (u.id === 'u2' && !u.joinDate?.startsWith('2026-11-10')) {
            changed = true;
            return { ...u, joinDate: '2026-11-10T09:15:00Z' };
          }
          return u;
        });

        // Pastikan akun Habib Ramadhan terdaftar di daftar anggota perpustakaan
        if (!updated.some((u: any) => u.username?.toLowerCase().includes('habib') || u.name?.toLowerCase().includes('habib'))) {
          changed = true;
          updated = [
            {
              id: 'u_habib',
              name: 'Habib Ramadhan',
              email: 'habib26@sekolah.id',
              username: 'habib26',
              joinDate: '2026-11-10T08:00:00Z',
              booksRead: 1,
              booksCompleted: 0,
              status: 'Active',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
            },
            ...updated
          ];
        }

        if (changed) {
          localStorage.setItem('bacayuk_users', JSON.stringify(updated));
        }
      }
    }

    const existingHist = localStorage.getItem('bacayuk_history');
    if (existingHist) {
      const parsed = JSON.parse(existingHist);
      if (Array.isArray(parsed)) {
        if (parsed.some((h: any) => !h.userName) || !parsed.some((h: any) => h.id === 'h-today-1') || !parsed.some((h: any) => h.lastRead?.startsWith('2026-11-10'))) {
          // Merge initialHistory with any existing custom items
          const existingIds = new Set(parsed.map((item: any) => item.id));
          const missingInitials = initialHistory.filter(h => !existingIds.has(h.id));
          const merged = [...missingInitials, ...parsed.filter((h: any) => h.userName)].map((h: any) => {
            if (h.id === 'h-today-1') return { ...h, lastRead: '2026-11-10T09:20:00.000Z' };
            if (h.id === 'h-today-2') return { ...h, lastRead: '2026-11-10T10:15:00.000Z' };
            return h;
          });
          localStorage.setItem('bacayuk_history', JSON.stringify(merged.length > 0 ? merged : initialHistory));
        }
      }
    }
    const existingCirc = localStorage.getItem('bacayuk_circulation') || localStorage.getItem('bacayuk_loans');
    if (existingCirc) {
      const parsed = JSON.parse(existingCirc);
      if (Array.isArray(parsed)) {
        if (!parsed.some((l: any) => l.id === 'ln-105' || l.id === 'ln-100') || !parsed.some((l: any) => l.borrowDate === '2026-11-10')) {
          const existingIds = new Set(parsed.map((item: any) => item.id));
          const missingInitials = initialLoans.filter(l => !existingIds.has(l.id));
          const merged = [...missingInitials, ...parsed].map((l: any) => {
            if (l.id === 'ln-105') return { ...l, borrowDate: '2026-11-10', dueDate: '2026-11-17' };
            if (l.id === 'ln-100') return { ...l, borrowDate: '2026-11-10', dueDate: '2026-11-17' };
            return l;
          });
          localStorage.setItem('bacayuk_circulation', JSON.stringify(merged));
          localStorage.setItem('bacayuk_loans', JSON.stringify(merged));
        }
      }
    }
  } catch {}
};

