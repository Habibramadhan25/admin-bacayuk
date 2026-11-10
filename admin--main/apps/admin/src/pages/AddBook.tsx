import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Upload,
  Save,
  X,
  Image as ImageIcon,
  Loader2,
  FileText,
  CheckCircle2,
  Trash2,
  Link2,
  Globe,
  ExternalLink,
  Star,
  MessageSquare,
  Sparkles,
  Info
} from 'lucide-react';
import { Book, BookChapter } from '../lib/mockData';
import { BULAN_CHAPTERS } from '../lib/bulanChapters';
import { saveBookFile } from '../lib/fileStorage';
import { ReviewStorage } from '../lib/reviewStorage';
import { realtime } from '../lib/realtime';
import { AdminNotificationStorage } from '../lib/notificationStorage';

function parseTextIntoChapters(text: string, defaultTitle: string): BookChapter[] {
  const clean = text.replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  const chapterRegex =
    /(?:\n|^)(?:(?:BAB|Bab|CHAPTER|Chapter|BAGIAN|Bagian)\s+[\dIVXLCDMivxlcdm]+[^\n]*|##?\s+[^\n]+)/g;
  const matches = [...clean.matchAll(chapterRegex)];

  if (matches.length >= 2) {
    const chapters: BookChapter[] = [];
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const title = match[0].trim().replace(/^#+\s*/, '');
      const startIndex = (match.index || 0) + match[0].length;
      const endIndex =
        i + 1 < matches.length
          ? matches[i + 1].index || clean.length
          : clean.length;
      const content = clean.slice(startIndex, endIndex).trim();
      chapters.push({
        id: `c${i + 1}`,
        title: title || `Bab ${i + 1}`,
        content: content || 'Halaman ini belum memiliki teks tambahan.',
      });
    }
    return chapters;
  }

  const paragraphs = clean.split(/\n\s*\n/).filter((p) => p.trim());
  if (paragraphs.length > 5) {
    const chunkSize = Math.ceil(paragraphs.length / 4);
    const chapters: BookChapter[] = [];
    for (let i = 0; i < paragraphs.length; i += chunkSize) {
      const chunk = paragraphs.slice(i, i + chunkSize);
      const chIndex = Math.floor(i / chunkSize) + 1;
      chapters.push({
        id: `c${chIndex}`,
        title: `Bab ${chIndex}: ${defaultTitle}`,
        content: chunk.join('\n\n'),
      });
    }
    return chapters;
  }

  return [
    {
      id: 'c1',
      title: `1. ${defaultTitle}`,
      content: clean,
    },
  ];
}

function compressImage(file: File, maxWidth = 400, maxHeight = 600, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(event.target?.result as string);
    };
    reader.onerror = () => resolve('');
  });
}

function safeSaveBooks(booksList: Book[]) {
  try {
    localStorage.setItem('bacayuk_books', JSON.stringify(booksList));
  } catch (quotaErr) {
    console.warn('LocalStorage kuota penuh, memangkas payload agar tidak error...', quotaErr);
    const optimized = booksList.map((b) => ({
      ...b,
      fileUrl: b.fileUrl?.startsWith('http') ? b.fileUrl : undefined,
      chapters: b.chapters?.map((ch) => ({
        ...ch,
        content: ch.content && ch.content.length > 2000 ? ch.content.slice(0, 2000) + '...' : ch.content,
      })),
    }));

    try {
      localStorage.setItem('bacayuk_books', JSON.stringify(optimized));
    } catch (retryErr) {
      console.warn('Masih melebihi kuota, kompresi lebih agresif...', retryErr);
      const minimal = optimized.map((b) => ({
        ...b,
        chapters: b.chapters?.map((ch) => ({
          id: ch.id,
          title: ch.title,
          content: ch.content ? ch.content.slice(0, 300) + '...' : '',
        })),
      }));
      localStorage.setItem('bacayuk_books', JSON.stringify(minimal));
    }
  }
}

const AddBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showFileUploadOption, setShowFileUploadOption] = useState(false);

  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl?: string;
    totalPages?: number;
    chapters?: BookChapter[];
  } | null>(() => {
    if (isEditing && id) {
      try {
        const books: Book[] = JSON.parse(
          localStorage.getItem('bacayuk_books') || '[]'
        );
        const book = books.find((b) => b.id === id);
        if (book && book.fileName) {
          return {
            name: book.fileName,
            size: book.fileSize || 'Ukuran valid',
            type: book.fileType || 'DOKUMEN',
            dataUrl: book.fileUrl,
            chapters: book.chapters,
          };
        }
      } catch {}
    }
    return null;
  });

  const [formData, setFormData] = useState<Partial<Book>>(() => {
    if (isEditing && id) {
      try {
        const books: Book[] = JSON.parse(
          localStorage.getItem('bacayuk_books') || '[]'
        );
        const book = books.find((b) => b.id === id);
        if (book) return book;
      } catch {}
    }
    return {
      title: '',
      author: '',
      description: '',
      category: 'Fiksi',
      year: 2026,
      publisher: '',
      isbn: '',
      status: 'Draft',
      coverUrl: '',
      fileUrl: '',
      sourceName: '',
      sourceUrl: '',
    };
  });

  // Nilai Link Buku Utama (Cukup Pakai Link)
  const [bookLink, setBookLink] = useState<string>(() => {
    return formData.fileUrl && !formData.fileUrl.startsWith('data:') ? formData.fileUrl : '';
  });

  // Fitur Ulasan Buku
  const [curatorReview, setCuratorReview] = useState<{
    rating: number;
    reviewerName: string;
    comment: string;
  }>({
    rating: 5,
    reviewerName: 'Admin Perpustakaan',
    comment: '',
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    const fileSize = formatSize(file.size);

    let fileType = ext.toUpperCase();
    if (ext === 'docx' || ext === 'doc') fileType = 'WORD';
    else if (ext === 'pdf') fileType = 'PDF';
    else if (ext === 'epub') fileType = 'EPUB';
    else if (ext === 'txt') fileType = 'TEXT';

    let extractedChapters: BookChapter[] = [];
    let detectedPdfPages: number | undefined;

    if (ext === 'txt' || ext === 'md' || ext === 'rtf') {
      try {
        const text = await file.text();
        extractedChapters = parseTextIntoChapters(
          text,
          formData.title || fileName.replace(/\.[^/.]+$/, '')
        );
      } catch (err) {
        console.warn('Gagal membaca file text:', err);
      }
    } else if (ext === 'docx') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = await import('mammoth');
        const res = await mammoth.extractRawText({ arrayBuffer });
        if (res.value && res.value.trim()) {
          extractedChapters = parseTextIntoChapters(
            res.value,
            formData.title || fileName.replace(/\.[^/.]+$/, '')
          );
        }
      } catch (err) {
        console.warn('Gagal membaca file word docx:', err);
      }
    } else if (ext === 'pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        if (pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        }
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
        });
        const pdfDoc = await loadingTask.promise;
        detectedPdfPages = pdfDoc.numPages;
        const pageTexts: string[] = [];
        for (let p = 1; p <= pdfDoc.numPages; p++) {
          const page = await pdfDoc.getPage(p);
          const content = await page.getTextContent();
          const strings = content.items
            .map((item: any) => ('str' in item ? item.str : ''))
            .filter((s: string) => s.trim().length > 0);
          const pageStr = strings.join(' ').trim();
          if (pageStr) {
            pageTexts.push(pageStr);
          }
        }
        if (pageTexts.length > 0) {
          const fullPdfText = pageTexts.join('\n\n');
          const parsed = parseTextIntoChapters(
            fullPdfText,
            formData.title || fileName.replace(/\.[^/.]+$/, '')
          );
          if (parsed && parsed.length > 0) {
            extractedChapters = parsed;
          }
        }
      } catch (err) {
        console.warn('Gagal mengekstrak teks PDF dengan pdfjs:', err);
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedFile(file);
      setFileInfo({
        name: fileName,
        size: fileSize,
        type: fileType,
        dataUrl,
        totalPages: detectedPdfPages,
        chapters: extractedChapters.length > 0 ? extractedChapters : undefined,
      });
      setIsProcessingFile(false);
    };
    reader.onerror = () => {
      setIsProcessingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (
    e: React.FormEvent,
    status: 'Published' | 'Draft'
  ) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const books: Book[] = JSON.parse(
        localStorage.getItem('bacayuk_books') || '[]'
      );
      const defaultCover =
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400';
      const bookId = isEditing && id ? id : 'book_' + Date.now().toString();

      // Simpan file ke IndexedDB jika ada file lokal yang diupload
      if (uploadedFile) {
        try {
          await saveBookFile(bookId, {
            name: fileInfo?.name || uploadedFile.name,
            type: fileInfo?.type || 'PDF',
            size: uploadedFile.size,
            dataUrl: fileInfo?.dataUrl,
            blob: uploadedFile,
          });
        } catch (dbErr) {
          console.warn('Gagal menyimpan file ke IndexedDB:', dbErr);
        }
      }

      // Format link & naskah buku
      const trimmedLink = bookLink.trim();
      const isLinkProvided = trimmedLink.length > 0;
      const finalFileUrl = isLinkProvided 
        ? trimmedLink 
        : (formData.fileUrl?.startsWith('http') ? formData.fileUrl : undefined);
      
      const isPdfLink = finalFileUrl ? finalFileUrl.toLowerCase().includes('.pdf') : false;

      const finalFileName = isLinkProvided
        ? (formData.title ? `${formData.title} (Tautan Digital)` : 'Tautan Naskah Online')
        : (fileInfo?.name || formData.fileName || 'Naskah Digital');

      const finalFileSize = isLinkProvided
        ? 'Tautan Daring / Web'
        : (fileInfo?.size || formData.fileSize || 'Dokumen Digital');

      const finalFileType = isLinkProvided
        ? (isPdfLink ? 'PDF' : 'LINK')
        : (fileInfo?.type || formData.fileType || 'DOKUMEN');

      const isBulan = Boolean(
        /bulan/i.test(formData.title || '') ||
        /bulan/i.test(finalFileName || '') ||
        finalFileUrl?.includes('1Asc4x3ydaAE6YLNUiwsVbYHMMjYyk2W_') ||
        (bookId && /bulan|1793889302336/i.test(bookId))
      );

      const finalChapters = isBulan
        ? BULAN_CHAPTERS
        : (fileInfo?.chapters && fileInfo.chapters.length > 0
            ? fileInfo.chapters
            : (formData.chapters && formData.chapters.length > 0
                ? formData.chapters
                : undefined));

      const finalTotalPages = isBulan
        ? 401
        : (fileInfo?.totalPages || (formData as any).totalPages || (finalChapters?.length ? finalChapters.length * 15 : 180));

      const cover = formData.coverUrl || defaultCover;
      const safeBookPayload = {
        ...formData,
        id: bookId,
        coverUrl: cover,
        sourceName: formData.sourceName?.trim() || undefined,
        sourceUrl: formData.sourceUrl?.trim() || undefined,
        fileName: finalFileName,
        fileSize: finalFileSize,
        fileType: finalFileType,
        fileUrl: finalFileUrl,
        totalPages: finalTotalPages,
        chapters: finalChapters,
        status,
      };

      let finalBook: Book;
      let finalBooksList: Book[];

      if (isEditing) {
        finalBook = {
          ...books.find((b) => b.id === id)!,
          ...safeBookPayload,
          coverUrl: safeBookPayload.coverUrl || defaultCover,
          fileUrl: safeBookPayload.fileUrl || undefined,
        } as Book;

        finalBooksList = books.map((b) => (b.id === id ? finalBook : b));
        safeSaveBooks(finalBooksList);
        setToastMessage('Data buku berhasil diperbarui.');
      } else {
        finalBook = {
          ...safeBookPayload,
          rating: curatorReview.comment.trim() ? curatorReview.rating : 4.8,
          readers: 0,
          dateAdded: new Date().toISOString().split('T')[0],
        } as Book;

        finalBooksList = [finalBook, ...books];
        safeSaveBooks(finalBooksList);
        setToastMessage('Buku baru berhasil ditambahkan.');
      }

      // Tambahkan ulasan jika diisi oleh kurator/admin
      if (curatorReview.comment.trim()) {
        try {
          ReviewStorage.addReview({
            bookId,
            userName: curatorReview.reviewerName.trim() || 'Admin Perpustakaan',
            userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            rating: curatorReview.rating,
            comment: curatorReview.comment.trim(),
          });
        } catch (errReview) {
          console.warn('Gagal menyimpan ulasan kurator:', errReview);
        }
      }

      // 1. Tambahkan ke notifikasi Admin
      AdminNotificationStorage.addNotification({
        type: isEditing ? 'BOOK_UPDATED' : 'BOOK_CREATED',
        title: isEditing ? 'Buku Berhasil Diperbarui' : 'Buku Berhasil Diterbitkan',
        message: isEditing
          ? `Perubahan data buku "${safeBookPayload.title}" telah disimpan dan disinkronkan ke siswa.`
          : `Buku baru "${safeBookPayload.title}" oleh ${safeBookPayload.author || 'Penulis'} berhasil diterbitkan ke katalog bacaan.`,
        targetUrl: '/books',
        targetId: bookId,
        meta: {
          bookTitle: safeBookPayload.title,
          bookCover: safeBookPayload.coverUrl || defaultCover,
          bookAuthor: safeBookPayload.author,
          bookCategory: safeBookPayload.category,
        },
      });

      // 2. Siapkan notifikasi untuk disiarkan ke aplikasi siswa secara real-time
      const studentNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: isEditing ? 'BOOK_UPDATED' : 'BOOK_CREATED',
        title: isEditing ? 'Koleksi Diperbarui' : 'Buku Baru Ditambahkan!',
        message: isEditing
          ? `Admin memperbarui buku "${safeBookPayload.title}". Cek naskah dan edisi terbarunya sekarang!`
          : `Admin baru saja menambahkan buku "${safeBookPayload.title}" oleh ${safeBookPayload.author || 'Penulis'}. Siap dibaca!`,
        time: new Date().toISOString(),
        read: false,
        targetId: bookId,
        targetType: 'book',
        meta: {
          bookTitle: safeBookPayload.title,
          bookCover: safeBookPayload.coverUrl || defaultCover,
          bookAuthor: safeBookPayload.author,
          bookCategory: safeBookPayload.category,
        },
      };

      // 3. Publikasikan event real-time ke semua tab & aplikasi mobile siswa
      realtime.publish('BOOK_CREATED', {
        action: isEditing ? 'updated' : 'created',
        bookId,
        title: safeBookPayload.title,
        author: safeBookPayload.author,
        coverUrl: safeBookPayload.coverUrl || defaultCover,
        category: safeBookPayload.category,
        book: finalBook,
        books: finalBooksList,
        notification: studentNotification,
      });

      // 4. Sinkronkan seluruh list buku ke server
      try {
        fetch('/api/realtime/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ books: finalBooksList }),
        }).catch(() => {});
      } catch {}

      window.dispatchEvent(new Event('bacayuk_books_updated'));
      window.dispatchEvent(new Event('storage'));

      setToastMessage(isEditing ? 'Buku berhasil diperbarui!' : 'Buku berhasil ditambahkan ke perpustakaan!');
      setShowToast(true);
      setTimeout(() => {
        navigate('/books');
      }, 1000);
    } catch (err: any) {
      console.error('Error saat menyimpan buku:', err);
      setToastMessage('Gagal menyimpan buku: ' + (err?.message || 'Memori browser penuh'));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/books')}
          className="p-2 hover:bg-[#d4c3a3] rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-[#5a3a22]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#2a160b]">
            {isEditing ? 'Edit Buku' : 'Tambah Buku Baru'}
          </h1>
          <p className="text-[#8a6d1c]">
            {isEditing
              ? 'Ubah informasi dan tautan buku digital'
              : 'Cukup masukkan tautan/link naskah dan informasi buku untuk menambahkan ke perpustakaan'}
          </p>
        </div>
      </div>

      <form className="bg-[#f9f6f0] rounded-xl shadow-sm border border-[#d4c3a3] p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom Kiri: Cover Buku & Petunjuk */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#3a2012] mb-2">
                Cover Buku
              </label>
              <div className="flex justify-center">
                <div className="w-44 h-60 border-2 border-dashed border-[#c2b192] rounded-xl p-2 text-center hover:bg-[#ebdcb8] transition-colors cursor-pointer group flex flex-col items-center justify-center relative overflow-hidden bg-[#ebdcb8]/50 shadow-xs">
                  {formData.coverUrl ? (
                    <>
                      <img
                        src={formData.coverUrl}
                        alt="Cover Preview"
                        className="absolute inset-0 w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-lg backdrop-blur-sm">
                        <span className="text-[#f9f6f0] font-medium text-sm">
                          Ganti Cover
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData((prev) => ({ ...prev, coverUrl: '' }));
                          }}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-[#f9f6f0] text-xs rounded-md font-medium transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-[#a49373] mb-2 group-hover:text-[#8a6d1c] transition-colors" />
                      <p className="text-xs font-medium text-[#5a3a22] px-2">
                        Klik atau drag foto cover
                      </p>
                      <p className="text-[10px] text-[#a49373] mt-1">Maks. 2MB</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        try {
                          const compressed = await compressImage(file, 400, 600, 0.82);
                          setFormData((prev) => ({
                            ...prev,
                            coverUrl: compressed,
                          }));
                        } catch {
                          const reader = new FileReader();
                          reader.onload = (ev) =>
                            setFormData((prev) => ({
                              ...prev,
                              coverUrl: ev.target?.result as string,
                            }));
                          reader.readAsDataURL(file);
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Kotak Info: Cukup Gunakan Link */}
            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#ebdcb8] space-y-2 text-xs text-[#5a3a22] shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-[#8a6d1c]">
                <Sparkles className="w-4 h-4 text-[#8a6d1c]" />
                <span>Cukup Pakai Link URL</span>
              </div>
              <p className="leading-relaxed">
                Anda tidak perlu repot mengunggah file PDF. Cukup masukkan link Google Drive, web reader, atau tautan naskah daring agar siswa dapat membaca secara instan.
              </p>
            </div>
          </div>

          {/* Kolom Kanan: Informasi Utama, Input Link, Sinopsis, dan Ulasan */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* 1. INFORMASI BUKU */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#3a2012] border-b border-[#d4c3a3] pb-2">
                1. Informasi Pokok Buku
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">
                    Judul Buku *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-white font-medium"
                    placeholder="Contoh: Laskar Pelangi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">
                    Penulis *
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-white font-medium"
                    placeholder="Contoh: Andrea Hirata"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">
                    Kategori Genre
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-white font-medium"
                  >
                    <option value="Novel">Novel</option>
                    <option value="Pendidikan">Pendidikan</option>
                    <option value="Teknologi">Teknologi</option>
                    <option value="Komik">Komik</option>
                    <option value="Sejarah">Sejarah</option>
                    <option value="Agama">Agama</option>
                    <option value="Cerita Anak">Cerita Anak</option>
                    <option value="Fiksi">Fiksi</option>
                    <option value="Nonfiksi">Nonfiksi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">
                    Tahun Terbit
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">
                    Penerbit
                  </label>
                  <input
                    type="text"
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleChange}
                    placeholder="Contoh: Gramedia"
                    className="w-full px-3 py-2 text-xs border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-white font-medium"
                  />
                </div>
              </div>
            </div>

            {/* 2. INPUT LINK NASKAH BUKU (METODE UTAMA: CUKUP PAKAI LINK) */}
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border-2 border-[#8a6d1c]/50 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#ebdcb8] text-[#8a6d1c] flex items-center justify-center border border-[#d4c3a3]">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#2a160b]">
                      Tautan / Link Naskah Buku Digital
                    </h3>
                    <p className="text-[11px] text-[#8a6d1c]">
                      Cukup masukkan tautan URL (Tidak perlu mengunggah file PDF)
                    </p>
                  </div>
                </div>

                {bookLink.trim() ? (
                  <a
                    href={bookLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#8a6d1c] hover:underline bg-white px-2.5 py-1 rounded-md border border-[#c2b192] shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Uji Link</span>
                  </a>
                ) : null}
              </div>

              <div>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a6d1c]" />
                  <input
                    type="url"
                    name="fileUrl"
                    value={bookLink}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBookLink(val);
                      setFormData((prev) => ({
                        ...prev,
                        fileUrl: val,
                        fileType: val.toLowerCase().includes('.pdf') ? 'PDF' : 'LINK',
                        fileName: prev.title ? `${prev.title} (Tautan Digital)` : 'Tautan Naskah Online',
                      }));
                    }}
                    placeholder="Tempelkan link di sini: https://contoh.com/buku atau link Google Drive / PDF daring..."
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-[#c2b192] rounded-xl focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-white font-mono text-[#2a160b] shadow-2xs"
                  />
                </div>
              </div>

              {bookLink.trim() ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tautan Buku Siap Diakses oleh Siswa</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed break-all">
                    Format terdeteksi:{' '}
                    <span className="font-bold uppercase">
                      {bookLink.toLowerCase().includes('.pdf') ? 'Dokumen PDF Online' : 'Tautan Web / E-Book Reader'}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-[#ebdcb8]/40 border border-[#d4c3a3] rounded-xl text-[11.5px] text-[#5a3a22] leading-relaxed">
                  <Info className="w-4 h-4 text-[#8a6d1c] shrink-0 mt-0.5" />
                  <span>
                    <strong>Tips Cepat:</strong> Cukup paste link Google Drive naskah, web reader, atau dokumen PDF daring Anda di atas.
                  </span>
                </div>
              )}

              {/* Opsi Opsional: Upload File Lokal */}
              <div className="pt-2 border-t border-[#ebdcb8]">
                <button
                  type="button"
                  onClick={() => setShowFileUploadOption((prev) => !prev)}
                  className="text-[11.5px] font-bold text-[#8a6d1c] hover:underline flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {showFileUploadOption ? 'Tutup Opsi Upload File Lokal' : 'Ingin mengunggah file naskah PDF/Word lokal secara manual? (Opsional)'}
                  </span>
                </button>

                {showFileUploadOption && (
                  <div className="mt-3 p-3.5 bg-white rounded-xl border border-[#d4c3a3] space-y-2.5 animate-in fade-in duration-200">
                    <p className="text-xs text-[#5a3a22]">
                      Unggah file dokumen offline jika Anda tidak memiliki link daring:
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.epub,.txt,.rtf"
                        onChange={handleFileChange}
                        className="text-xs text-[#5a3a22] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#ebdcb8] file:text-[#3a2012] hover:file:bg-[#d4c3a3] cursor-pointer"
                      />
                      {isProcessingFile && (
                        <div className="flex items-center gap-1.5 text-xs text-[#8a6d1c]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengekstrak naskah...</span>
                        </div>
                      )}
                    </div>
                    {fileInfo?.name && (
                      <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>File lokal tersimpan: {fileInfo.name} ({fileInfo.size})</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3. SUMBER ASAL NASKAH & TAUTAN SUMBER (SOURCE ATTRIBUTION) */}
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#c2b192] space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#ebdcb8] text-[#8a6d1c] flex items-center justify-center border border-[#d4c3a3]">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#2a160b]">
                      3. Sumber Asal Naskah & Tautan Sumber Asli
                    </h3>
                    <p className="text-[11px] text-[#8a6d1c]">
                      Cantumkan nama lembaga/website asal naskah dan link sumbernya (misal: Kemendikbud, Perpusnas, Gutenberg)
                    </p>
                  </div>
                </div>

                {formData.sourceUrl?.trim() ? (
                  <a
                    href={formData.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#8a6d1c] hover:underline bg-white px-2.5 py-1 rounded-md border border-[#c2b192] shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Uji Link Sumber</span>
                  </a>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">
                    Nama / Lembaga Asal Sumber
                  </label>
                  <input
                    type="text"
                    name="sourceName"
                    value={formData.sourceName || ''}
                    onChange={handleChange}
                    placeholder="Contoh: Kemendikbud BSKAP / Perpusnas RI / Project Gutenberg"
                    className="w-full px-3 py-2 text-xs border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-white font-medium"
                  />
                  {/* Preset Cepat */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-[#8a6d1c] font-medium">Pilihan Cepat:</span>
                    {['Kemendikbud BSKAP', 'Perpusnas RI', 'Project Gutenberg', 'Wikisource', 'Archive.org'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, sourceName: preset }))}
                        className="text-[10px] bg-[#ebdcb8]/60 hover:bg-[#ebdcb8] text-[#5a3a22] font-semibold px-2 py-0.5 rounded-md border border-[#d4c3a3] transition-colors cursor-pointer"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">
                    Tautan / Link Sumber Asli (URL Sumber)
                  </label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a6d1c]" />
                    <input
                      type="url"
                      name="sourceUrl"
                      value={formData.sourceUrl || ''}
                      onChange={handleChange}
                      placeholder="Contoh: https://buku.kemdikbud.go.id/... atau https://www.gutenberg.org/..."
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-white font-mono text-[#2a160b]"
                    />
                  </div>
                  <p className="text-[10.5px] text-[#8a6d1c] mt-1.5 leading-relaxed">
                    🔗 Link sumber asli ini akan tampil di detail buku sehingga pembaca dapat melihat referensi resmi penerbit asal.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. DESKRIPSI & SINOPSIS */}
            <div>
              <label className="block text-xs font-bold text-[#3a2012] mb-1">
                4. Deskripsi / Sinopsis Naskah Buku
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 text-xs border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-white"
                placeholder="Tuliskan gambaran ringkas tentang isi naskah buku ini..."
              />
            </div>

            {/* 5. FITUR ULASAN BUAT BUKUNYA (REVIEW AWAL KURATOR / ADMIN) */}
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#c2b192] space-y-3.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ebdcb8] text-[#8a6d1c] flex items-center justify-center border border-[#d4c3a3]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2a160b]">
                    5. Fitur Ulasan Buku (Ulasan & Rekomendasi Kurator)
                  </h3>
                  <p className="text-[11px] text-[#8a6d1c]">
                    Sertakan ulasan atau ulasan awal untuk memikat minat baca siswa
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1.5">
                    Beri Bintang / Rating Awal
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setCuratorReview((prev) => ({ ...prev, rating: star }))}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= curatorReview.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-[#8a6d1c] ml-2">
                      {curatorReview.rating} dari 5 Bintang
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3a2012] mb-1">
                    Nama Pemberi Ulasan
                  </label>
                  <input
                    type="text"
                    value={curatorReview.reviewerName}
                    onChange={(e) => setCuratorReview((prev) => ({ ...prev, reviewerName: e.target.value }))}
                    placeholder="Contoh: Admin atau Kurator Literasi"
                    className="w-full px-3 py-1.5 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3a2012] mb-1">
                  Isi Ulasan / Rekomendasi Buku
                </label>
                <textarea
                  rows={2}
                  value={curatorReview.comment}
                  onChange={(e) => setCuratorReview((prev) => ({ ...prev, comment: e.target.value }))}
                  placeholder="Tulis ulasan menarik, pesan moral, atau alasan mengapa siswa wajib membaca buku ini..."
                  className="w-full px-3 py-2 text-xs border border-[#c2b192] rounded-lg outline-none focus:border-[#8a6d1c] bg-white"
                />
                <p className="text-[11px] text-[#8a6d1c] mt-1">
                  ⭐ Ulasan ini akan otomatis terdaftar dan langsung muncul di tab ulasan pada aplikasi mobile siswa.
                </p>
              </div>
            </div>

            {/* Tombol Simpan */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#d4c3a3]">
              <button
                type="button"
                onClick={() => navigate('/books')}
                className="px-5 py-2.5 border border-[#c2b192] text-[#5a3a22] font-bold text-xs rounded-xl hover:bg-[#ebdcb8] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'Draft')}
                disabled={loading}
                className="px-5 py-2.5 border border-[#c2b192] text-[#5a3a22] font-bold text-xs rounded-xl hover:bg-[#ebdcb8] transition-colors disabled:opacity-50"
              >
                Simpan sebagai Draft
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'Published')}
                disabled={loading}
                className="px-6 py-2.5 bg-[#3a2012] hover:bg-[#2a160b] text-[#f9f6f0] font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Publikasikan Buku</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Toast Sukses */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#3a2012] text-[#f9f6f0] px-5 py-3 rounded-2xl shadow-2xl border border-[#ebdcb8] flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AddBook;
